package com.bmw.sparehub.order.controller;

import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.order.dto.AddressDto;
import com.bmw.sparehub.order.dto.CreateOrderRequest;
import com.bmw.sparehub.order.dto.OrderDto;
import com.bmw.sparehub.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getUserAddresses(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AddressDto> addresses = orderService.getUserAddresses(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressDto>> addAddress(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AddressDto request
    ) {
        AddressDto address = orderService.addAddress(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(address, "Address added successfully"));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        OrderDto order = orderService.createOrder(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(order, "Order placed successfully"));
    }

    @GetMapping("/orders/my-orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderDto>>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<OrderDto> orders = orderService.getMyOrdersPaginated(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getCustomerOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<OrderDto> orders = orderService.getCustomerOrders(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        OrderDto order = orderService.getOrderById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        OrderDto order = orderService.cancelOrder(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(order, "Order cancelled successfully"));
    }
}
