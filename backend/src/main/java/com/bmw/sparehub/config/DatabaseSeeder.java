package com.bmw.sparehub.config;

import com.bmw.sparehub.inventory.entity.Inventory;
import com.bmw.sparehub.inventory.repository.InventoryRepository;
import com.bmw.sparehub.product.entity.Category;
import com.bmw.sparehub.product.entity.PartCompatibility;
import com.bmw.sparehub.product.entity.Product;
import com.bmw.sparehub.product.entity.ProductStatus;
import com.bmw.sparehub.product.repository.CategoryRepository;
import com.bmw.sparehub.product.repository.PartCompatibilityRepository;
import com.bmw.sparehub.product.repository.ProductRepository;
import com.bmw.sparehub.technician.entity.Technician;
import com.bmw.sparehub.technician.entity.TechnicianStatus;
import com.bmw.sparehub.technician.repository.TechnicianRepository;
import com.bmw.sparehub.user.entity.User;
import com.bmw.sparehub.user.entity.UserRole;
import com.bmw.sparehub.user.entity.UserStatus;
import com.bmw.sparehub.user.repository.UserRepository;
import com.bmw.sparehub.vehicle.entity.VehicleModel;
import com.bmw.sparehub.vehicle.repository.VehicleModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PartCompatibilityRepository compatibilityRepository;
    private final InventoryRepository inventoryRepository;
    private final TechnicianRepository technicianRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("Database is empty. Initiating programmatic seed data insertion...");
            seedUsers();
            seedVehicleModels();
            seedCategoriesAndProducts();
        } else {
            log.info("Database contains pre-seeded SQL users. Ensuring valid BCrypt password hashes...");
            updateUserPasswords();
        }
    }

    private void updateUserPasswords() {
        userRepository.findByEmail("admin@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Admin@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("customer1@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Customer@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("customer2@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Customer@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("customer3@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Customer@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("tech1001@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Tech@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("tech1002@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Tech@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("tech1003@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Tech@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("del1001@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Delivery@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("del1002@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Delivery@123"));
            userRepository.save(u);
        });
        userRepository.findByEmail("del1003@sparehub.local").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Delivery@123"));
            userRepository.save(u);
        });
    }

    private void seedUsers() {
        // Admin
        User admin = User.builder()
                .name("System Administrator")
                .email("admin@sparehub.local")
                .phone("+18005550100")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .employeeId("ADM1001")
                .build();
        userRepository.save(admin);

        // Customers
        User customer1 = User.builder()
                .name("Vikram Sharma")
                .email("customer1@sparehub.local")
                .phone("+919876543210")
                .passwordHash(passwordEncoder.encode("Customer@123"))
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(customer1);

        User customer2 = User.builder()
                .name("Ananya Roy")
                .email("customer2@sparehub.local")
                .phone("+919876543211")
                .passwordHash(passwordEncoder.encode("Customer@123"))
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(customer2);

        // Technicians
        User techUser1 = User.builder()
                .name("Suresh Kumar")
                .email("tech1001@sparehub.local")
                .phone("+919811122233")
                .passwordHash(passwordEncoder.encode("Tech@123"))
                .role(UserRole.TECHNICIAN)
                .status(UserStatus.ACTIVE)
                .employeeId("TECH1001")
                .build();
        userRepository.save(techUser1);

        User techUser2 = User.builder()
                .name("Amit Patel")
                .email("tech1002@sparehub.local")
                .phone("+919811122234")
                .passwordHash(passwordEncoder.encode("Tech@123"))
                .role(UserRole.TECHNICIAN)
                .status(UserStatus.ACTIVE)
                .employeeId("TECH1002")
                .build();
        userRepository.save(techUser2);

        technicianRepository.save(Technician.builder()
                .user(techUser1)
                .name(techUser1.getName())
                .phone(techUser1.getPhone())
                .email(techUser1.getEmail())
                .status(TechnicianStatus.AVAILABLE)
                .build());

        technicianRepository.save(Technician.builder()
                .user(techUser2)
                .name(techUser2.getName())
                .phone(techUser2.getPhone())
                .email(techUser2.getEmail())
                .status(TechnicianStatus.AVAILABLE)
                .build());

        // Delivery Executives
        User delUser1 = User.builder()
                .name("Deepak Singh")
                .email("del1001@sparehub.local")
                .phone("+919844455566")
                .passwordHash(passwordEncoder.encode("Delivery@123"))
                .role(UserRole.DELIVERY_EXECUTIVE)
                .status(UserStatus.ACTIVE)
                .employeeId("DEL1001")
                .build();
        userRepository.save(delUser1);

        User delUser2 = User.builder()
                .name("Vijay Das")
                .email("del1002@sparehub.local")
                .phone("+919844455567")
                .passwordHash(passwordEncoder.encode("Delivery@123"))
                .role(UserRole.DELIVERY_EXECUTIVE)
                .status(UserStatus.ACTIVE)
                .employeeId("DEL1002")
                .build();
        userRepository.save(delUser2);

        log.info("Seeded users (Admin, Customers, Technicians, Delivery Executives)");
    }

    private void seedVehicleModels() {
        if (vehicleModelRepository.count() == 0) {
            vehicleModelRepository.saveAll(List.of(
                    VehicleModel.builder().modelName("BMW 3 Series").modelCode("G20").modelYear(2023).engineType("2.0L TwinPower Turbo 4-Cylinder").fuelType("Petrol").build(),
                    VehicleModel.builder().modelName("BMW 5 Series").modelCode("G30").modelYear(2022).engineType("2.0L TwinPower Turbo Diesel").fuelType("Diesel").build(),
                    VehicleModel.builder().modelName("BMW X1").modelCode("F48").modelYear(2021).engineType("2.0L Turbocharged I4").fuelType("Petrol").build(),
                    VehicleModel.builder().modelName("BMW X3").modelCode("G01").modelYear(2022).engineType("2.0L TwinPower Turbo 4-Cylinder").fuelType("Petrol").build(),
                    VehicleModel.builder().modelName("BMW X5").modelCode("G05").modelYear(2023).engineType("3.0L TwinPower Turbo Inline 6").fuelType("Petrol").build(),
                    VehicleModel.builder().modelName("BMW M340i").modelCode("G20-M").modelYear(2023).engineType("3.0L B58 Turbo Inline 6").fuelType("Petrol").build()
            ));
            log.info("Seeded BMW Vehicle Models");
        }
    }

    private void seedCategoriesAndProducts() {
        if (categoryRepository.count() == 0) {
            Category brakes = categoryRepository.save(Category.builder().name("Brakes").description("Brake pads, discs, sensors").active(true).build());
            Category filters = categoryRepository.save(Category.builder().name("Filters").description("Air, oil, and cabin filters").active(true).build());
            Category engine = categoryRepository.save(Category.builder().name("Engine").description("Spark plugs, oils, and ignition components").active(true).build());
            Category electrical = categoryRepository.save(Category.builder().name("Electrical").description("Batteries, alternators").active(true).build());
            Category suspension = categoryRepository.save(Category.builder().name("Suspension").description("Shock absorbers, control arms").active(true).build());
            Category exterior = categoryRepository.save(Category.builder().name("Exterior").description("Wiper blades, mirror caps").active(true).build());
            categoryRepository.save(Category.builder().name("Interior").description("Floor mats, cabin accessories").active(true).build());
            categoryRepository.save(Category.builder().name("Accessories").description("Key fob covers, detailing").active(true).build());

            VehicleModel modelX3 = vehicleModelRepository.findByModelCode("G01").orElse(null);
            VehicleModel modelX5 = vehicleModelRepository.findByModelCode("G05").orElse(null);
            VehicleModel model3Series = vehicleModelRepository.findByModelCode("G20").orElse(null);
            VehicleModel modelM340i = vehicleModelRepository.findByModelCode("G20-M").orElse(null);

            // Product 1: BMW Front Brake Pad Set
            Product p1 = productRepository.save(Product.builder()
                    .category(brakes)
                    .partNumber("BP-X3-001")
                    .name("BMW Front Brake Pad Set")
                    .description("Genuine OEM ceramic composite front brake pads for high thermal stability and minimal dust emission.")
                    .brand("BMW OEM")
                    .price(new BigDecimal("8499.00"))
                    .warrantyMonths(24)
                    .imageUrl("https://images.unsplash.com/photo-1600706432520-27f71122a275?w=500&auto=format&fit=crop&q=60")
                    .status(ProductStatus.ACTIVE)
                    .build());
            inventoryRepository.save(Inventory.builder().product(p1).availableQuantity(25).reservedQuantity(0).minimumStockThreshold(5).build());

            if (modelX3 != null) compatibilityRepository.save(PartCompatibility.builder().product(p1).vehicleModel(modelX3).notes("Compatible with BMW X3 (G01)").build());
            if (modelX5 != null) compatibilityRepository.save(PartCompatibility.builder().product(p1).vehicleModel(modelX5).notes("Compatible with BMW X5 (G05)").build());

            // Product 2: BMW Vented Front Brake Disc Rotor
            Product p2 = productRepository.save(Product.builder()
                    .category(brakes)
                    .partNumber("BD-G01-002")
                    .name("BMW Vented Front Brake Disc Rotor")
                    .description("High-carbon ventilated steel brake disc rotor designed for optimal heat dissipation.")
                    .brand("BMW Genuine Parts")
                    .price(new BigDecimal("12999.00"))
                    .warrantyMonths(24)
                    .imageUrl("https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60")
                    .status(ProductStatus.ACTIVE)
                    .build());
            inventoryRepository.save(Inventory.builder().product(p2).availableQuantity(12).reservedQuantity(0).minimumStockThreshold(3).build());
            if (modelX3 != null) compatibilityRepository.save(PartCompatibility.builder().product(p2).vehicleModel(modelX3).notes("Standard 348x36mm brake rotor for G01 X3").build());
            if (modelX5 != null) compatibilityRepository.save(PartCompatibility.builder().product(p2).vehicleModel(modelX5).notes("Front axle brake disc rotor for G05 X5").build());

            // Product 3: BMW High Flow Engine Air Filter
            Product p3 = productRepository.save(Product.builder()
                    .category(filters)
                    .partNumber("AF-G20-101")
                    .name("BMW High Flow Engine Air Filter")
                    .description("Multi-layer synthetic mesh engine air filter designed to maximum airflow.")
                    .brand("BMW OEM")
                    .price(new BigDecimal("3299.00"))
                    .warrantyMonths(12)
                    .imageUrl("https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=60")
                    .status(ProductStatus.ACTIVE)
                    .build());
            inventoryRepository.save(Inventory.builder().product(p3).availableQuantity(30).reservedQuantity(0).minimumStockThreshold(5).build());
            if (model3Series != null) compatibilityRepository.save(PartCompatibility.builder().product(p3).vehicleModel(model3Series).notes("Engine air intake filter for 3 Series").build());
            if (modelM340i != null) compatibilityRepository.save(PartCompatibility.builder().product(p3).vehicleModel(modelM340i).notes("Fits BMW M340i B58 air box").build());

            // Product 4: BMW High Performance Iridium Spark Plug
            Product p4 = productRepository.save(Product.builder()
                    .category(engine)
                    .partNumber("SP-NGK-201")
                    .name("BMW High Performance Iridium Spark Plug")
                    .description("Laser iridium core spark plug delivering crisp throttle response.")
                    .brand("NGK Spark Plugs")
                    .price(new BigDecimal("1999.00"))
                    .warrantyMonths(18)
                    .imageUrl("https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=60")
                    .status(ProductStatus.ACTIVE)
                    .build());
            inventoryRepository.save(Inventory.builder().product(p4).availableQuantity(60).reservedQuantity(0).minimumStockThreshold(10).build());
            if (model3Series != null) compatibilityRepository.save(PartCompatibility.builder().product(p4).vehicleModel(model3Series).notes("NGK Iridium for B48").build());
            if (modelX3 != null) compatibilityRepository.save(PartCompatibility.builder().product(p4).vehicleModel(modelX3).notes("NGK Iridium for X3 Turbo").build());

            // Product 5: BMW AGM Start-Stop Battery 90Ah
            Product p5 = productRepository.save(Product.builder()
                    .category(electrical)
                    .partNumber("BT-AGM-301")
                    .name("BMW AGM Start-Stop Battery 90Ah")
                    .description("Absorbent Glass Mat (AGM) battery with exceptional cold cranking power.")
                    .brand("VARTA Automotive")
                    .price(new BigDecimal("24999.00"))
                    .warrantyMonths(36)
                    .imageUrl("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&auto=format&fit=crop&q=60")
                    .status(ProductStatus.ACTIVE)
                    .build());
            inventoryRepository.save(Inventory.builder().product(p5).availableQuantity(2).reservedQuantity(0).minimumStockThreshold(3).build()); // Low stock!
            if (modelX3 != null) compatibilityRepository.save(PartCompatibility.builder().product(p5).vehicleModel(modelX3).notes("OEM 90Ah battery for X3 G01").build());
            if (modelX5 != null) compatibilityRepository.save(PartCompatibility.builder().product(p5).vehicleModel(modelX5).notes("OEM 90Ah battery for X5 G05").build());

            log.info("Seeded Products, Compatibility, and Inventory records.");
        }
    }
}
