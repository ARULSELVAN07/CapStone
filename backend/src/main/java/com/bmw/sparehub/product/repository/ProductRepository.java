package com.bmw.sparehub.product.repository;

import com.bmw.sparehub.product.entity.Product;
import com.bmw.sparehub.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByPartNumber(String partNumber);

    boolean existsByPartNumber(String partNumber);

    List<Product> findByCategoryIdAndStatus(UUID categoryId, ProductStatus status);

    @Query("""
        SELECT p FROM Product p
        WHERE p.status = :status
        AND (:categoryId IS NULL OR p.category.id = :categoryId)
        AND (:vehicleModelId IS NULL OR EXISTS (
                SELECT 1 FROM PartCompatibility pc
                WHERE pc.product.id = p.id AND pc.vehicleModel.id = :vehicleModelId))
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        AND (:brand IS NULL OR LOWER(p.brand) = LOWER(:brand))
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<Product> filterProducts(
            @Param("status") ProductStatus status,
            @Param("categoryId") UUID categoryId,
            @Param("vehicleModelId") UUID vehicleModelId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("brand") String brand,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        JOIN PartCompatibility pc ON pc.product.id = p.id
        WHERE pc.vehicleModel.id = :vehicleModelId AND p.status = 'ACTIVE'
    """)
    List<Product> findCompatibleProductsByModelId(@Param("vehicleModelId") UUID vehicleModelId);
}
