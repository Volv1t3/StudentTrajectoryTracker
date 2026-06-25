-- ============================================================================
-- View: vw_admin_collaborators
-- Description: Full collaborator list for admin panel with tag list and
--              active assignment count pre-computed.
-- ============================================================================

CREATE OR REPLACE VIEW vw_admin_collaborators AS
SELECT
  c.id,
  c.first_name,
  c.middle_name,
  c.last_name,
  c.second_last_name,
  c.personal_email,
  c.usfq_email,
  c.phone_number,
  c.date_of_birth,
  c.major,
  c.current_university_year,
  c.expected_graduation_year,
  c.experience_description,
  c.motivation_description,
  c.interest_in_training,
  c.interest_in_research,
  c.interest_in_fabrication,
  c.trajectory_status,
  c.profile_complete,
  c.intake_source,
  c.created_at,
  c.updated_at,
  (SELECT COUNT(*) FROM assignments a
   WHERE a.collaborator_id = c.id AND a.status = 'activo') AS active_assignment_count,
  (SELECT COUNT(*) FROM applications ap
   WHERE ap.collaborator_id = c.id
     AND ap.status = 'pendiente')                           AS pending_application_count,
  JSON_ARRAYAGG(
    IF(t.id IS NOT NULL,
       JSON_OBJECT('id', t.id, 'name', t.name, 'category', t.category),
       NULL)
  ) AS tags
FROM collaborators c
LEFT JOIN collaborator_tags ct ON ct.collaborator_id = c.id
LEFT JOIN tags t               ON t.id = ct.tag_id
GROUP BY c.id;
