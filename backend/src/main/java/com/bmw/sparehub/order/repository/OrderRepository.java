package com.bmw.sparehub.order.repository;

import com.bmw.sparehub.order.entity.FulfillmentType;
import com.bmw.sparehub.order.entity.Order;
import com.bmw.sparehub.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<Order> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.status = :status)
        AND (:fulfillmentType IS NULL OR o.fulfillmentType = :fulfillmentType)
        AND (:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(o.user.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<Order> filterOrders(
            @Param("status") OrderStatus status,
            @Param("fulfillmentType") FulfillmentType fulfillmentType,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status NOT IN ('CANCELLED', 'PENDING')")
    BigDecimal calculateTotalRevenue();

    long countByStatus(OrderStatus status);

    long countByFulfillmentType(FulfillmentType fulfillmentType);
}
