SELECT 
    m.id,
    m.url,
    m.type,
    m.place_id,
    m.user_id,
    m.is_active,
    m.created_at,
    p.name as place_name
FROM "Media" m
LEFT JOIN "Place" p ON m.place_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;