package com.bmw.sparehub.vehicle.service;

import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ConflictException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.repository.UserRepository;
import com.bmw.sparehub.vehicle.dto.CreateVehicleRequest;
import com.bmw.sparehub.vehicle.dto.VehicleDto;
import com.bmw.sparehub.vehicle.dto.VehicleModelDto;
import com.bmw.sparehub.vehicle.entity.Vehicle;
import com.bmw.sparehub.vehicle.entity.VehicleModel;
import com.bmw.sparehub.vehicle.repository.VehicleModelRepository;
import com.bmw.sparehub.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final UserRepository userRepository;

    // Vehicle Models
    public List<VehicleModelDto> getAllVehicleModels() {
        return vehicleModelRepository.findAll().stream()
                .map(this::mapModelToDto)
                .collect(Collectors.toList());
    }

    public VehicleModelDto getVehicleModelById(UUID id) {
        VehicleModel model = vehicleModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel", "id", id));
        return mapModelToDto(model);
    }

    @Transactional
    public VehicleModelDto createVehicleModel(VehicleModelDto request) {
        if (vehicleModelRepository.existsByModelCode(request.getModelCode())) {
            throw new ConflictException("Vehicle model code already exists: " + request.getModelCode());
        }

        VehicleModel model = VehicleModel.builder()
                .modelName(request.getModelName())
                .modelCode(request.getModelCode())
                .modelYear(request.getModelYear())
                .engineType(request.getEngineType())
                .fuelType(request.getFuelType())
                .build();

        vehicleModelRepository.save(model);
        return mapModelToDto(model);
    }

    @Transactional
    public VehicleModelDto updateVehicleModel(UUID id, VehicleModelDto request) {
        VehicleModel model = vehicleModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel", "id", id));

        model.setModelName(request.getModelName());
        model.setModelCode(request.getModelCode());
        model.setModelYear(request.getModelYear());
        model.setEngineType(request.getEngineType());
        model.setFuelType(request.getFuelType());

        vehicleModelRepository.save(model);
        return mapModelToDto(model);
    }

    // Customer Vehicles
    public List<VehicleDto> getUserVehicles(UUID userId) {
        return vehicleRepository.findByUserId(userId).stream()
                .map(this::mapVehicleToDto)
                .collect(Collectors.toList());
    }

    public VehicleDto getVehicleById(UUID vehicleId, UUID userId) {
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));
        return mapVehicleToDto(vehicle);
    }

    @Transactional
    public VehicleDto addVehicle(UUID userId, CreateVehicleRequest request) {
        if (request.getVin() == null || request.getVin().length() != 17) {
            throw new BadRequestException("VIN must be exactly 17 characters long");
        }

        if (vehicleRepository.existsByVin(request.getVin().toUpperCase())) {
            throw new ConflictException("A vehicle with this VIN is already registered");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        VehicleModel model = vehicleModelRepository.findById(request.getVehicleModelId())
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel", "id", request.getVehicleModelId()));

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleModel(model)
                .vin(request.getVin().toUpperCase())
                .registrationNumber(request.getRegistrationNumber())
                .purchaseYear(request.getPurchaseYear())
                .build();

        vehicleRepository.save(vehicle);
        log.info("Customer {} added BMW vehicle VIN: {}", userId, vehicle.getVin());
        return mapVehicleToDto(vehicle);
    }

    @Transactional
    public void deleteVehicle(UUID vehicleId, UUID userId) {
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));
        vehicleRepository.delete(vehicle);
    }

    public VehicleModelDto mapModelToDto(VehicleModel model) {
        return VehicleModelDto.builder()
                .id(model.getId())
                .modelName(model.getModelName())
                .modelCode(model.getModelCode())
                .modelYear(model.getModelYear())
                .engineType(model.getEngineType())
                .fuelType(model.getFuelType())
                .build();
    }

    public VehicleDto mapVehicleToDto(Vehicle vehicle) {
        return VehicleDto.builder()
                .id(vehicle.getId())
                .userId(vehicle.getUser().getId())
                .vehicleModel(mapModelToDto(vehicle.getVehicleModel()))
                .vin(vehicle.getVin())
                .registrationNumber(vehicle.getRegistrationNumber())
                .purchaseYear(vehicle.getPurchaseYear())
                .build();
    }
}
