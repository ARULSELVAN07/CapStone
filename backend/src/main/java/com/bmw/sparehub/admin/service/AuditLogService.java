package com.bmw.sparehub.admin.service;

import com.bmw.sparehub.admin.dto.AuditLogDto;
import com.bmw.sparehub.admin.entity.AuditLog;
import com.bmw.sparehub.admin.repository.AuditLogRepository;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.user.dto.UserProfileDto;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Async
    public void logAction(UUID userId, String action, String entityType, String entityId, String description) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    public PageResponse<AuditLogDto> getAllAuditLogs(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<AuditLogDto> mapped = page.getContent().stream()
                .map(this::mapToDto)
                .toList();
        return PageResponse.from(page, mapped);
    }

    private AuditLogDto mapToDto(AuditLog auditLog) {
        UserProfileDto userDto = auditLog.getUser() != null ? UserProfileDto.builder()
                .id(auditLog.getUser().getId())
                .name(auditLog.getUser().getName())
                .email(auditLog.getUser().getEmail())
                .role(auditLog.getUser().getRole().name())
                .employeeId(auditLog.getUser().getEmployeeId())
                .build() : null;

        return AuditLogDto.builder()
                .id(auditLog.getId())
                .user(userDto)
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .description(auditLog.getDescription())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
