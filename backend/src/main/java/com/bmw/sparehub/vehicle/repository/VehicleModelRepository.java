package com.bmw.sparehub.vehicle.repository;

import com.bmw.sparehub.vehicle.entity.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleModelRepository extends JpaRepository<VehicleModel, UUID> {
    Optional<VehicleModel> findByModelName(String modelName);
    Optional<VehicleModel> findByModelCode(String modelCode);
    boolean existsByModelCode(String modelCode);
}
