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

    public PageResponse<DeliveryDto> getAssignedDeliveriesForExecutive(UUID deUserId, Pageable pageable) {
        Page<Delivery> page = deliveryRepository.findByDeliveryExecutiveUserIdOrderByCreatedAtDesc(deUserId, pageable);
        List<DeliveryDto> mapped = page.getContent().stream()
                .map(this::mapToDto)
                .toList();
        return PageResponse.from(page, mapped);
    }

    public DeliveryDto getDeliveryById(UUID deliveryId, UUID deUserId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", "id", deliveryId));

        if (delivery.getDeliveryExecutiveUser() != null 
                && !delivery.getDeliveryExecutiveUser().getId().equals(deUserId)) {
            throw new BadRequestException("This delivery is assigned to another delivery executive");
        }

        return mapToDto(delivery);
    }

    @Transactional
    public DeliveryDto updateDeliveryStatus(UUID deliveryId, String statusStr, UUID deUserId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", "id", deliveryId));

        DeliveryStatus newStatus;
        try {
            newStatus = DeliveryStatus.valueOf(statusStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid delivery status: " + statusStr);
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
            // Mark as overall completed
            order.setStatus(OrderStatus.COMPLETED);
        }
        orderRepository.save(order);

        auditLogService.logAction(deUserId, "DELIVERY_STATUS_UPDATED", "DELIVERY", deliveryId.toString(),
                "Updated delivery status to " + newStatus);

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
