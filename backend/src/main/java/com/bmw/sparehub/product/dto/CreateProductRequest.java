package com.bmw.sparehub.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateProductRequest {

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    @NotBlank(message = "Part number is required")
    private String partNumber;

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    private String brand;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    private BigDecimal price;

    private Integer warrantyMonths;

    private String imageUrl;

    private Double rating;

    private String status; // ACTIVE, INACTIVE

    private Integer initialStock;

    private Integer minimumStockThreshold;

    private List<UUID> compatibleVehicleModelIds;
}
