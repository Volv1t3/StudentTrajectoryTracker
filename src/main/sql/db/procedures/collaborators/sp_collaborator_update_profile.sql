-- ============================================================================
-- Procedure: sp_collaborator_update_profile
-- Description: Updates editable profile fields for a collaborator.
--              NULL values are ignored (COALESCE keeps existing value).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_update_profile;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_update_profile(
  IN p_collaborator_id          INT UNSIGNED,
  IN p_first_name               VARCHAR(100),
  IN p_middle_name              VARCHAR(100),
  IN p_last_name                VARCHAR(100),
  IN p_second_last_name         VARCHAR(100),
  IN p_personal_email           VARCHAR(255),
  IN p_usfq_email               VARCHAR(255),
  IN p_phone_number             VARCHAR(20),
  IN p_date_of_birth            DATE,
  IN p_major                    VARCHAR(150),
  IN p_current_university_year  TINYINT UNSIGNED,
  IN p_expected_graduation_year YEAR,
  IN p_experience_description   TEXT,
  IN p_motivation_description   TEXT,
  IN p_interest_in_machinery    BOOLEAN,
  IN p_interest_in_design       BOOLEAN,
  IN p_interest_in_materials    BOOLEAN,
  IN p_actor_id                 INT UNSIGNED,
  IN p_ip_address               VARCHAR(45)
)
BEGIN
  DECLARE v_profile_complete BOOLEAN DEFAULT FALSE;

  UPDATE collaborators SET
    first_name               = COALESCE(p_first_name, first_name),
    middle_name              = COALESCE(p_middle_name, middle_name),
    last_name                = COALESCE(p_last_name, last_name),
    second_last_name         = COALESCE(p_second_last_name, second_last_name),
    personal_email           = COALESCE(p_personal_email, personal_email),
    usfq_email               = COALESCE(p_usfq_email, usfq_email),
    phone_number             = COALESCE(p_phone_number, phone_number),
    date_of_birth            = COALESCE(p_date_of_birth, date_of_birth),
    major                    = COALESCE(p_major, major),
    current_university_year  = COALESCE(p_current_university_year, current_university_year),
    expected_graduation_year = COALESCE(p_expected_graduation_year, expected_graduation_year),
    experience_description   = COALESCE(p_experience_description, experience_description),
    motivation_description   = COALESCE(p_motivation_description, motivation_description),
    interest_in_machinery    = p_interest_in_machinery,
    interest_in_design       = p_interest_in_design,
    interest_in_materials    = p_interest_in_materials,
    updated_at               = NOW()
  WHERE id = p_collaborator_id;

  -- Re-evaluate profile completeness after update
  SELECT
    (major IS NOT NULL AND major != ''
     AND current_university_year IS NOT NULL
     AND expected_graduation_year IS NOT NULL
     AND motivation_description IS NOT NULL AND motivation_description != '')
  INTO v_profile_complete
  FROM collaborators WHERE id = p_collaborator_id;

  UPDATE collaborators SET profile_complete = v_profile_complete WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    IF(p_actor_id IS NOT NULL, 'Administrador', 'Sistema'),
    p_actor_id, 'Actualizar',
    'collaborators', p_collaborator_id,
    NULL, NULL,
    'Collaborator profile updated',
    p_ip_address
  );
END$$

DELIMITER ;
