package com.bmw.sparehub.technician.repository;

import com.bmw.sparehub.technician.entity.Technician;
import com.bmw.sparehub.technician.entity.TechnicianStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, UUID> {

    Optional<Technician> findByUserId(UUID userId);

    List<Technician> findByStatus(TechnicianStatus status);

    boolean existsByUserId(UUID userId);
}
