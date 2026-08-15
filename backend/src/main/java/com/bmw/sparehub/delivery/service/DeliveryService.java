package com.bmw.sparehub.delivery.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.delivery.dto.DeliveryDto;
import com.bmw.sparehub.delivery.entity.Delivery;
import com.bmw.sparehub.delivery.entity.DeliveryStatus;
import com.bmw.sparehub.delivery.repository.DeliveryRepository;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.order.entity.Order;
import com.bmw.sparehub.order.entity.OrderStatus;
import com.bmw.sparehub.order.repository.OrderRepository;
import com.bmw.sparehub.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AuditLogService auditLogService;
    private final com.bmw.sparehub.user.repository.UserRepository userRepository;

    public PageResponse<DeliveryDto> getAssignedDeliveriesForExecutive(UUID deUserId, Pageable pageable) {
        Page<Delivery> page = deliveryRepository.findByDeliveryExecutiveUserIdOrDeliveryExecutiveUserIsNullOrderByCreatedAtDesc(deUserId, pageable);
        List<DeliveryDto> mapped = page.getContent().stream()
                .map(this::mapToDto)
                .toList();
        return PageResponse.from(page, mapped);
    }

    public DeliveryDto getDeliveryById(UUID deliveryId, UUID deUserId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", "id", deliveryId));

        return mapToDto(delivery);
    }

    @Transactional
    public DeliveryDto claimDelivery(UUID deliveryId, UUID deUserId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", "id", deliveryId));

        com.bmw.sparehub.user.entity.User deUser = userRepository.findById(deUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", deUserId));

        delivery.setDeliveryExecutiveUser(deUser);
        delivery.setAssignedPersonName(deUser.getName());
        delivery.setAssignedPersonPhone(deUser.getPhone());
        if (delivery.getDeliveryStatus() == DeliveryStatus.PENDING) {
            delivery.setDeliveryStatus(DeliveryStatus.ASSIGNED);
        }
        deliveryRepository.save(delivery);

        Order order = delivery.getOrder();
        if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PACKED) {
            order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
            orderRepository.save(order);
        }

        auditLogService.logAction(deUserId, "DELIVERY_CLAIMED", "DELIVERY", deliveryId.toString(),
                "Delivery Executive " + deUser.getName() + " claimed delivery task");

        return mapToDto(delivery);
    }

    @Transactional
    public DeliveryDto updateDeliveryStatus(UUID deliveryId, com.bmw.sparehub.delivery.dto.UpdateDeliveryStatusRequest request, UUID deUserId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", "id", deliveryId));

        // Auto-assign if not assigned yet
        if (delivery.getDeliveryExecutiveUser() == null) {
            com.bmw.sparehub.user.entity.User deUser = userRepository.findById(deUserId).orElse(null);
            if (deUser != null) {
                delivery.setDeliveryExecutiveUser(deUser);
                delivery.setAssignedPersonName(deUser.getName());
                delivery.setAssignedPersonPhone(deUser.getPhone());
            }
        }

        DeliveryStatus newStatus;
        try {
            newStatus = DeliveryStatus.valueOf(request.getStatus());
        } catch (Exception e) {
            throw new BadRequestException("Invalid delivery status: " + request.getStatus());
        }

        delivery.setDeliveryStatus(newStatus);
        if (newStatus == DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(LocalDateTime.now());
        }

        deliveryRepository.save(delivery);

        // Sync main order status
        Order order = delivery.getOrder();
        if (newStatus == DeliveryStatus.OUT_FOR_DELIVERY) {
            order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        } else if (newStatus == DeliveryStatus.DELIVERED) {
            order.setStatus(OrderStatus.DELIVERED);
            order.setStatus(OrderStatus.COMPLETED);
        } else if (newStatus == DeliveryStatus.FAILED) {
            order.setStatus(OrderStatus.CONFIRMED);
        }
        orderRepository.save(order);

        String notes = request.getDeliveryNotes() != null ? request.getDeliveryNotes() : "";
        if (request.getFailureReason() != null && !request.getFailureReason().isBlank()) {
            notes += " (Failure reason: " + request.getFailureReason() + ")";
        }

        auditLogService.logAction(deUserId, "DELIVERY_STATUS_UPDATED", "DELIVERY", deliveryId.toString(),
                "Updated delivery status to " + newStatus + (notes.isEmpty() ? "" : ". " + notes));

        log.info("Delivery Executive {} updated delivery {} status to {}", deUserId, deliveryId, newStatus);
        return mapToDto(delivery);
    }

    public DeliveryDto mapToDto(Delivery delivery) {
        return DeliveryDto.builder()
                .id(delivery.getId())
                .order(orderService.mapToDto(delivery.getOrder()))
                .deliveryStatus(delivery.getDeliveryStatus().name())
                .deliveryAddress(orderService.mapAddressToDto(delivery.getDeliveryAddress()))
                .assignedPersonName(delivery.getAssignedPersonName())
                .assignedPersonPhone(delivery.getAssignedPersonPhone())
                .trackingReference(delivery.getTrackingReference())
                .estimatedDeliveryDate(delivery.getEstimatedDeliveryDate())
                .deliveredAt(delivery.getDeliveredAt())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt())
                .build();
    }
}
