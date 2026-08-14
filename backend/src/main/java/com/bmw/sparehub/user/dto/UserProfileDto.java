package com.bmw.sparehub.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String status;
    private String employeeId;
    private LocalDateTime createdAt;
}
