package com.bmw.sparehub.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateOrderRequest {

    private UUID vehicleId;

    @NotNull(message = "Fulfillment type is required (PICKUP, DELIVERY, INSTALLATION)")
    private String fulfillmentType;

    // Delivery or Installation Address (can pass addressId or new addressDto)
    private UUID addressId;
    private AddressDto newAddress;

    @NotBlank(message = "Payment method is required (UPI, CARD, CASH_ON_PICKUP)")
    private String paymentMethod;

    // Optional Pickup / Installation Appointment
    private LocalDate appointmentDate;
    private String appointmentTimeSlot;

    private String notes;
}
