package com.bmw.sparehub.technician.controller;

import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.technician.dto.InstallationJobDto;
import com.bmw.sparehub.technician.dto.TechnicianDto;
import com.bmw.sparehub.technician.dto.UpdateJobStatusRequest;
import com.bmw.sparehub.technician.service.TechnicianService;
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
@RequestMapping("/api/v1/technician")
@PreAuthorize("hasRole('TECHNICIAN')")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<TechnicianDto>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        TechnicianDto profile = technicianService.getTechnicianProfileByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<PageResponse<InstallationJobDto>>> getAssignedJobs(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<InstallationJobDto> jobs = technicianService.getAssignedJobsForTechnician(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<ApiResponse<InstallationJobDto>> getJobById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        InstallationJobDto job = technicianService.getJobById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(job));
    }

    @PutMapping("/jobs/{id}/claim")
    public ResponseEntity<ApiResponse<InstallationJobDto>> claimJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        InstallationJobDto job = technicianService.claimJob(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(job, "Installation job claimed successfully"));
    }

    @PutMapping("/jobs/{id}/status")
    public ResponseEntity<ApiResponse<InstallationJobDto>> updateJobStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateJobStatusRequest request
    ) {
        InstallationJobDto job = technicianService.updateJobStatus(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(job, "Job status updated successfully"));
    }
}
