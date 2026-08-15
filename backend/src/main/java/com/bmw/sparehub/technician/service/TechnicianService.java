package com.bmw.sparehub.technician.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.order.entity.Order;
import com.bmw.sparehub.order.entity.OrderStatus;
import com.bmw.sparehub.order.repository.OrderRepository;
import com.bmw.sparehub.order.service.OrderService;
import com.bmw.sparehub.technician.dto.InstallationJobDto;
import com.bmw.sparehub.technician.dto.TechnicianDto;
import com.bmw.sparehub.technician.dto.UpdateJobStatusRequest;
import com.bmw.sparehub.technician.entity.InstallationJob;
import com.bmw.sparehub.technician.entity.JobStatus;
import com.bmw.sparehub.technician.entity.Technician;
import com.bmw.sparehub.technician.entity.TechnicianStatus;
import com.bmw.sparehub.technician.repository.InstallationJobRepository;
import com.bmw.sparehub.technician.repository.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechnicianService {

    private final InstallationJobRepository installationJobRepository;
    private final TechnicianRepository technicianRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final AuditLogService auditLogService;

    private final com.bmw.sparehub.user.repository.UserRepository userRepository;

    public TechnicianDto getTechnicianProfileByUserId(UUID userId) {
        Technician tech = technicianRepository.findByUserId(userId)
                .orElseGet(() -> {
                    com.bmw.sparehub.user.entity.User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
                    Technician created = Technician.builder()
                            .user(user)
                            .name(user.getName())
                            .phone(user.getPhone())
                            .email(user.getEmail())
                            .status(TechnicianStatus.AVAILABLE)
                            .build();
                    return technicianRepository.save(created);
                });
        return mapTechToDto(tech);
    }

    public List<TechnicianDto> getAllTechnicians() {
        return technicianRepository.findAll().stream()
                .map(this::mapTechToDto)
                .toList();
    }

    public PageResponse<InstallationJobDto> getAssignedJobsForTechnician(UUID techUserId, Pageable pageable) {
        Page<InstallationJob> page = installationJobRepository.findByTechnicianUserIdOrTechnicianIsNullOrderByCreatedAtDesc(techUserId, pageable);
        List<InstallationJobDto> mapped = page.getContent().stream()
                .map(this::mapJobToDto)
                .toList();
        return PageResponse.from(page, mapped);
    }

    public InstallationJobDto getJobById(UUID jobId, UUID techUserId) {
        InstallationJob job = installationJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("InstallationJob", "id", jobId));

        return mapJobToDto(job);
    }

    @Transactional
    public InstallationJobDto claimJob(UUID jobId, UUID techUserId) {
        InstallationJob job = installationJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("InstallationJob", "id", jobId));

        Technician tech = technicianRepository.findByUserId(techUserId).orElseGet(() -> {
            com.bmw.sparehub.user.entity.User user = userRepository.findById(techUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", techUserId));
            Technician newTech = Technician.builder()
                    .user(user)
                    .name(user.getName())
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .status(TechnicianStatus.AVAILABLE)
                    .build();
            return technicianRepository.save(newTech);
        });

        job.setTechnician(tech);
        if (job.getStatus() == JobStatus.PENDING) {
            job.setStatus(JobStatus.ASSIGNED);
        }
        installationJobRepository.save(job);

        Order order = job.getOrder();
        if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PACKED) {
            order.setStatus(OrderStatus.TECHNICIAN_ASSIGNED);
            orderRepository.save(order);
        }

        auditLogService.logAction(techUserId, "JOB_CLAIMED", "JOB", jobId.toString(),
                "Technician " + tech.getName() + " claimed installation job");

        return mapJobToDto(job);
    }

    @Transactional
    public InstallationJobDto updateJobStatus(UUID jobId, UpdateJobStatusRequest request, UUID techUserId) {
        InstallationJob job = installationJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("InstallationJob", "id", jobId));

        if (job.getTechnician() == null) {
            Technician tech = technicianRepository.findByUserId(techUserId).orElseGet(() -> {
                com.bmw.sparehub.user.entity.User user = userRepository.findById(techUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", techUserId));
                Technician newTech = Technician.builder()
                        .user(user)
                        .name(user.getName())
                        .phone(user.getPhone())
                        .email(user.getEmail())
                        .status(TechnicianStatus.AVAILABLE)
                        .build();
                return technicianRepository.save(newTech);
            });
            job.setTechnician(tech);
        }

        JobStatus newStatus;
        try {
            newStatus = JobStatus.valueOf(request.getStatus());
        } catch (Exception e) {
            throw new BadRequestException("Invalid JobStatus: " + request.getStatus());
        }

        job.setStatus(newStatus);
        if (request.getTechnicianNotes() != null) {
            job.setTechnicianNotes(request.getTechnicianNotes());
        }

        if (newStatus == JobStatus.IN_PROGRESS && job.getStartedAt() == null) {
            job.setStartedAt(LocalDateTime.now());
            if (job.getTechnician() != null) {
                job.getTechnician().setStatus(TechnicianStatus.BUSY);
                technicianRepository.save(job.getTechnician());
            }
        } else if (newStatus == JobStatus.COMPLETED) {
            job.setCompletedAt(LocalDateTime.now());
            if (job.getTechnician() != null) {
                job.getTechnician().setStatus(TechnicianStatus.AVAILABLE);
                technicianRepository.save(job.getTechnician());
            }
        }

        installationJobRepository.save(job);

        // Sync main order status
        Order order = job.getOrder();
        if (newStatus == JobStatus.SCHEDULED) {
            order.setStatus(OrderStatus.INSTALLATION_SCHEDULED);
        } else if (newStatus == JobStatus.IN_PROGRESS) {
            order.setStatus(OrderStatus.INSTALLATION_IN_PROGRESS);
        } else if (newStatus == JobStatus.COMPLETED) {
            order.setStatus(OrderStatus.INSTALLATION_COMPLETED);
            order.setStatus(OrderStatus.COMPLETED);
        }
        orderRepository.save(order);

        auditLogService.logAction(techUserId, "JOB_STATUS_UPDATED", "JOB", jobId.toString(),
                "Updated installation job status to " + newStatus);

        log.info("Technician {} updated installation job {} status to {}", techUserId, jobId, newStatus);
        return mapJobToDto(job);
    }

    public TechnicianDto mapTechToDto(Technician tech) {
        if (tech == null) return null;
        return TechnicianDto.builder()
                .id(tech.getId())
                .userId(tech.getUser() != null ? tech.getUser().getId() : null)
                .employeeId(tech.getUser() != null ? tech.getUser().getEmployeeId() : null)
                .name(tech.getName())
                .phone(tech.getPhone())
                .email(tech.getEmail())
                .status(tech.getStatus().name())
                .build();
    }

    public InstallationJobDto mapJobToDto(InstallationJob job) {
        return InstallationJobDto.builder()
                .id(job.getId())
                .order(orderService.mapToDto(job.getOrder()))
                .technician(mapTechToDto(job.getTechnician()))
                .status(job.getStatus().name())
                .scheduledDate(job.getScheduledDate())
                .scheduledTimeSlot(job.getScheduledTimeSlot())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .technicianNotes(job.getTechnicianNotes())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
