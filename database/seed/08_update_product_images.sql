-- 08_update_product_images.sql
-- Updates image_url on seeded products to use picsum.photos (reliable, no referrer-policy blocks).
-- Run manually against the DB or add as a Docker init script.

UPDATE products SET image_url = 'https://picsum.photos/seed/brakepad/500/500'   WHERE id = 'bb111111-1111-1111-1111-111111111111';
UPDATE products SET image_url = 'https://picsum.photos/seed/brakedisc/500/500'   WHERE id = 'bb111111-1111-1111-1111-111111111112';
UPDATE products SET image_url = 'https://picsum.photos/seed/brakesensor/500/500' WHERE id = 'bb111111-1111-1111-1111-111111111113';

UPDATE products SET image_url = 'https://picsum.photos/seed/airfilter/500/500'   WHERE id = 'bb222222-2222-2222-2222-222222222221';
UPDATE products SET image_url = 'https://picsum.photos/seed/oilfilter/500/500'   WHERE id = 'bb222222-2222-2222-2222-222222222222';
UPDATE products SET image_url = 'https://picsum.photos/seed/cabinfilter/500/500' WHERE id = 'bb222222-2222-2222-2222-222222222223';

UPDATE products SET image_url = 'https://picsum.photos/seed/sparkplug/500/500'    WHERE id = 'bb333333-3333-3333-3333-333333333331';
UPDATE products SET image_url = 'https://picsum.photos/seed/engineoil/500/500'    WHERE id = 'bb333333-3333-3333-3333-333333333332';
UPDATE products SET image_url = 'https://picsum.photos/seed/ignitioncoil/500/500' WHERE id = 'bb333333-3333-3333-3333-333333333333';

UPDATE products SET image_url = 'https://picsum.photos/seed/carbattery/500/500' WHERE id = 'bb444444-4444-4444-4444-444444444441';
UPDATE products SET image_url = 'https://picsum.photos/seed/alternator/500/500' WHERE id = 'bb444444-4444-4444-4444-444444444442';

UPDATE products SET image_url = 'https://picsum.photos/seed/shockabs/500/500'  WHERE id = 'bb555555-5555-5555-5555-555555555551';
UPDATE products SET image_url = 'https://picsum.photos/seed/controlarm/500/500' WHERE id = 'bb555555-5555-5555-5555-555555555552';

UPDATE products SET image_url = 'https://picsum.photos/seed/wiperblade/500/500' WHERE id = 'bb666666-6666-6666-6666-666666666661';
UPDATE products SET image_url = 'https://picsum.photos/seed/mirrorcap/500/500'  WHERE id = 'bb666666-6666-6666-6666-666666666662';

UPDATE products SET image_url = 'https://picsum.photos/seed/floormats/500/500' WHERE id = 'bb777777-7777-7777-7777-777777777771';
UPDATE products SET image_url = 'https://picsum.photos/seed/keyfob/500/500'    WHERE id = 'bb888888-8888-8888-8888-888888888881';
