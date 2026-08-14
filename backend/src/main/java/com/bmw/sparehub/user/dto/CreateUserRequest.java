package com.bmw.sparehub.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String role; // TECHNICIAN, DELIVERY_EXECUTIVE, ADMIN

    private String employeeId; // If provided, or auto-generated

    private String temporaryPassword;
}
