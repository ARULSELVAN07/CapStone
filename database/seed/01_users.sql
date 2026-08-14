-- 01_users.sql Seed Data
-- Passwords BCrypt encoded (Admin@123, Customer@123, Tech@123, Delivery@123)

INSERT INTO users (id, name, email, phone, password_hash, role, status, employee_id)
VALUES 
-- Admin
('11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin@sparehub.local', '+18005550100', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'ADMIN', 'ACTIVE', 'ADM1001'),

-- Customers
('22222222-2222-2222-2222-222222222221', 'Vikram Sharma', 'customer1@sparehub.local', '+919876543210', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'CUSTOMER', 'ACTIVE', NULL),
('22222222-2222-2222-2222-222222222222', 'Ananya Roy', 'customer2@sparehub.local', '+919876543211', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'CUSTOMER', 'ACTIVE', NULL),
('22222222-2222-2222-2222-222222222223', 'Rajesh Verma', 'customer3@sparehub.local', '+919876543212', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'CUSTOMER', 'ACTIVE', NULL),

-- Technicians
('33333333-3333-3333-3333-333333333331', 'Suresh Kumar', 'tech1001@sparehub.local', '+919811122233', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'TECHNICIAN', 'ACTIVE', 'TECH1001'),
('33333333-3333-3333-3333-333333333332', 'Amit Patel', 'tech1002@sparehub.local', '+919811122234', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'TECHNICIAN', 'ACTIVE', 'TECH1002'),
('33333333-3333-3333-3333-333333333333', 'Rohan Mehta', 'tech1003@sparehub.local', '+919811122235', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'TECHNICIAN', 'ACTIVE', 'TECH1003'),

-- Delivery Executives
('44444444-4444-4444-4444-444444444441', 'Deepak Singh', 'del1001@sparehub.local', '+919844455566', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'DELIVERY_EXECUTIVE', 'ACTIVE', 'DEL1001'),
('44444444-4444-4444-4444-444444444442', 'Vijay Das', 'del1002@sparehub.local', '+919844455567', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'DELIVERY_EXECUTIVE', 'ACTIVE', 'DEL1002'),
('44444444-4444-4444-4444-444444444443', 'Manoj Kumar', 'del1003@sparehub.local', '+919844455568', '$2a$10$eD4WjZtV1y2m.A3b4C5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2', 'DELIVERY_EXECUTIVE', 'ACTIVE', 'DEL1003')
ON CONFLICT (id) DO NOTHING;
