-- Tạo default categories nếu chưa có
INSERT INTO "categories" (id, name, slug, icon, color, "is_default", "user_id", "is_active", "created_at") 
SELECT 
  gen_random_uuid(),
  category_name,
  category_slug,
  category_icon,
  category_color,
  true,
  null,
  true,
  now()
FROM (VALUES
  ('Cafe', 'cafe', '☕', '#8B4513'),
  ('Food', 'food', '🍽️', '#FF6B35'),
  ('Bar', 'bar', '🍻', '#8E44AD'),
  ('Rooftop', 'rooftop', '🏢', '#3498DB'),
  ('Activity', 'activity', '🎯', '#E74C3C'),
  ('Landmark', 'landmark', '🏛️', '#2ECC71')
) AS default_categories(category_name, category_slug, category_icon, category_color)
WHERE NOT EXISTS (
  SELECT 1 FROM "categories" 
  WHERE slug = category_slug AND "user_id" IS NULL
);