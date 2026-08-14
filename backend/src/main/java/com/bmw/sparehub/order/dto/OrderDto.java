package com.bmw.sparehub.order.dto;

import com.bmw.sparehub.user.dto.UserProfileDto;
import com.bmw.sparehub.vehicle.dto.VehicleDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {
    private UUID id;
    private String orderNumber;
    private UserProfileDto customer;
    private VehicleDto vehicle;
    private AddressDto address;
    private String fulfillmentType;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal installationFee;
    private BigDecimal totalAmount;
    private LocalDate pickupDate;
    private String pickupTimeSlot;
    private String notes;
    private List<OrderItemDto> items;
    private PaymentDto payment;
    private Object deliveryInfo;
    private Object installationInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
