-- ============================================================================
-- Procedure: sp_collaborator_register
-- Description: Inserts a new collaborator from the public interest form with
--              tags and availability slots in a single transaction.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_register;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_register(
  IN  p_first_name               VARCHAR(100),
  IN  p_middle_name              VARCHAR(100),
  IN  p_last_name                VARCHAR(100),
  IN  p_second_last_name         VARCHAR(100),
  IN  p_personal_email           VARCHAR(255),
  IN  p_usfq_email               VARCHAR(255),
  IN  p_phone_number             VARCHAR(20),
  IN  p_date_of_birth            DATE,
  IN  p_major                    VARCHAR(150),
  IN  p_current_university_year  TINYINT UNSIGNED,
  IN  p_expected_graduation_year YEAR,
  IN  p_experience_description   TEXT,
  IN  p_motivation_description   TEXT,
  IN  p_interest_in_training     BOOLEAN,
  IN  p_interest_in_research     BOOLEAN,
  IN  p_interest_in_fabrication  BOOLEAN,
  IN  p_intake_source            VARCHAR(100),
  IN  p_tag_ids                  JSON,
  IN  p_availability_slots       JSON,
  OUT p_collaborator_id          INT UNSIGNED
)
BEGIN
  DECLARE v_tag_count  INT DEFAULT 0;
  DECLARE v_slot_count INT DEFAULT 0;
  DECLARE v_i          INT DEFAULT 0;
  DECLARE v_tag_id     INT UNSIGNED;
  DECLARE v_day        VARCHAR(20);
  DECLARE v_from       TIME;
  DECLARE v_to         TIME;
  DECLARE v_notes      VARCHAR(200);

  -- Duplicate email guard
  IF EXISTS (SELECT 1 FROM collaborators WHERE personal_email = p_personal_email) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'personal_email already registered';
  END IF;

  IF p_usfq_email IS NOT NULL AND
     EXISTS (SELECT 1 FROM collaborators WHERE usfq_email = p_usfq_email) THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'usfq_email already registered';
  END IF;

  START TRANSACTION;

    INSERT INTO collaborators (
      first_name, middle_name, last_name, second_last_name,
      personal_email, usfq_email, phone_number, date_of_birth,
      major, current_university_year, expected_graduation_year,
      experience_description, motivation_description,
      interest_in_training, interest_in_research, interest_in_fabrication,
      trajectory_status, profile_complete, intake_source,
      created_at, updated_at
    ) VALUES (
      p_first_name, p_middle_name, p_last_name, p_second_last_name,
      p_personal_email, p_usfq_email, p_phone_number, p_date_of_birth,
      p_major, p_current_university_year, p_expected_graduation_year,
      p_experience_description, p_motivation_description,
      p_interest_in_training, p_interest_in_research, p_interest_in_fabrication,
      'nuevo', FALSE, p_intake_source,
      NOW(), NOW()
    );

    SET p_collaborator_id = LAST_INSERT_ID();

    -- Insert tags
    IF JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_tag_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_tag_count DO
        SET v_tag_id = JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']'));
        INSERT IGNORE INTO collaborator_tags (collaborator_id, tag_id, created_at)
        VALUES (p_collaborator_id, v_tag_id, NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Insert availability slots
    SET v_i = 0;
    IF p_availability_slots IS NOT NULL AND JSON_LENGTH(p_availability_slots) > 0 THEN
      SET v_slot_count = JSON_LENGTH(p_availability_slots);
      WHILE v_i < v_slot_count DO
        SET v_day   = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].day_of_week')));
        SET v_from  = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].time_from')));
        SET v_to    = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].time_to')));
        SET v_notes = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].notes')));
        INSERT INTO availability_slots (collaborator_id, day_of_week, time_from, time_to, notes)
        VALUES (p_collaborator_id, v_day, v_from, v_to, v_notes);
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'system', NULL, 'create',
      'collaborators', p_collaborator_id,
      NULL,
      JSON_OBJECT('trajectory_status','nuevo','personal_email', p_personal_email),
      'New collaborator registered via interest form',
      NULL
    );

  COMMIT;
END$$

DELIMITER ;
