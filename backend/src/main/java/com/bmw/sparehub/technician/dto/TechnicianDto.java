package com.bmw.sparehub.technician.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TechnicianDto {
    private UUID id;
    private UUID userId;
    private String employeeId;
    private String name;
    private String phone;
    private String email;
    private String status;
}
