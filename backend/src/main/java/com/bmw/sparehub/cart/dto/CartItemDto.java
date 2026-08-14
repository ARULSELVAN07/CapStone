package com.bmw.sparehub.cart.dto;

import com.bmw.sparehub.product.dto.ProductDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CartItemDto {
    private UUID id;
    private ProductDto product;
    private Integer quantity;
    private BigDecimal itemTotal;
}
