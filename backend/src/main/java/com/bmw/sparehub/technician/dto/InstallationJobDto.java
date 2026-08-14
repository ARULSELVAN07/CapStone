package com.bmw.sparehub.technician.dto;

import com.bmw.sparehub.order.dto.OrderDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstallationJobDto {
    private UUID id;
    private OrderDto order;
    private TechnicianDto technician;
    private String status;
    private LocalDate scheduledDate;
    private String scheduledTimeSlot;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String technicianNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
