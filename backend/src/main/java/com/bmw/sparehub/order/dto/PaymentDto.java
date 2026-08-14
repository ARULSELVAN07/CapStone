package com.bmw.sparehub.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDto {
    private UUID id;
    private String paymentMethod;
    private String status;
    private String transactionRef;
    private BigDecimal amount;
    private LocalDateTime createdAt;
}
