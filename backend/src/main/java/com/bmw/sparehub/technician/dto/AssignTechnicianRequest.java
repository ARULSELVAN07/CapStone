package com.bmw.sparehub.technician.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class AssignTechnicianRequest {

    @NotNull(message = "Technician ID is required")
    private UUID technicianId;

    private LocalDate scheduledDate;

    private String scheduledTimeSlot;
}
