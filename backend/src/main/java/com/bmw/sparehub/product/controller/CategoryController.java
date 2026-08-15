package com.bmw.sparehub.product.controller;

import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.product.dto.CategoryDto;
import com.bmw.sparehub.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CategoryController {

    private final ProductService productService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        List<CategoryDto> categories = productService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/admin/categories/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategoriesAdmin() {
        List<CategoryDto> categories = productService.getAllCategoriesAdmin();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CategoryDto request
    ) {
        CategoryDto created = productService.createCategory(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(created, "Category created successfully"));
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable java.util.UUID id,
            @Valid @RequestBody CategoryDto request
    ) {
        CategoryDto updated = productService.updateCategory(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Category updated successfully"));
    }

    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable java.util.UUID id
    ) {
        productService.deleteCategory(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Category deactivated successfully"));
    }
}
