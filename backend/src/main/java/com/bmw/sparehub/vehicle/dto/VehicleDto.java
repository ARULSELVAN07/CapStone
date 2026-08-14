package com.bmw.sparehub.vehicle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VehicleDto {
    private UUID id;
    private UUID userId;
    private VehicleModelDto vehicleModel;
    private String vin;
    private String registrationNumber;
    private Integer purchaseYear;
}
