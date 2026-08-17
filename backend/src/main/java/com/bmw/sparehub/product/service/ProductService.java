package com.bmw.sparehub.product.service;

import com.bmw.sparehub.admin.service.AuditLogService;
import com.bmw.sparehub.common.PageResponse;
import com.bmw.sparehub.exception.ConflictException;
import com.bmw.sparehub.exception.ResourceNotFoundException;
import com.bmw.sparehub.inventory.entity.Inventory;
import com.bmw.sparehub.inventory.repository.InventoryRepository;
import com.bmw.sparehub.product.dto.*;
import com.bmw.sparehub.product.entity.Category;
import com.bmw.sparehub.product.entity.PartCompatibility;
import com.bmw.sparehub.product.entity.Product;
import com.bmw.sparehub.product.entity.ProductStatus;
import com.bmw.sparehub.product.repository.CategoryRepository;
import com.bmw.sparehub.product.repository.PartCompatibilityRepository;
import com.bmw.sparehub.product.repository.ProductRepository;
import com.bmw.sparehub.vehicle.dto.VehicleModelDto;
import com.bmw.sparehub.vehicle.entity.Vehicle;
import com.bmw.sparehub.vehicle.entity.VehicleModel;
import com.bmw.sparehub.vehicle.repository.VehicleModelRepository;
import com.bmw.sparehub.vehicle.repository.VehicleRepository;
import com.bmw.sparehub.vehicle.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final PartCompatibilityRepository compatibilityRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final VehicleRepository vehicleRepository;
    private final InventoryRepository inventoryRepository;
    private final VehicleService vehicleService;
    private final AuditLogService auditLogService;

    // Categories
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findByActiveTrue().stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getAllCategoriesAdmin() {
        return categoryRepository.findAll().stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(CategoryDto request, UUID adminUserId) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new ConflictException("Category already exists: " + request.getName());
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        categoryRepository.save(category);
        auditLogService.logAction(adminUserId, "CATEGORY_CREATED", "CATEGORY", category.getId().toString(),
                "Created category " + category.getName());

        return mapCategoryToDto(category);
    }

    @Transactional
    public CategoryDto updateCategory(UUID id, CategoryDto request, UUID adminUserId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (!category.getName().equalsIgnoreCase(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new ConflictException("Category already exists with name: " + request.getName());
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        categoryRepository.save(category);
        auditLogService.logAction(adminUserId, "CATEGORY_UPDATED", "CATEGORY", id.toString(),
                "Updated category " + category.getName());

        return mapCategoryToDto(category);
    }

    @Transactional
    public void deleteCategory(UUID id, UUID adminUserId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setActive(false);
        categoryRepository.save(category);

        auditLogService.logAction(adminUserId, "CATEGORY_DELETED", "CATEGORY", id.toString(),
                "Deactivated category " + category.getName());
    }

    // Products Filtering & Catalog
    public PageResponse<ProductDto> filterProducts(
            UUID categoryId,
            UUID vehicleModelId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String brand,
            String search,
            Pageable pageable
    ) {
        org.springframework.data.jpa.domain.Specification<Product> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (vehicleModelId != null) {
                jakarta.persistence.criteria.Subquery<Integer> subquery = query.subquery(Integer.class);
                jakarta.persistence.criteria.Root<PartCompatibility> compatRoot = subquery.from(PartCompatibility.class);
                subquery.select(cb.literal(1));
                subquery.where(
                        cb.equal(compatRoot.get("product").get("id"), root.get("id")),
                        cb.equal(compatRoot.get("vehicleModel").get("id"), vehicleModelId)
                );
                predicates.add(cb.exists(subquery));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (brand != null && !brand.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("brand")), brand.trim().toLowerCase()));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                jakarta.persistence.criteria.Predicate partNumberMatch = cb.like(cb.lower(root.get("partNumber")), pattern);
                jakarta.persistence.criteria.Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                jakarta.persistence.criteria.Predicate brandMatch = cb.like(cb.lower(root.get("brand")), pattern);
                predicates.add(cb.or(nameMatch, partNumberMatch, descMatch, brandMatch));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Product> page = productRepository.findAll(spec, pageable);

        List<ProductDto> mapped = page.getContent().stream()
                .map(this::mapProductToDto)
                .collect(Collectors.toList());

        return PageResponse.from(page, mapped);
    }

    public ProductDto getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapProductToDto(product);
    }

    // Backend Compatibility Verification Endpoint
    public CompatibilityResponse checkProductCompatibility(UUID productId, UUID vehicleId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        VehicleModel vehicleModel = vehicle.getVehicleModel();

        boolean isCompatible = compatibilityRepository.existsByProductIdAndVehicleModelId(productId, vehicleModel.getId());

        String message = isCompatible 
                ? "This part (" + product.getPartNumber() + ") is verified compatible with your " + vehicleModel.getModelName() + "."
                : "Warning: Part " + product.getPartNumber() + " is NOT compatible with your " + vehicleModel.getModelName() + ".";

        return CompatibilityResponse.builder()
                .compatible(isCompatible)
                .message(message)
                .vehicleModelName(vehicleModel.getModelName())
                .partNumber(product.getPartNumber())
                .build();
    }

    public List<ProductDto> getFallbackSimilarProducts(UUID productId, UUID vehicleModelId, int limit) {
        Product baseProduct = productRepository.findById(productId).orElse(null);
        if (baseProduct == null) return Collections.emptyList();

        List<Product> allActive = productRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE && !p.getId().equals(productId))
                .toList();

        List<ProductDto> scoredList = new java.util.ArrayList<>();

        for (Product cand : allActive) {
            boolean sameCategory = cand.getCategory() != null && baseProduct.getCategory() != null &&
                    cand.getCategory().getId().equals(baseProduct.getCategory().getId());
            boolean isVehicleCompat = vehicleModelId != null &&
                    compatibilityRepository.existsByProductIdAndVehicleModelId(cand.getId(), vehicleModelId);

            double cScore = isVehicleCompat ? 1.0 : (sameCategory ? 0.85 : 0.65);
            double specScore = sameCategory ? 0.90 : 0.60;
            double bScore = cand.getBrand() != null && baseProduct.getBrand() != null &&
                    cand.getBrand().equalsIgnoreCase(baseProduct.getBrand()) ? 1.0 : 0.75;

            double basePrice = baseProduct.getPrice() != null ? baseProduct.getPrice().doubleValue() : 1000.0;
            double candPrice = cand.getPrice() != null ? cand.getPrice().doubleValue() : 1000.0;
            double priceRatio = Math.abs(candPrice - basePrice) / Math.max(basePrice, 1.0);
            double pScore = Math.max(0.3, 1.0 - Math.min(priceRatio, 0.7));
            double rScore = cand.getRating() != null ? Math.min(1.0, cand.getRating() / 5.0) : 0.9;

            double totalScore = (0.40 * cScore) + (0.30 * specScore) + (0.15 * bScore) + (0.10 * pScore) + (0.05 * rScore);

            java.util.Map<String, Object> factors = new java.util.HashMap<>();
            factors.put("vehicleCompatibility", Math.round(cScore * 1000.0) / 10.0);
            factors.put("specificationMatch", Math.round(specScore * 1000.0) / 10.0);
            factors.put("brandMatch", Math.round(bScore * 1000.0) / 10.0);
            factors.put("priceValue", Math.round(pScore * 1000.0) / 10.0);
            factors.put("customerRating", Math.round(rScore * 1000.0) / 10.0);

            ProductDto dto = mapProductToDto(cand);
            dto.setRecommendationScore(Math.round(totalScore * 1000.0) / 1000.0);
            dto.setMatchReason(isVehicleCompat ? "BMW Model Match • Compatible" : (sameCategory ? "Same Category • Related Part" : "BMW Genuine OEM Component"));
            dto.setMatchFactors(factors);

            scoredList.add(dto);
        }

        scoredList.sort((a, b) -> Double.compare(b.getRecommendationScore() != null ? b.getRecommendationScore() : 0,
                a.getRecommendationScore() != null ? a.getRecommendationScore() : 0));

        return scoredList.stream().limit(limit).collect(Collectors.toList());
    }

    public List<ProductDto> getFallbackTrendingProducts(UUID vehicleModelId, int limit) {
        List<Product> allActive = productRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .toList();

        List<ProductDto> list = allActive.stream().map(p -> {
            ProductDto dto = mapProductToDto(p);
            double rating = p.getRating() != null ? p.getRating() : 4.5;
            dto.setRecommendationScore(Math.round((rating / 5.0) * 100.0) / 100.0);
            dto.setMatchReason(rating >= 4.7 ? "Top Rated • " + String.format("%.1f", rating) + "★ Choice" : "Best Seller • Popular Choice");

            java.util.Map<String, Object> factors = new java.util.HashMap<>();
            factors.put("vehicleCompatibility", 95.0);
            factors.put("specificationMatch", 85.0);
            factors.put("brandMatch", 100.0);
            factors.put("priceValue", 90.0);
            factors.put("customerRating", Math.round((rating / 5.0) * 1000.0) / 10.0);
            dto.setMatchFactors(factors);
            return dto;
        }).collect(Collectors.toList());

        list.sort((a, b) -> Double.compare(b.getRecommendationScore() != null ? b.getRecommendationScore() : 0,
                a.getRecommendationScore() != null ? a.getRecommendationScore() : 0));

        return list.stream().limit(limit).collect(Collectors.toList());
    }

    // Admin Management
    @Transactional
    public ProductDto createProduct(CreateProductRequest request, UUID adminUserId) {
        if (productRepository.existsByPartNumber(request.getPartNumber())) {
            throw new ConflictException("Part number already exists: " + request.getPartNumber());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .partNumber(request.getPartNumber())
                .name(request.getName())
                .description(request.getDescription())
                .brand(request.getBrand() != null ? request.getBrand() : "BMW OEM")
                .price(request.getPrice())
                .warrantyMonths(request.getWarrantyMonths() != null ? request.getWarrantyMonths() : 12)
                .imageUrl(request.getImageUrl())
                .rating(request.getRating() != null ? request.getRating() : 0.0)
                .status(request.getStatus() != null ? ProductStatus.valueOf(request.getStatus()) : ProductStatus.ACTIVE)
                .build();

        productRepository.save(product);

        // Save initial stock in inventory
        int initialStock = request.getInitialStock() != null ? request.getInitialStock() : 10;
        int threshold = request.getMinimumStockThreshold() != null ? request.getMinimumStockThreshold() : 5;

        Inventory inventory = Inventory.builder()
                .product(product)
                .availableQuantity(initialStock)
                .reservedQuantity(0)
                .minimumStockThreshold(threshold)
                .build();

        inventoryRepository.save(inventory);

        // Associate BMW Vehicle Models
        if (request.getCompatibleVehicleModelIds() != null) {
            for (UUID modelId : request.getCompatibleVehicleModelIds()) {
                VehicleModel model = vehicleModelRepository.findById(modelId).orElse(null);
                if (model != null) {
                    compatibilityRepository.save(PartCompatibility.builder()
                            .product(product)
                            .vehicleModel(model)
                            .notes("Compatible with " + model.getModelName())
                            .build());
                }
            }
        }

        auditLogService.logAction(adminUserId, "PRODUCT_CREATED", "PRODUCT", product.getId().toString(),
                "Created product " + product.getName() + " (" + product.getPartNumber() + ")");

        log.info("Admin created product: {}", product.getPartNumber());
        return mapProductToDto(product);
    }

    @Transactional
    public ProductDto updateProduct(UUID productId, CreateProductRequest request, UUID adminUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        if (request.getWarrantyMonths() != null) product.setWarrantyMonths(request.getWarrantyMonths());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getRating() != null) product.setRating(request.getRating());
        if (request.getStatus() != null) product.setStatus(ProductStatus.valueOf(request.getStatus()));

        productRepository.save(product);

        // Also update inventory if stock parameters were provided
        Inventory inv = inventoryRepository.findByProductId(productId).orElse(null);
        if (inv != null) {
            if (request.getInitialStock() != null) {
                inv.setAvailableQuantity(request.getInitialStock());
            }
            if (request.getMinimumStockThreshold() != null) {
                inv.setMinimumStockThreshold(request.getMinimumStockThreshold());
            }
            inventoryRepository.save(inv);
        } else {
            int stock = request.getInitialStock() != null ? request.getInitialStock() : 10;
            int threshold = request.getMinimumStockThreshold() != null ? request.getMinimumStockThreshold() : 5;
            inventoryRepository.save(Inventory.builder()
                    .product(product)
                    .availableQuantity(stock)
                    .reservedQuantity(0)
                    .minimumStockThreshold(threshold)
                    .build());
        }

        // Update compatible vehicle models
        if (request.getCompatibleVehicleModelIds() != null) {
            compatibilityRepository.deleteByProductId(product.getId());
            for (UUID modelId : request.getCompatibleVehicleModelIds()) {
                VehicleModel model = vehicleModelRepository.findById(modelId).orElse(null);
                if (model != null) {
                    compatibilityRepository.save(PartCompatibility.builder()
                            .product(product)
                            .vehicleModel(model)
                            .notes("Compatible with " + model.getModelName())
                            .build());
                }
            }
        }

        auditLogService.logAction(adminUserId, "PRODUCT_UPDATED", "PRODUCT", product.getId().toString(),
                "Updated product details for " + product.getPartNumber());

        return mapProductToDto(product);
    }

    @Transactional
    public void deactivateProduct(UUID productId, UUID adminUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);

        auditLogService.logAction(adminUserId, "PRODUCT_DEACTIVATED", "PRODUCT", productId.toString(),
                "Deactivated product " + product.getPartNumber());
    }

    // Compatibility Associations
    @Transactional
    public void addCompatibility(UUID productId, UUID vehicleModelId, String notes, UUID adminUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        VehicleModel model = vehicleModelRepository.findById(vehicleModelId)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleModel", "id", vehicleModelId));

        if (!compatibilityRepository.existsByProductIdAndVehicleModelId(productId, vehicleModelId)) {
            compatibilityRepository.save(PartCompatibility.builder()
                    .product(product)
                    .vehicleModel(model)
                    .notes(notes)
                    .build());

            auditLogService.logAction(adminUserId, "COMPATIBILITY_ADDED", "PRODUCT", productId.toString(),
                    "Added compatibility with " + model.getModelName());
        }
    }

    @Transactional
    public void removeCompatibility(UUID productId, UUID vehicleModelId, UUID adminUserId) {
        compatibilityRepository.deleteByProductIdAndVehicleModelId(productId, vehicleModelId);
        auditLogService.logAction(adminUserId, "COMPATIBILITY_REMOVED", "PRODUCT", productId.toString(),
                "Removed compatibility mapping");
    }

    // -----------------------------------------------------------------------
    // Mapping Helpers
    // -----------------------------------------------------------------------

    public CategoryDto mapCategoryToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .active(category.getActive())
                .build();
    }

    public ProductDto mapProductToDto(Product product) {
        Inventory inv = inventoryRepository.findByProductId(product.getId()).orElse(null);
        int available = inv != null ? inv.getAvailableQuantity() : 0;
        String stockStatus = inv != null ? inv.getCalculatedStatus().name() : "OUT_OF_STOCK";

        List<VehicleModelDto> compatibleModels = compatibilityRepository.findByProductId(product.getId()).stream()
                .map(comp -> vehicleService.mapModelToDto(comp.getVehicleModel()))
                .collect(Collectors.toList());

        return ProductDto.builder()
                .id(product.getId())
                .category(mapCategoryToDto(product.getCategory()))
                .partNumber(product.getPartNumber())
                .name(product.getName())
                .description(product.getDescription())
                .brand(product.getBrand())
                .price(product.getPrice())
                .warrantyMonths(product.getWarrantyMonths())
                .imageUrl(product.getImageUrl())
                .rating(product.getRating() != null ? product.getRating() : 0.0)
                .status(product.getStatus().name())
                .availableQuantity(available)
                .stockStatus(stockStatus)
                .compatibleModels(compatibleModels)
                .build();
    }
}
