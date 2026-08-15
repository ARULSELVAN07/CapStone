-- 04_products.sql Seed Data

INSERT INTO products (id, category_id, part_number, name, description, brand, price, warranty_months, image_url, status)
VALUES 
-- Brakes
('bb111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'BP-X3-001', 'BMW Front Brake Pad Set', 'Genuine OEM ceramic composite front brake pads for high thermal stability and minimal dust emission.', 'BMW OEM', 8499.00, 24, 'https://images.unsplash.com/photo-1600706432520-27f71122a275?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'BD-G01-002', 'BMW Vented Front Brake Disc Rotor', 'High-carbon ventilated steel brake disc rotor designed for optimal heat dissipation and wet friction performance.', 'BMW Genuine Parts', 12999.00, 24, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb111111-1111-1111-1111-111111111113', 'c1111111-1111-1111-1111-111111111113', 'BS-3S-003', 'BMW Rear Brake Wear Sensor', 'Electronic brake wear indicator sensor with high-temperature resistance insulation wire.', 'BOSCH Automotive', 1499.00, 12, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Filters
('bb222222-2222-2222-2222-222222222221', 'c3333333-3333-3333-3333-333333333333', 'AF-G20-101', 'BMW High Flow Engine Air Filter', 'Multi-layer synthetic mesh engine air filter designed to maximum airflow while filtering 99.4% of particulates.', 'BMW OEM', 3299.00, 12, 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'OF-B58-102', 'BMW Synthetic Engine Oil Filter Insert', 'High efficiency oil filter cartridge with O-rings designed for B48 and B58 TwinPower Turbo engines.', 'MANN Filter', 1899.00, 12, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb222222-2222-2222-2222-222222222223', 'c3333333-3333-3333-3333-333333333333', 'CF-ACT-103', 'BMW Activated Charcoal Cabin Air Filter', 'Dual-stage activated carbon microfilter eliminating pollen, smog particles, micro-dust, and unpleasant odors.', 'BMW Genuine Parts', 4199.00, 12, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Engine
('bb333333-3333-3333-3333-333333333331', 'c2222222-2222-2222-2222-222222222222', 'SP-NGK-201', 'BMW High Performance Iridium Spark Plug', 'Laser iridium core spark plug delivering crisp throttle response and ultra-clean fuel ignition.', 'NGK Spark Plugs', 1999.00, 18, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb333333-3333-3333-3333-333333333332', 'c2222222-2222-2222-2222-222222222222', 'EO-LL04-202', 'BMW TwinPower Turbo 5W-30 Engine Oil (1L)', 'Fully synthetic Longlife-04 formula engine oil engineered specifically for modern BMW turbo engines.', 'BMW OEM Shell', 1249.00, 12, 'https://images.unsplash.com/photo-1545665277-5937489579f2?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'IC-DEL-203', 'BMW Direct Ignition Coil', 'High voltage output ignition coil for precise cylinder spark timing and maximum combustion efficiency.', 'Delphi Technologies', 3799.00, 24, 'https://images.unsplash.com/photo-1504222490345-c075b6008014?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Electrical
('bb444444-4444-4444-4444-444444444441', 'c5555555-5555-5555-5555-555555555555', 'BT-AGM-301', 'BMW AGM Start-Stop Battery 90Ah', 'Absorbent Glass Mat (AGM) battery with exceptional cold cranking power and rapid charging efficiency.', 'VARTA Automotive', 24999.00, 36, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb444444-4444-4444-4444-444444444442', 'c5555555-5555-5555-5555-555555555555', 'ALT-VAL-302', 'BMW 180A Alternator Assembly', 'Heavy duty 180 Amp power generator alternator with built-in electronic voltage regulator.', 'Valeo OEM', 32499.00, 24, 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Suspension
('bb555555-5555-5555-5555-555555555551', 'c4444444-4444-4444-4444-444444444444', 'SA-BIL-401', 'BMW Gas-Pressure Shock Absorber (Front)', 'B6 Performance gas-pressure damper offering superior vehicle stability and sporty handling dynamics.', 'BILSTEIN', 18499.00, 24, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb555555-5555-5555-5555-555555555552', 'c4444444-4444-4444-4444-444444444444', 'CA-LEM-402', 'BMW Front Lower Control Arm Assembly', 'Forged aluminum suspension control arm complete with pre-pressed heavy duty rubber bushing and ball joint.', 'Lemforder', 9899.00, 24, 'https://images.unsplash.com/photo-1600706432520-27f71122a275?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Exterior
('bb666666-6666-6666-6666-666666666661', 'c6666666-6666-6666-6666-666666666666', 'WB-VAL-501', 'BMW Aerotwin Front Wiper Blade Set', 'Flexible frameless wiper blades with graphite coating for silent and streak-free rain clearing.', 'BOSCH Aerotwin', 2999.00, 12, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb666666-6666-6666-6666-666666666662', 'c6666666-6666-6666-6666-666666666666', 'SM-MP-502', 'BMW M Performance Carbon Mirror Caps', 'Handcrafted real carbon fiber aerodynamic mirror covers with clear UV-resistant high-gloss coating.', 'BMW M Performance', 16499.00, 24, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),

-- Interior & Accessories
('bb777777-7777-7777-7777-777777777771', 'c7777777-7777-7777-7777-777777777777', 'FM-ALL-601', 'BMW All-Weather Floor Mats Set', 'Heavy duty laser-measured thermoplastic floor mats with raised lip contours for dirt and liquid containment.', 'BMW Genuine Accessories', 10999.00, 36, 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60', 'ACTIVE'),
('bb888888-8888-8888-8888-888888888881', 'c8888888-8888-8888-8888-888888888888', 'KC-MET-701', 'BMW M Sport Key Fob Cover Case', 'CNC machined alloy protective key cover with blue and red metallic accents.', 'BMW Genuine Accessories', 2499.00, 12, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&auto=format&fit=crop&q=60', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
