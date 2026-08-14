package com.bmw.sparehub.user.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ConflictException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.technician.entity.Technician;
import com.bmw.sparehub.technician.entity.TechnicianStatus;
import com.bmw.sparehub.technician.repository.TechnicianRepository;
import com.bmw.sparehub.user.dto.CreateUserRequest;
import com.bmw.sparehub.user.dto.UpdateProfileRequest;
import com.bmw.sparehub.user.dto.UserProfileDto;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.entity.UserRole;
import com.bmw.sparehub.user.entity.UserStatus;
import com.bmw.sparehub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserProfileDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.getName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);
        return mapToDto(user);
    }

    public List<UserProfileDto> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Page<UserProfileDto> getUsersByRolePaged(UserRole role, Pageable pageable) {
        return userRepository.findByRole(role, pageable)
                .map(this::mapToDto);
    }

    @Transactional
    public UserProfileDto createManagedUser(CreateUserRequest request, UUID adminUserId) {
        UserRole targetRole;
        try {
            targetRole = UserRole.valueOf(request.getRole());
        } catch (Exception e) {
            throw new BadRequestException("Invalid user role: " + request.getRole());
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already exists: " + request.getEmail());
        }

        String empId = request.getEmployeeId();
        if (empId == null || empId.isBlank()) {
            empId = generateEmployeeId(targetRole);
        } else if (userRepository.existsByEmployeeId(empId)) {
            throw new ConflictException("Employee ID already exists: " + empId);
        }

        String rawPassword = request.getTemporaryPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "Pass" + System.currentTimeMillis() % 10000;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(targetRole)
                .status(UserStatus.ACTIVE)
                .employeeId(empId)
                .build();

        userRepository.save(user);

        // If creating a Technician, automatically create Technician entity
        if (targetRole == UserRole.TECHNICIAN) {
            Technician technician = Technician.builder()
                    .user(user)
                    .name(user.getName())
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .status(TechnicianStatus.AVAILABLE)
                    .build();
            technicianRepository.save(technician);
        }

        auditLogService.logAction(adminUserId, targetRole.name() + "_CREATED", "USER", user.getId().toString(),
                "Created user " + user.getName() + " with Employee ID " + empId);

        log.info("Admin created new {} user with Employee ID: {}", targetRole, empId);
        return mapToDto(user);
    }

    @Transactional
    public UserProfileDto updateUserStatus(UUID targetUserId, String statusStr, UUID adminUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserStatus newStatus;
        try {
            newStatus = UserStatus.valueOf(statusStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid status: " + statusStr);
        }

        user.setStatus(newStatus);
        userRepository.save(user);

        auditLogService.logAction(adminUserId, "USER_STATUS_UPDATED", "USER", targetUserId.toString(),
                "Updated user status to " + newStatus);

        return mapToDto(user);
    }

    private String generateEmployeeId(UserRole role) {
        String prefix = switch (role) {
            case TECHNICIAN -> "TECH";
            case DELIVERY_EXECUTIVE -> "DEL";
            case ADMIN -> "ADM";
            default -> "EMP";
        };
        return prefix + (1000 + (int) (userRepository.count() + 1));
    }

    public UserProfileDto mapToDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .employeeId(user.getEmployeeId())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
