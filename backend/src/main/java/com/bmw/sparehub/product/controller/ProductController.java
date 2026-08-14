package com.bmw.sparehub.product.controller;

import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.product.dto.CompatibilityResponse;
import com.bmw.sparehub.product.dto.ProductDto;
import com.bmw.sparehub.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> filterProducts(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID vehicleModelId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<ProductDto> products = productService.filterProducts(
                categoryId, vehicleModelId, minPrice, maxPrice, brand, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable UUID id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/{productId}/compatibility/{vehicleId}")
    public ResponseEntity<ApiResponse<CompatibilityResponse>> checkCompatibility(
            @PathVariable UUID productId,
            @PathVariable UUID vehicleId
    ) {
        CompatibilityResponse response = productService.checkProductCompatibility(productId, vehicleId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
