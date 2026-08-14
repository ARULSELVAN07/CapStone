package com.bmw.sparehub.delivery.dto;

import com.bmw.sparehub.order.dto.AddressDto;
import com.bmw.sparehub.order.dto.OrderDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeliveryDto {
    private UUID id;
    private OrderDto order;
    private String deliveryStatus;
    private AddressDto deliveryAddress;
    private String assignedPersonName;
    private String assignedPersonPhone;
    private String trackingReference;
    private LocalDate estimatedDeliveryDate;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
