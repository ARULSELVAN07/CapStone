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
public class VehicleModelDto {
    private UUID id;
    private String modelName;
    private String modelCode;
    private Integer modelYear;
    private String engineType;
    private String fuelType;
}
