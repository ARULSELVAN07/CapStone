package com.bmw.sparehub.delivery.repository;

import com.bmw.sparehub.delivery.entity.Delivery;
import com.bmw.sparehub.delivery.entity.DeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    Optional<Delivery> findByOrderId(UUID orderId);

    Optional<Delivery> findByTrackingReference(String trackingReference);

    List<Delivery> findByDeliveryExecutiveUserIdOrderByCreatedAtDesc(UUID deliveryExecutiveUserId);

    Page<Delivery> findByDeliveryExecutiveUserIdOrderByCreatedAtDesc(UUID deliveryExecutiveUserId, Pageable pageable);

    Page<Delivery> findByDeliveryExecutiveUserIdOrDeliveryExecutiveUserIsNullOrderByCreatedAtDesc(UUID deliveryExecutiveUserId, Pageable pageable);

    Page<Delivery> findByDeliveryExecutiveUserIsNullOrderByCreatedAtDesc(Pageable pageable);

    List<Delivery> findByDeliveryStatus(DeliveryStatus status);

    long countByDeliveryStatus(DeliveryStatus status);
}
