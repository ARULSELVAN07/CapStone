package com.bmw.sparehub.recommendation.controller;

import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.product.dto.ProductDto;
import com.bmw.sparehub.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Slf4j
public class RecommendationController {

    private final RestTemplate recommendationRestTemplate;
    private final ProductService productService;

    @Value("${recommendation.service.url:http://recommendation-service:8000}")
    private String recommendationServiceUrl;

    @GetMapping("/similar/{productId}")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getSimilarProducts(
            @PathVariable UUID productId,
            @RequestParam(required = false) UUID vehicleModelId,
            @RequestParam(defaultValue = "6") int limit
    ) {
        String baseServiceUrl = resolveServiceUrl();
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(baseServiceUrl + "/recommendations/similar/" + productId)
                .queryParam("limit", limit);

        if (vehicleModelId != null) {
            uriBuilder.queryParam("vehicle_model_id", vehicleModelId.toString());
        }

        try {
            ResponseEntity<List<ProductDto>> response = recommendationRestTemplate.exchange(
                    uriBuilder.toUriString(),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ProductDto>>() {}
            );
            return ResponseEntity.ok(ApiResponse.success(response.getBody(), "Similar products fetched successfully"));
        } catch (Exception e) {
            log.warn("Recommendation service unavailable at {}. Using Java fallback for similar products: {}", baseServiceUrl, e.getMessage());
            List<ProductDto> fallback = productService.getFallbackSimilarProducts(productId, vehicleModelId, limit);
            return ResponseEntity.ok(ApiResponse.success(fallback, "Recommended similar products (offline mode)"));
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getTrendingProducts(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) UUID vehicleModelId
    ) {
        String baseServiceUrl = resolveServiceUrl();
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(baseServiceUrl + "/recommendations/trending")
                .queryParam("limit", limit);

        if (vehicleModelId != null) {
            uriBuilder.queryParam("vehicle_model_id", vehicleModelId.toString());
        }

        try {
            ResponseEntity<List<ProductDto>> response = recommendationRestTemplate.exchange(
                    uriBuilder.toUriString(),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ProductDto>>() {}
            );
            return ResponseEntity.ok(ApiResponse.success(response.getBody(), "Trending products fetched successfully"));
        } catch (Exception e) {
            log.warn("Recommendation service unavailable at {}. Using Java fallback for trending products: {}", baseServiceUrl, e.getMessage());
            List<ProductDto> fallback = productService.getFallbackTrendingProducts(vehicleModelId, limit);
            return ResponseEntity.ok(ApiResponse.success(fallback, "Trending products (offline mode)"));
        }
    }

    @GetMapping("/experiments/evaluation")
    public ResponseEntity<ApiResponse<Object>> getModelEvaluation() {
        String baseServiceUrl = resolveServiceUrl();
        try {
            ResponseEntity<Object> response = recommendationRestTemplate.exchange(
                    baseServiceUrl + "/recommendations/experiments/evaluation",
                    HttpMethod.GET,
                    null,
                    Object.class
            );
            return ResponseEntity.ok(ApiResponse.success(response.getBody(), "ML model evaluation metrics fetched successfully"));
        } catch (Exception e) {
            log.warn("Recommendation service unavailable for evaluation metrics: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("ML recommendation service is offline"));
        }
    }

    private String resolveServiceUrl() {
        if (recommendationServiceUrl != null && !recommendationServiceUrl.trim().isEmpty()) {
            return recommendationServiceUrl.trim().replaceAll("/+$", "");
        }
        return "http://localhost:8000";
    }
}
