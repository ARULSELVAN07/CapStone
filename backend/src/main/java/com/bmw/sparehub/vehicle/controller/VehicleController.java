package com.bmw.sparehub.vehicle.controller;

import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.vehicle.dto.CreateVehicleRequest;
import com.bmw.sparehub.vehicle.dto.VehicleDto;
import com.bmw.sparehub.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleDto>>> getUserVehicles(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<VehicleDto> vehicles = vehicleService.getUserVehicles(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(vehicles));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleDto>> addVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateVehicleRequest request
    ) {
        VehicleDto vehicle = vehicleService.addVehicle(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(vehicle, "Vehicle added successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleDto>> getVehicleById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        VehicleDto vehicle = vehicleService.getVehicleById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(vehicle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        vehicleService.deleteVehicle(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Vehicle deleted successfully"));
    }
}
