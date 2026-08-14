package com.bmw.sparehub.vehicle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateVehicleRequest {

    @NotNull(message = "Vehicle model ID is required")
    private UUID vehicleModelId;

    @NotBlank(message = "VIN is required")
    @Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    private String vin;

    private String registrationNumber;

    private Integer purchaseYear;
}
