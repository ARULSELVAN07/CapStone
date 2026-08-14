package com.bmw.sparehub.delivery.controller;

import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.delivery.dto.DeliveryDto;
import com.bmw.sparehub.delivery.dto.UpdateDeliveryStatusRequest;
import com.bmw.sparehub.delivery.service.DeliveryService;
import com.bmw.sparehub.user.dto.UserProfileDto;
import com.bmw.sparehub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery")
@PreAuthorize("hasRole('DELIVERY_EXECUTIVE')")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileDto profile = userService.getUserProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PageResponse<DeliveryDto>>> getAssignedDeliveries(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DeliveryDto> deliveries = deliveryService.getAssignedDeliveriesForExecutive(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(deliveries));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<DeliveryDto>> getDeliveryById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        DeliveryDto delivery = deliveryService.getDeliveryById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(delivery));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<DeliveryDto>> updateDeliveryStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDeliveryStatusRequest request
    ) {
        DeliveryDto updated = deliveryService.updateDeliveryStatus(id, request.getStatus(), userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Delivery status updated successfully"));
    }
}
