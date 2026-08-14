package com.bmw.sparehub.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompatibilityResponse {
    private boolean compatible;
    private String message;
    private String vehicleModelName;
    private String partNumber;
}
