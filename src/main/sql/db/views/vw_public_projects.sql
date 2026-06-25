-- ============================================================================
-- View: vw_public_projects
-- Description: Projects visible on the public portal. Used by the public 
--              /projects route. Pre-joins tags as a JSON array for 
--              single-query card rendering.
-- ============================================================================

CREATE OR REPLACE VIEW vw_public_projects AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.short_description,
  p.full_description,
  p.target_audience,
  p.required_skills,
  p.participation_mode,
  p.header_image_url,
  p.video_url,
  p.status,
  p.is_highlighted,
  p.max_collaborators,
  p.current_collaborator_count,
  JSON_ARRAYAGG(
    JSON_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug, 'category', t.category)
  ) AS tags,
  COALESCE(SUM(TIMESTAMPDIFF(MINUTE, pmd.start_time, pmd.end_time)), 0) AS weekly_duration_minutes,
  GROUP_CONCAT(
    DISTINCT CONCAT(pmd.day_of_week, COALESCE(CONCAT(' (', pmd.notes, ')'), ''))
    ORDER BY pmd.day_of_week SEPARATOR ', '
  ) AS meeting_days_summary
FROM projects p
LEFT JOIN project_tags pt  ON pt.project_id = p.id
LEFT JOIN tags t            ON t.id = pt.tag_id
LEFT JOIN project_meeting_days pmd ON pmd.project_id = p.id
WHERE p.is_visible = TRUE
  AND p.status NOT IN ('archivado')
GROUP BY p.id;
