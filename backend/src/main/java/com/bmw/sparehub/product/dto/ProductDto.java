package com.bmw.sparehub.product.dto;

import com.bmw.sparehub.vehicle.dto.VehicleModelDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {
    private UUID id;
    private CategoryDto category;
    private String partNumber;
    private String name;
    private String description;
    private String brand;
    private BigDecimal price;
    private Integer warrantyMonths;
    private String imageUrl;
    private Double rating;
    private String status;
    private Integer availableQuantity;
    private String stockStatus; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    private List<VehicleModelDto> compatibleModels;
}
