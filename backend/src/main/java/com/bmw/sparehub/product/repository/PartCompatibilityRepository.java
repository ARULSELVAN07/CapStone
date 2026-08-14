package com.bmw.sparehub.product.repository;

import com.bmw.sparehub.product.entity.PartCompatibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PartCompatibilityRepository extends JpaRepository<PartCompatibility, UUID> {

    List<PartCompatibility> findByProductId(UUID productId);

    List<PartCompatibility> findByVehicleModelId(UUID vehicleModelId);

    Optional<PartCompatibility> findByProductIdAndVehicleModelId(UUID productId, UUID vehicleModelId);

    boolean existsByProductIdAndVehicleModelId(UUID productId, UUID vehicleModelId);

    void deleteByProductIdAndVehicleModelId(UUID productId, UUID vehicleModelId);
}
