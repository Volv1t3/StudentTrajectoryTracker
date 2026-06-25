-- ============================================================================
-- View: vw_collaborator_match_score
-- Description: Matching view: for each (collaborator, project) pair computes
--              a tag_overlap_count (shared tags) and a schedule_overlap flag
--              (TRUE if at least one availability_slot overlaps a 
--              project_meeting_day). Used by the admin linkage suggestion 
--              feature.
-- ============================================================================

CREATE OR REPLACE VIEW vw_collaborator_match_score AS
SELECT
  c.id                        AS collaborator_id,
  p.id                        AS project_id,
  p.title                     AS project_title,
  c.trajectory_status,
  COUNT(DISTINCT shared.id) AS tag_overlap_count,
  MAX(
    CASE WHEN asl.day_of_week IS NOT NULL
              AND pmd.day_of_week IS NOT NULL
         THEN 1 ELSE 0 END
  )                            AS has_schedule_overlap
FROM collaborators c
CROSS JOIN projects p
LEFT JOIN collaborator_tags ct    ON ct.collaborator_id = c.id
LEFT JOIN project_tags      ptag  ON ptag.project_id    = p.id
           AND ptag.tag_id = ct.tag_id
LEFT JOIN tags shared             ON shared.id = ct.tag_id
           AND shared.id = ptag.tag_id
LEFT JOIN availability_slots asl  ON asl.collaborator_id = c.id
LEFT JOIN project_meeting_days pmd ON pmd.project_id = p.id
           AND pmd.day_of_week = asl.day_of_week
WHERE p.is_visible = TRUE
  AND p.status = 'activo'
GROUP BY c.id, p.id;
