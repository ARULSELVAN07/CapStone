package com.bmw.sparehub.technician.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateJobStatusRequest {

    @NotBlank(message = "Job status is required")
    private String status; // ASSIGNED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    private String technicianNotes;
}
