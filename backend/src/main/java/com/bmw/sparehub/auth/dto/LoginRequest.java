package com.bmw.sparehub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email, Phone, or Employee ID is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
