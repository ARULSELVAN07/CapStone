package com.bmw.sparehub.admin.dto;

import com.bmw.sparehub.user.dto.UserProfileDto;
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
public class AuditLogDto {
    private UUID id;
    private UserProfileDto user;
    private String action;
    private String entityType;
    private String entityId;
    private String description;
    private LocalDateTime createdAt;
}
