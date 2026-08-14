package com.bmw.sparehub.technician.repository;

import com.bmw.sparehub.technician.entity.InstallationJob;
import com.bmw.sparehub.technician.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstallationJobRepository extends JpaRepository<InstallationJob, UUID> {

    Optional<InstallationJob> findByOrderId(UUID orderId);

    List<InstallationJob> findByTechnicianIdOrderByCreatedAtDesc(UUID technicianId);

    Page<InstallationJob> findByTechnicianIdOrderByCreatedAtDesc(UUID technicianId, Pageable pageable);

    List<InstallationJob> findByTechnicianUserIdOrderByCreatedAtDesc(UUID technicianUserId);

    Page<InstallationJob> findByTechnicianUserIdOrderByCreatedAtDesc(UUID technicianUserId, Pageable pageable);

    List<InstallationJob> findByStatus(JobStatus status);

    long countByStatus(JobStatus status);
}
