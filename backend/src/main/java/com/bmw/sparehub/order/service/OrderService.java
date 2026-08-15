package com.bmw.sparehub.order.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.cart.entity.Cart;
import com.bmw.sparehub.cart.entity.CartItem;
import com.bmw.sparehub.cart.repository.CartItemRepository;
import com.bmw.sparehub.cart.repository.CartRepository;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.delivery.dto.DeliveryDto;
import com.bmw.sparehub.delivery.entity.Delivery;
import com.bmw.sparehub.delivery.entity.DeliveryStatus;
import com.bmw.sparehub.delivery.repository.DeliveryRepository;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.inventory.service.InventoryService;
import com.bmw.sparehub.order.dto.*;
import com.bmw.sparehub.order.entity.*;
import com.bmw.sparehub.order.repository.*;
import com.bmw.sparehub.product.service.ProductService;
import com.bmw.sparehub.technician.dto.InstallationJobDto;
import com.bmw.sparehub.technician.dto.TechnicianDto;
import com.bmw.sparehub.technician.entity.InstallationJob;
import com.bmw.sparehub.technician.entity.JobStatus;
import com.bmw.sparehub.technician.entity.Technician;
import com.bmw.sparehub.technician.repository.InstallationJobRepository;
import com.bmw.sparehub.technician.repository.TechnicianRepository;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.repository.UserRepository;
import com.bmw.sparehub.user.service.UserService;
import com.bmw.sparehub.vehicle.entity.Vehicle;
import com.bmw.sparehub.vehicle.repository.VehicleRepository;
import com.bmw.sparehub.vehicle.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DeliveryRepository deliveryRepository;
    private final InstallationJobRepository installationJobRepository;
    private final TechnicianRepository technicianRepository;
    private final InventoryService inventoryService;
    private final ProductService productService;
    private final VehicleService vehicleService;
    private final UserService userService;
    private final AuditLogService auditLogService;

    // Address Management
    public List<AddressDto> getUserAddresses(UUID userId) {
        return addressRepository.findByUserId(userId).stream()
                .map(this::mapAddressToDto)
                .toList();
    }

    @Transactional
    public AddressDto addAddress(UUID userId, AddressDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Address address = Address.builder()
                .user(user)
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .landmark(dto.getLandmark())
                .build();

        addressRepository.save(address);
        return mapAddressToDto(address);
    }

    // Order Creation
    @Transactional
    public OrderDto createOrder(UUID userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Active cart not found"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot place order with an empty cart");
        }

        FulfillmentType fulfillmentType;
        try {
            fulfillmentType = FulfillmentType.valueOf(request.getFulfillmentType());
        } catch (Exception e) {
            throw new BadRequestException("Invalid fulfillment type: " + request.getFulfillmentType());
        }

        Vehicle vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId).orElse(null);
        }

        // Handle Address for Delivery or Installation
        Address address = null;
        if (fulfillmentType == FulfillmentType.DELIVERY || fulfillmentType == FulfillmentType.INSTALLATION) {
            if (request.getAddressId() != null) {
                address = addressRepository.findByIdAndUserId(request.getAddressId(), userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));
            } else if (request.getNewAddress() != null) {
                AddressDto newAddrDto = addAddress(userId, request.getNewAddress());
                address = addressRepository.findById(newAddrDto.getId()).orElse(null);
            } else {
                throw new BadRequestException("Address is required for Delivery or Installation");
            }
        }

        // Calculate Totals
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            BigDecimal itemTotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal deliveryFee = (fulfillmentType == FulfillmentType.DELIVERY) ? new BigDecimal("250.00") : BigDecimal.ZERO;
        BigDecimal installationFee = (fulfillmentType == FulfillmentType.INSTALLATION) ? new BigDecimal("750.00") : BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(deliveryFee).add(installationFee);

        String orderNum = "SPH-ORD-" + System.currentTimeMillis();

        Order order = Order.builder()
                .orderNumber(orderNum)
                .user(user)
                .vehicle(vehicle)
                .address(address)
                .fulfillmentType(fulfillmentType)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .deliveryFee(deliveryFee)
                .installationFee(installationFee)
                .totalAmount(totalAmount)
                .pickupDate(request.getAppointmentDate())
                .pickupTimeSlot(request.getAppointmentTimeSlot())
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        orderRepository.save(order);

        // Save Order Items & Reserve Inventory
        for (CartItem cartItem : cart.getItems()) {
            inventoryService.reserveStock(cartItem.getProduct().getId(), cartItem.getQuantity());

            BigDecimal itemTotal = cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(cartItem.getProduct())
                    .productName(cartItem.getProduct().getName())
                    .partNumber(cartItem.getProduct().getPartNumber())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getProduct().getPrice())
                    .totalPrice(itemTotal)
                    .build();

            orderItemRepository.save(orderItem);
            order.getItems().add(orderItem);
        }

        // Create Payment record
        PaymentMethod payMethod;
        try {
            payMethod = PaymentMethod.valueOf(request.getPaymentMethod());
        } catch (Exception e) {
            payMethod = PaymentMethod.UPI;
        }

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(payMethod)
                .status(PaymentStatus.COMPLETED)
                .transactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .amount(totalAmount)
                .build();

        paymentRepository.save(payment);

        // Setup Fulfillment Records
        if (fulfillmentType == FulfillmentType.DELIVERY) {
            Delivery delivery = Delivery.builder()
                    .order(order)
                    .deliveryStatus(DeliveryStatus.PENDING)
                    .deliveryAddress(address)
                    .trackingReference("SPH-DEL-" + orderNum.substring(8))
                    .estimatedDeliveryDate(LocalDate.now().plusDays(3))
                    .build();
            deliveryRepository.save(delivery);
        } else if (fulfillmentType == FulfillmentType.INSTALLATION) {
            InstallationJob job = InstallationJob.builder()
                    .order(order)
                    .status(JobStatus.PENDING)
                    .scheduledDate(request.getAppointmentDate() != null ? request.getAppointmentDate() : LocalDate.now().plusDays(2))
                    .scheduledTimeSlot(request.getAppointmentTimeSlot() != null ? request.getAppointmentTimeSlot() : "10:00 AM - 12:00 PM")
                    .build();
            installationJobRepository.save(job);
        }

        // Clear Customer Cart
        cartItemRepository.deleteByCartId(cart.getId());

        auditLogService.logAction(userId, "ORDER_CREATED", "ORDER", order.getId().toString(),
                "Placed order " + orderNum + " via " + fulfillmentType.name());

        log.info("Successfully created order {} for user {}", orderNum, userId);
        return mapToDto(order);
    }

    // Customer Queries
    public List<OrderDto> getCustomerOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    public PageResponse<OrderDto> getMyOrdersPaginated(UUID userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<OrderDto> mapped = page.getContent().stream().map(this::mapToDto).toList();
        return PageResponse.from(page, mapped);
    }

    public OrderDto getOrderById(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId) && !order.getUser().getRole().name().equals("ADMIN")) {
            throw new BadRequestException("Unauthorized access to order details");
        }
        return mapToDto(order);
    }

    public PageResponse<OrderDto> filterAdminOrders(String statusStr, String fulfillmentStr, String search, Pageable pageable) {
        OrderStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try { status = OrderStatus.valueOf(statusStr); } catch (Exception ignored) {}
        }

        FulfillmentType fulfillment = null;
        if (fulfillmentStr != null && !fulfillmentStr.isBlank()) {
            try { fulfillment = FulfillmentType.valueOf(fulfillmentStr); } catch (Exception ignored) {}
        }

        final OrderStatus finalStatus = status;
        final FulfillmentType finalFulfillment = fulfillment;

        org.springframework.data.jpa.domain.Specification<Order> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (finalStatus != null) {
                predicates.add(cb.equal(root.get("status"), finalStatus));
            }

            if (finalFulfillment != null) {
                predicates.add(cb.equal(root.get("fulfillmentType"), finalFulfillment));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate orderNumMatch = cb.like(cb.lower(root.get("orderNumber")), pattern);
                jakarta.persistence.criteria.Predicate userNameMatch = cb.like(cb.lower(root.get("user").get("name")), pattern);
                jakarta.persistence.criteria.Predicate userEmailMatch = cb.like(cb.lower(root.get("user").get("email")), pattern);
                predicates.add(cb.or(orderNumMatch, userNameMatch, userEmailMatch));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Order> page = orderRepository.findAll(spec, pageable);
        List<OrderDto> mapped = page.getContent().stream().map(this::mapToDto).toList();
        return PageResponse.from(page, mapped);
    }

    @Transactional
    public OrderDto updateOrderStatus(UUID orderId, String newStatusStr, UUID adminUserId) {
        return updateOrderStatus(orderId, newStatusStr, null, adminUserId);
    }

    @Transactional
    public OrderDto updateOrderStatus(UUID orderId, String newStatusStr, String notes, UUID adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus nextStatus;
        try {
            nextStatus = OrderStatus.valueOf(newStatusStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid OrderStatus: " + newStatusStr);
        }

        validateStatusTransition(order.getStatus(), nextStatus, order.getFulfillmentType());

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(nextStatus);
        orderRepository.save(order);

        // Sync fulfillment tables if applicable
        if (nextStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseReservedStock(item.getProduct().getId(), item.getQuantity());
            }
        }

        String description = "Changed status from " + previousStatus + " to " + nextStatus;
        if (notes != null && !notes.isBlank()) {
            description += ". Notes: " + notes;
        }
        auditLogService.logAction(adminUserId, "ORDER_STATUS_CHANGED", "ORDER", orderId.toString(), description);

        return mapToDto(order);
    }

    @Transactional
    public OrderDto assignTechnician(UUID orderId, UUID technicianId, LocalDate date, String slot, UUID adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getFulfillmentType() != FulfillmentType.INSTALLATION) {
            throw new BadRequestException("Order is not an INSTALLATION order");
        }

        Technician technician = technicianRepository.findById(technicianId)
                .or(() -> technicianRepository.findByUserId(technicianId))
                .orElseGet(() -> {
                    User user = userRepository.findById(technicianId)
                            .orElseThrow(() -> new ResourceNotFoundException("Technician", "id", technicianId));
                    Technician newTech = Technician.builder()
                            .user(user)
                            .name(user.getName())
                            .phone(user.getPhone())
                            .email(user.getEmail())
                            .status(com.bmw.sparehub.technician.entity.TechnicianStatus.AVAILABLE)
                            .build();
                    return technicianRepository.save(newTech);
                });

        InstallationJob job = installationJobRepository.findByOrderId(orderId)
                .orElseGet(() -> InstallationJob.builder().order(order).build());

        job.setTechnician(technician);
        job.setStatus(JobStatus.ASSIGNED);
        if (date != null) job.setScheduledDate(date);
        if (slot != null) job.setScheduledTimeSlot(slot);

        installationJobRepository.save(job);

        order.setStatus(OrderStatus.TECHNICIAN_ASSIGNED);
        orderRepository.save(order);

        auditLogService.logAction(adminUserId, "TECHNICIAN_ASSIGNED", "ORDER", orderId.toString(),
                "Assigned technician " + technician.getName() + " to installation job");

        return mapToDto(order);
    }

    @Transactional
    public OrderDto cancelOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId) && !order.getUser().getRole().name().equals("ADMIN")) {
            throw new BadRequestException("Unauthorized to cancel this order");
        }

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel an order that is already " + order.getStatus());
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Release reserved stock back to inventory
        for (OrderItem item : order.getItems()) {
            inventoryService.releaseReservedStock(item.getProduct().getId(), item.getQuantity());
        }

        auditLogService.logAction(userId, "ORDER_CANCELLED", "ORDER", orderId.toString(),
                "Order cancelled (was " + previousStatus + ")");

        return mapToDto(order);
    }

    @Transactional
    public OrderDto assignDeliveryExecutive(UUID orderId, UUID deliveryExecutiveUserId, LocalDate estDate, UUID adminUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getFulfillmentType() != FulfillmentType.DELIVERY) {
            throw new BadRequestException("Order is not a DELIVERY order");
        }

        User deUser = userRepository.findById(deliveryExecutiveUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", deliveryExecutiveUserId));

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseGet(() -> Delivery.builder().order(order).build());

        delivery.setDeliveryExecutiveUser(deUser);
        delivery.setAssignedPersonName(deUser.getName());
        delivery.setAssignedPersonPhone(deUser.getPhone());
        delivery.setDeliveryStatus(DeliveryStatus.ASSIGNED);
        if (estDate != null) delivery.setEstimatedDeliveryDate(estDate);

        deliveryRepository.save(delivery);

        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        orderRepository.save(order);

        auditLogService.logAction(adminUserId, "DELIVERY_EXECUTIVE_ASSIGNED", "ORDER", orderId.toString(),
                "Assigned delivery executive " + deUser.getName() + " to order");

        return mapToDto(order);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next, FulfillmentType fulfillmentType) {
        if (current == next) return;
        if (current == OrderStatus.COMPLETED || current == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot modify an order that is already " + current);
        }

        // Standard state machine rules
        if (next == OrderStatus.CANCELLED) return; // Can cancel anytime before completion

        log.info("Transitioning order from {} to {} under {}", current, next, fulfillmentType);
    }

    public AddressDto mapAddressToDto(Address address) {
        if (address == null) return null;
        return AddressDto.builder()
                .id(address.getId())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .pincode(address.getPincode())
                .landmark(address.getLandmark())
                .build();
    }

    public OrderDto mapToDto(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        PaymentDto paymentDto = payment != null ? PaymentDto.builder()
                .id(payment.getId())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .transactionRef(payment.getTransactionRef())
                .amount(payment.getAmount())
                .createdAt(payment.getCreatedAt())
                .build() : null;

        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> OrderItemDto.builder()
                .id(item.getId())
                .product(productService.mapProductToDto(item.getProduct()))
                .productName(item.getProductName())
                .partNumber(item.getPartNumber())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build()).toList();

        // Check for Delivery info
        DeliveryDto deliveryDto = null;
        Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
        if (delivery != null) {
            deliveryDto = DeliveryDto.builder()
                    .id(delivery.getId())
                    .deliveryStatus(delivery.getDeliveryStatus().name())
                    .deliveryAddress(mapAddressToDto(delivery.getDeliveryAddress()))
                    .assignedPersonName(delivery.getAssignedPersonName())
                    .assignedPersonPhone(delivery.getAssignedPersonPhone())
                    .trackingReference(delivery.getTrackingReference())
                    .estimatedDeliveryDate(delivery.getEstimatedDeliveryDate())
                    .deliveredAt(delivery.getDeliveredAt())
                    .createdAt(delivery.getCreatedAt())
                    .updatedAt(delivery.getUpdatedAt())
                    .build();
        }

        // Check for Installation Job info
        InstallationJobDto jobDto = null;
        InstallationJob job = installationJobRepository.findByOrderId(order.getId()).orElse(null);
        if (job != null) {
            TechnicianDto techDto = job.getTechnician() != null ? TechnicianDto.builder()
                    .id(job.getTechnician().getId())
                    .name(job.getTechnician().getName())
                    .phone(job.getTechnician().getPhone())
                    .email(job.getTechnician().getEmail())
                    .status(job.getTechnician().getStatus().name())
                    .build() : null;

            jobDto = InstallationJobDto.builder()
                    .id(job.getId())
                    .technician(techDto)
                    .status(job.getStatus().name())
                    .scheduledDate(job.getScheduledDate())
                    .scheduledTimeSlot(job.getScheduledTimeSlot())
                    .startedAt(job.getStartedAt())
                    .completedAt(job.getCompletedAt())
                    .technicianNotes(job.getTechnicianNotes())
                    .createdAt(job.getCreatedAt())
                    .updatedAt(job.getUpdatedAt())
                    .build();
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customer(userService.mapToDto(order.getUser()))
                .vehicle(order.getVehicle() != null ? vehicleService.mapVehicleToDto(order.getVehicle()) : null)
                .address(mapAddressToDto(order.getAddress()))
                .fulfillmentType(order.getFulfillmentType().name())
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .deliveryFee(order.getDeliveryFee())
                .installationFee(order.getInstallationFee())
                .totalAmount(order.getTotalAmount())
                .pickupDate(order.getPickupDate())
                .pickupTimeSlot(order.getPickupTimeSlot())
                .notes(order.getNotes())
                .items(itemDtos)
                .payment(paymentDto)
                .deliveryInfo(deliveryDto)
                .installationInfo(jobDto)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
