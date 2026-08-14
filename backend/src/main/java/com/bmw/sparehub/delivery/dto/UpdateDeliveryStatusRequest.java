package com.bmw.sparehub.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateDeliveryStatusRequest {

    @NotBlank(message = "Delivery status is required")
    private String status; // ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED
}
