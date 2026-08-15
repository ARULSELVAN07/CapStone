package com.bmw.sparehub.admin.controller;

import com.bmw.sparehub.admin.dto.AuditLogDto;
import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.auth.security.UserPrincipal;
import com.bmw.sparehub.common.ApiResponse;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.delivery.dto.AssignDeliveryRequest;
import com.bmw.sparehub.delivery.entity.DeliveryStatus;
import com.bmw.sparehub.delivery.repository.DeliveryRepository;
import com.bmw.sparehub.inventory.dto.InventoryDto;
import com.bmw.sparehub.inventory.dto.UpdateStockRequest;
import com.bmw.sparehub.inventory.repository.InventoryRepository;
import com.bmw.sparehub.inventory.service.InventoryService;
import com.bmw.sparehub.order.dto.OrderDto;
import com.bmw.sparehub.order.dto.UpdateOrderStatusRequest;
import com.bmw.sparehub.order.entity.OrderStatus;
import com.bmw.sparehub.order.repository.OrderRepository;
import com.bmw.sparehub.order.service.OrderService;
import com.bmw.sparehub.product.dto.CreateProductRequest;
import com.bmw.sparehub.product.dto.ProductDto;
import com.bmw.sparehub.product.repository.ProductRepository;
import com.bmw.sparehub.product.service.ProductService;
import com.bmw.sparehub.technician.dto.AssignTechnicianRequest;
import com.bmw.sparehub.technician.entity.JobStatus;
import com.bmw.sparehub.technician.repository.InstallationJobRepository;
import com.bmw.sparehub.technician.service.TechnicianService;
import com.bmw.sparehub.user.dto.CreateUserRequest;
import com.bmw.sparehub.user.dto.UserProfileDto;
import com.bmw.sparehub.user.entity.UserRole;
import com.bmw.sparehub.user.repository.UserRepository;
import com.bmw.sparehub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import java.nio.file.*;
import java.io.IOException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminManagementController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AdminManagementController.class);

    private final ProductService productService;
    private final InventoryService inventoryService;
    private final OrderService orderService;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final DeliveryRepository deliveryRepository;
    private final InstallationJobRepository installationJobRepository;

    // Dashboard Statistics
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardMetrics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalProducts", productRepository.count());
        stats.put("totalCustomers", userRepository.findByRole(UserRole.CUSTOMER).size());
        stats.put("totalTechnicians", userRepository.findByRole(UserRole.TECHNICIAN).size());
        stats.put("totalDeliveryExecutives", userRepository.findByRole(UserRole.DELIVERY_EXECUTIVE).size());
        stats.put("totalOrders", orderRepository.count());

        BigDecimal revenue = orderRepository.calculateTotalRevenue();
        stats.put("totalRevenue", revenue != null ? revenue : BigDecimal.ZERO);

        stats.put("lowStockProducts", inventoryRepository.countLowStockItems());
        stats.put("outOfStockProducts", inventoryRepository.countOutOfStockItems());
        stats.put("pendingOrders", orderRepository.countByStatus(OrderStatus.PENDING));
        stats.put("pendingDeliveries", deliveryRepository.countByDeliveryStatus(DeliveryStatus.PENDING));
        stats.put("pendingInstallations", installationJobRepository.countByStatus(JobStatus.PENDING));

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // Product Management
    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateProductRequest request
    ) {
        ProductDto product = productService.createProduct(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(product, "Product created successfully"));
    }

    @PostMapping("/products/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProductImage(
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new com.bmw.sparehub.exception.BadRequestException("Please select a file to upload.");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && 
                                    !contentType.equals("image/png") && 
                                    !contentType.equals("image/webp"))) {
            throw new com.bmw.sparehub.exception.BadRequestException("Please select a valid image file (JPG, PNG, or WEBP).");
        }

        // Validate file size (5MB limit)
        long maxSizeBytes = 5 * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new com.bmw.sparehub.exception.BadRequestException("File size exceeds the limit of 5MB.");
        }

        try {
            // Ensure directory exists
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Generate unique name
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadDir.resolve(newFilename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Construct response path
            String fileUrl = "/uploads/" + newFilename;
            Map<String, String> responseData = new HashMap<>();
            responseData.put("imageUrl", fileUrl);

            return ResponseEntity.ok(ApiResponse.success(responseData, "Image uploaded successfully"));
        } catch (IOException e) {
            log.error("Failed to store uploaded file", e);
            throw new com.bmw.sparehub.exception.BadRequestException("Unable to upload image.");
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateProductRequest request
    ) {
        ProductDto product = productService.updateProduct(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(product, "Product updated successfully"));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateProduct(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        productService.deactivateProduct(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Product deactivated successfully"));
    }

    // Compatibility Management
    @PostMapping("/products/{id}/compatibility/{vehicleModelId}")
    public ResponseEntity<ApiResponse<Void>> addCompatibility(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @PathVariable UUID vehicleModelId,
            @RequestParam(required = false) String notes
    ) {
        productService.addCompatibility(id, vehicleModelId, notes, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Compatibility mapping added"));
    }

    @DeleteMapping("/products/{id}/compatibility/{vehicleModelId}")
    public ResponseEntity<ApiResponse<Void>> removeCompatibility(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @PathVariable UUID vehicleModelId
    ) {
        productService.removeCompatibility(id, vehicleModelId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Compatibility mapping removed"));
    }

    // Inventory Management
    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<PageResponse<InventoryDto>>> getAllInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllInventory(pageable)));
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<ApiResponse<PageResponse<InventoryDto>>> getLowStockInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockInventory(pageable)));
    }

    @PutMapping("/inventory/{productId}")
    public ResponseEntity<ApiResponse<InventoryDto>> updateStock(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateStockRequest request
    ) {
        InventoryDto updated = inventoryService.updateStock(productId, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Inventory stock updated successfully"));
    }

    // Order Management
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderDto>>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fulfillmentType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(orderService.filterAdminOrders(status, fulfillmentType, search, pageable)));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id
    ) {
        OrderDto order = orderService.getOrderById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        OrderDto order = orderService.updateOrderStatus(id, request.getStatus(), request.getNotes(), userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(order, "Order status updated successfully"));
    }

    @PutMapping("/orders/{id}/assign-technician")
    public ResponseEntity<ApiResponse<OrderDto>> assignTechnician(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody AssignTechnicianRequest request
    ) {
        OrderDto order = orderService.assignTechnician(
                id, request.getTechnicianId(), request.getScheduledDate(), request.getScheduledTimeSlot(), userPrincipal.getId()
        );
        return ResponseEntity.ok(ApiResponse.success(order, "Technician assigned to order successfully"));
    }

    @PutMapping("/orders/{id}/assign-delivery")
    public ResponseEntity<ApiResponse<OrderDto>> assignDelivery(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody AssignDeliveryRequest request
    ) {
        OrderDto order = orderService.assignDeliveryExecutive(
                id, request.getDeliveryExecutiveUserId(), request.getEstimatedDeliveryDate(), userPrincipal.getId()
        );
        return ResponseEntity.ok(ApiResponse.success(order, "Delivery Executive assigned to order successfully"));
    }

    // User Management
    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getCustomers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(UserRole.CUSTOMER)));
    }

    @GetMapping("/technicians")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getTechnicians() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(UserRole.TECHNICIAN)));
    }

    @PostMapping("/technicians")
    public ResponseEntity<ApiResponse<UserProfileDto>> createTechnician(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateUserRequest request
    ) {
        request.setRole("TECHNICIAN");
        UserProfileDto created = userService.createManagedUser(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(created, "Technician account created successfully"));
    }

    @GetMapping("/delivery-executives")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getDeliveryExecutives() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(UserRole.DELIVERY_EXECUTIVE)));
    }

    @PostMapping("/delivery-executives")
    public ResponseEntity<ApiResponse<UserProfileDto>> createDeliveryExecutive(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateUserRequest request
    ) {
        request.setRole("DELIVERY_EXECUTIVE");
        UserProfileDto created = userService.createManagedUser(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(created, "Delivery Executive account created successfully"));
    }

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getAdmins() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(UserRole.ADMIN)));
    }

    @PostMapping("/admins")
    public ResponseEntity<ApiResponse<UserProfileDto>> createAdmin(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateUserRequest request
    ) {
        request.setRole("ADMIN");
        UserProfileDto created = userService.createManagedUser(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(created, "Admin account created successfully"));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @RequestParam String status
    ) {
        UserProfileDto updated = userService.updateUserStatus(id, status, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated successfully"));
    }

    // Audit Logs
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogDto>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAllAuditLogs(pageable)));
    }
}
