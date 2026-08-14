package com.bmw.sparehub.inventory.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.exception.BadRequestException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.inventory.dto.InventoryDto;
import com.bmw.sparehub.inventory.dto.UpdateStockRequest;
import com.bmw.sparehub.inventory.entity.Inventory;
import com.bmw.sparehub.inventory.repository.InventoryRepository;
import com.bmw.sparehub.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductService productService;
    private final AuditLogService auditLogService;

    public PageResponse<InventoryDto> getAllInventory(Pageable pageable) {
        Page<Inventory> page = inventoryRepository.findAll(pageable);
        List<InventoryDto> mapped = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return PageResponse.from(page, mapped);
    }

    public PageResponse<InventoryDto> getLowStockInventory(Pageable pageable) {
        Page<Inventory> page = inventoryRepository.findLowStockItems(pageable);
        List<InventoryDto> mapped = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return PageResponse.from(page, mapped);
    }

    public InventoryDto getInventoryByProductId(UUID productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product id: " + productId));
        return mapToDto(inventory);
    }

    @Transactional
    public InventoryDto updateStock(UUID productId, UpdateStockRequest request, UUID adminUserId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product id: " + productId));

        inventory.setAvailableQuantity(request.getAvailableQuantity());
        if (request.getMinimumStockThreshold() != null) {
            inventory.setMinimumStockThreshold(request.getMinimumStockThreshold());
        }

        inventoryRepository.save(inventory);

        auditLogService.logAction(adminUserId, "INVENTORY_UPDATED", "PRODUCT", productId.toString(),
                "Updated stock available: " + request.getAvailableQuantity());

        log.info("Admin updated inventory for product ID {}: available={}", productId, request.getAvailableQuantity());
        return mapToDto(inventory);
    }

    @Transactional
    public void reserveStock(UUID productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product id: " + productId));

        if (inventory.getAvailableQuantity() < quantity) {
            throw new BadRequestException("Insufficient inventory available for product: " + inventory.getProduct().getName());
        }

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void commitReservedStock(UUID productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product id: " + productId));

        inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - quantity));
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void releaseReservedStock(UUID productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product id: " + productId));

        int releaseFromReserved = Math.min(inventory.getReservedQuantity(), quantity);
        inventory.setReservedQuantity(inventory.getReservedQuantity() - releaseFromReserved);
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    public InventoryDto mapToDto(Inventory inventory) {
        return InventoryDto.builder()
                .id(inventory.getId())
                .product(productService.mapProductToDto(inventory.getProduct()))
                .availableQuantity(inventory.getAvailableQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .minimumStockThreshold(inventory.getMinimumStockThreshold())
                .calculatedStatus(inventory.getCalculatedStatus().name())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }
}
