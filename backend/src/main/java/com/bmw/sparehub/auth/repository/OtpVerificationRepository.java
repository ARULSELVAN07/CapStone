package com.bmw.sparehub.auth.repository;

import com.bmw.sparehub.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    @Query("SELECT o FROM OtpVerification o WHERE o.emailOrPhone = :emailOrPhone AND o.purpose = :purpose AND o.used = false ORDER BY o.createdAt DESC")
    Optional<OtpVerification> findFirstByEmailOrPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            @Param("emailOrPhone") String emailOrPhone,
            @Param("purpose") String purpose);
}
