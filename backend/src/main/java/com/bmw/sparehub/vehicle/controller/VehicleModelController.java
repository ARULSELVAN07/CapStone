package com.bmw.sparehub.vehicle.controller;

import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.vehicle.dto.VehicleModelDto;
import com.bmw.sparehub.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class VehicleModelController {

    private final VehicleService vehicleService;

    @GetMapping("/vehicle-models")
    public ResponseEntity<ApiResponse<List<VehicleModelDto>>> getAllVehicleModels() {
        List<VehicleModelDto> models = vehicleService.getAllVehicleModels();
        return ResponseEntity.ok(ApiResponse.success(models));
    }

    @GetMapping("/vehicle-models/{id}")
    public ResponseEntity<ApiResponse<VehicleModelDto>> getVehicleModelById(@PathVariable UUID id) {
        VehicleModelDto model = vehicleService.getVehicleModelById(id);
        return ResponseEntity.ok(ApiResponse.success(model));
    }

    @PostMapping("/admin/vehicle-models")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VehicleModelDto>> createVehicleModel(@Valid @RequestBody VehicleModelDto request) {
        VehicleModelDto created = vehicleService.createVehicleModel(request);
        return ResponseEntity.ok(ApiResponse.success(created, "BMW Vehicle model created successfully"));
    }

    @PutMapping("/admin/vehicle-models/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VehicleModelDto>> updateVehicleModel(
            @PathVariable UUID id,
            @Valid @RequestBody VehicleModelDto request
    ) {
        VehicleModelDto updated = vehicleService.updateVehicleModel(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "BMW Vehicle model updated successfully"));
    }
}
