package com.bmw.sparehub.order.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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

    @JsonAlias("address")
    private AddressDto newAddress;

    @NotBlank(message = "Payment method is required (UPI, CARD, CASH_ON_PICKUP)")
    private String paymentMethod;

    // Optional Pickup / Installation Appointment
    @JsonAlias("pickupDate")
    private LocalDate appointmentDate;

    @JsonAlias("pickupTimeSlot")
    private String appointmentTimeSlot;

    private String notes;

    public AddressDto getNewAddress() {
        return newAddress;
    }

    public void setAddress(AddressDto address) {
        this.newAddress = address;
    }

    public void setPickupDate(LocalDate pickupDate) {
        this.appointmentDate = pickupDate;
    }

    public void setPickupTimeSlot(String pickupTimeSlot) {
        this.appointmentTimeSlot = pickupTimeSlot;
    }
}
