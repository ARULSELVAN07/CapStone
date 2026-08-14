package com.bmw.sparehub.inventory.dto;

import com.bmw.sparehub.product.dto.ProductDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InventoryDto {
    private UUID id;
    private ProductDto product;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer minimumStockThreshold;
    private String calculatedStatus;
    private LocalDateTime updatedAt;
}
