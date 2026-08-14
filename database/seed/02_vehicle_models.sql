-- 02_vehicle_models.sql Seed Data

INSERT INTO vehicle_models (id, model_name, model_code, model_year, engine_type, fuel_type)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'BMW 3 Series', 'G20', 2023, '2.0L TwinPower Turbo 4-Cylinder', 'Petrol'),
('a2222222-2222-2222-2222-222222222222', 'BMW 5 Series', 'G30', 2022, '2.0L TwinPower Turbo Diesel', 'Diesel'),
('a3333333-3333-3333-3333-333333333333', 'BMW X1', 'F48', 2021, '2.0L Turbocharged I4', 'Petrol'),
('a4444444-4444-4444-4444-444444444444', 'BMW X3', 'G01', 2022, '2.0L TwinPower Turbo 4-Cylinder', 'Petrol'),
('a5555555-5555-5555-5555-555555555555', 'BMW X5', 'G05', 2023, '3.0L TwinPower Turbo Inline 6', 'Petrol'),
('a6666666-6666-6666-6666-666666666666', 'BMW M340i', 'G20-M', 2023, '3.0L B58 Turbo Inline 6', 'Petrol')
ON CONFLICT (id) DO NOTHING;
