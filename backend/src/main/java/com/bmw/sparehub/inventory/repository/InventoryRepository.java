package com.bmw.sparehub.inventory.repository;

import com.bmw.sparehub.inventory.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

    Optional<Inventory> findByProductId(UUID productId);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity <= i.minimumStockThreshold")
    Page<Inventory> findLowStockItems(Pageable pageable);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableQuantity <= i.minimumStockThreshold")
    long countLowStockItems();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableQuantity = 0")
    long countOutOfStockItems();
}
