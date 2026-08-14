package com.bmw.sparehub.vehicle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicle_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_code", nullable = false, length = 50)
    private String modelCode;

    @Column(name = "model_year", nullable = false)
    private Integer modelYear;

    @Column(name = "engine_type", length = 100)
    private String engineType;

    @Column(name = "fuel_type", length = 50)
    private String fuelType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
