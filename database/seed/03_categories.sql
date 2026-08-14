-- 03_categories.sql Seed Data

INSERT INTO categories (id, name, description, active)
VALUES 
('c1111111-1111-1111-1111-111111111111', 'Brakes', 'High performance brake pads, rotors, sensors, and calipers', TRUE),
('c2222222-2222-2222-2222-222222222222', 'Engine', 'Engine components, spark plugs, belts, gaskets, and timing kits', TRUE),
('c3333333-3333-3333-3333-333333333333', 'Filters', 'Air filters, oil filters, cabin microfilters, and fuel filters', TRUE),
('c4444444-4444-4444-4444-444444444444', 'Suspension', 'Shock absorbers, struts, control arms, and stabilizer links', TRUE),
('c5555555-5555-5555-5555-555555555555', 'Electrical', 'Batteries, alternators, ignition coils, and LED headlights', TRUE),
('c6666666-6666-6666-6666-666666666666', 'Exterior', 'Wiper blades, side mirrors, grilles, and aerodynamic trims', TRUE),
('c7777777-7777-7777-7777-777777777777', 'Interior', 'Floor mats, pedal covers, gear knobs, and cabin accents', TRUE),
('c8888888-8888-8888-8888-888888888888', 'Accessories', 'Automotive care products, key fob covers, and emergency kits', TRUE)
ON CONFLICT (id) DO NOTHING;
