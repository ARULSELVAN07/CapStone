package com.bmw.sparehub.auth.service;

import com.bmw.sparehub.auth.dto.*;
import com.bmw.sparehub.auth.entity.OtpVerification;
import com.bmw.sparehub.auth.repository.OtpVerificationRepository;
import com.bmw.sparehub.auth.security.JwtTokenProvider;
import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ConflictException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.exception.UnauthorizedException;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.entity.UserRole;
import com.bmw.sparehub.user.entity.UserStatus;
import com.bmw.sparehub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JavaMailSender mailSender;

    @Value("${app.otp.dev-mode-enabled:true}")
    private boolean devModeOtpEnabled;

    @Value("${app.otp.dev-mode-code:123456}")
    private String devModeOtpCode;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered. Please login.");
        }

        User customer = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(customer);
        log.info("Registered new customer with email: {}", customer.getEmail());

        // Generate OTP for verification
        String otp = generateAndSaveOtp(customer.getEmail(), "LOGIN");

        return AuthResponse.builder()
                .userId(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .role(customer.getRole().name())
                .requiresOtp(true)
                .message("Customer registered successfully. OTP sent for verification.")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrEmployeeId(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new UnauthorizedException("Invalid username, email, or password"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is inactive or blocked. Please contact administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username, email, or password");
        }

        if (user.getRole() == UserRole.CUSTOMER) {
            // Customer requires OTP verification step
            String otp = generateAndSaveOtp(user.getEmail(), "LOGIN");
            return AuthResponse.builder()
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .requiresOtp(true)
                    .message("Credentials validated. OTP sent to your registered email.")
                    .build();
        } else {
            // Admin, Technician, Delivery Executive get immediate JWT token
            String token = tokenProvider.generateTokenForUser(
                    user.getId(),
                    user.getEmail(),
                    user.getEmployeeId(),
                    user.getName(),
                    user.getRole().name()
            );

            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .employeeId(user.getEmployeeId())
                    .role(user.getRole().name())
                    .requiresOtp(false)
                    .message("Login successful.")
                    .build();
        }
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerificationRequest request) {
        User user = userRepository.findByEmailOrEmployeeId(request.getEmailOrPhone(), request.getEmailOrPhone())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email/phone", request.getEmailOrPhone()));

        boolean isValid = false;

        // 1. Check dev mode code fallback if enabled
        if (devModeOtpEnabled && devModeOtpCode.equals(request.getOtpCode())) {
            isValid = true;
            log.info("OTP verified using Dev Mode fallback code for {}", request.getEmailOrPhone());
        } else {
            // 2. Check stored DB OTP
            OtpVerification otpRecord = otpVerificationRepository
                    .findFirstByEmailOrPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(request.getEmailOrPhone(), "LOGIN")
                    .orElse(null);

            if (otpRecord != null 
                    && otpRecord.getOtpCode().equals(request.getOtpCode()) 
                    && otpRecord.getExpiresAt().isAfter(LocalDateTime.now())) {
                isValid = true;
                otpRecord.setUsed(true);
                otpVerificationRepository.save(otpRecord);
            }
        }

        if (!isValid) {
            throw new BadRequestException("Invalid or expired OTP code.");
        }

        String token = tokenProvider.generateTokenForUser(
                user.getId(),
                user.getEmail(),
                user.getEmployeeId(),
                user.getName(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .employeeId(user.getEmployeeId())
                .role(user.getRole().name())
                .requiresOtp(false)
                .message("OTP verified successfully. Login granted.")
                .build();
    }

    @Transactional
    public String resendOtp(String emailOrPhone) {
        User user = userRepository.findByEmailOrEmployeeId(emailOrPhone, emailOrPhone)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return generateAndSaveOtp(user.getEmail(), "LOGIN");
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Incorrect old password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user ID: {}", userId);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with email: " + request.getEmail()));

        generateAndSaveOtp(user.getEmail(), "RESET_PASSWORD");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isValid = false;
        if (devModeOtpEnabled && devModeOtpCode.equals(request.getOtpCode())) {
            isValid = true;
        } else {
            OtpVerification otpRecord = otpVerificationRepository
                    .findFirstByEmailOrPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(request.getEmail(), "RESET_PASSWORD")
                    .orElse(null);

            if (otpRecord != null 
                    && otpRecord.getOtpCode().equals(request.getOtpCode()) 
                    && otpRecord.getExpiresAt().isAfter(LocalDateTime.now())) {
                isValid = true;
                otpRecord.setUsed(true);
                otpVerificationRepository.save(otpRecord);
            }
        }

        if (!isValid) {
            throw new BadRequestException("Invalid or expired OTP for password reset");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password reset completed for user: {}", user.getEmail());
    }

    private String generateAndSaveOtp(String emailOrPhone, String purpose) {
        String otpCode;
        if (devModeOtpEnabled) {
            otpCode = devModeOtpCode;
        } else {
            SecureRandom random = new SecureRandom();
            otpCode = String.format("%06d", random.nextInt(1000000));
        }

        OtpVerification verification = OtpVerification.builder()
                .emailOrPhone(emailOrPhone)
                .otpCode(otpCode)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .used(false)
                .build();

        otpVerificationRepository.save(verification);

        // Attempt sending email via MailSender silently catch if SMTP unconfigured
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(emailOrPhone);
            message.setSubject("BMW SpareHub - Verification OTP Code");
            message.setText("Your OTP verification code for BMW SpareHub is: " + otpCode + 
                           "\nThis code expires in " + otpExpiryMinutes + " minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Could not send SMTP email to {}. Dev Mode OTP is active: {}", emailOrPhone, otpCode);
        }

        return otpCode;
    }
}
