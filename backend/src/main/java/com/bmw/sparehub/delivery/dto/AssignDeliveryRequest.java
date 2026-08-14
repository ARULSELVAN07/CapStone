package com.bmw.sparehub.delivery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class AssignDeliveryRequest {

    @NotNull(message = "Delivery executive user ID is required")
    private UUID deliveryExecutiveUserId;

    private LocalDate estimatedDeliveryDate;
}
