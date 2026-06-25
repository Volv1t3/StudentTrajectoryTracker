-- ============================================================================
-- View: vw_public_events
-- Description: Public-facing events with tags aggregated.
-- ============================================================================

CREATE OR REPLACE VIEW vw_public_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.type,
  e.short_description,
  e.full_description,
  e.target_audience,
  e.location,
  e.event_date,
  e.event_end_date,
  e.registration_deadline,
  e.capacity,
  e.header_image_url,
  e.banner_image_url,
  e.registration_url,
  e.status,
  e.is_highlighted,
  JSON_ARRAYAGG(
    IF(t.id IS NOT NULL,
       JSON_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug),
       NULL)
  ) AS tags
FROM events e
LEFT JOIN event_tags et ON et.event_id = e.id
LEFT JOIN tags t        ON t.id = et.tag_id
WHERE e.is_visible = TRUE
  AND e.status NOT IN ('cancelado')
GROUP BY e.id;
