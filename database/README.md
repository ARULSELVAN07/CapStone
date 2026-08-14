# BMW SpareHub Database Documentation

This folder contains the PostgreSQL DDL schema and initial seed data for the BMW SpareHub application.

## Directory Structure

- `schema/01_schema.sql`: Primary database DDL creating tables, primary/foreign keys, unique constraints, check constraints, and performance indexes.
- `seed/`: Modular seed SQL scripts loaded automatically by Docker Compose or Spring Boot Seeder:
  - `01_users.sql`: Default Admin, Customers, Technicians, and Delivery Executives.
  - `02_vehicle_models.sql`: Seed BMW Vehicle Models (Series 3, 5, X1, X3, X5, M340i).
  - `03_categories.sql`: Spare parts categories (Brakes, Engine, Filters, etc.).
  - `04_products.sql`: Realistic OEM products with prices and part numbers.
  - `05_compatibility.sql`: Mapping products to compatible BMW vehicle models.
  - `06_inventory.sql`: Available & reserved stock levels.
  - `07_technicians.sql`: Technician profiles.

## Running SQL Scripts Manually

If not using Docker, execute:

```bash
psql -U sparehub_user -d sparehub_db -f schema/01_schema.sql
psql -U sparehub_user -d sparehub_db -f seed/01_users.sql
psql -U sparehub_user -d sparehub_db -f seed/02_vehicle_models.sql
psql -U sparehub_user -d sparehub_db -f seed/03_categories.sql
psql -U sparehub_user -d sparehub_db -f seed/04_products.sql
psql -U sparehub_user -d sparehub_db -f seed/05_compatibility.sql
psql -U sparehub_user -d sparehub_db -f seed/06_inventory.sql
psql -U sparehub_user -d sparehub_db -f seed/07_technicians.sql
```
