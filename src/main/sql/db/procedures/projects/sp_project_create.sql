-- sp_project_create
-- Creates a new project with tags, meeting_days, and managers in one transaction.

DROP PROCEDURE IF EXISTS sp_project_create;

DELIMITER $$

CREATE PROCEDURE sp_project_create(
  IN  p_title               VARCHAR(255),
  IN  p_slug                VARCHAR(255),
  IN  p_short_description   VARCHAR(500),
  IN  p_full_description    TEXT,
  IN  p_target_audience     VARCHAR(300),
  IN  p_required_skills     TEXT,
  IN  p_participation_mode  VARCHAR(200),
  IN  p_header_image_url    VARCHAR(1000),
  IN  p_video_url           VARCHAR(1000),
  IN  p_status              VARCHAR(20),
  IN  p_is_highlighted      BOOLEAN,
  IN  p_is_visible          BOOLEAN,
  IN  p_max_collaborators   SMALLINT UNSIGNED,
  IN  p_created_by_admin_id INT UNSIGNED,
  IN  p_tag_ids             JSON,
  IN  p_meeting_days        JSON,
  IN  p_manager_ids         JSON,
  OUT p_project_id          INT UNSIGNED
)
BEGIN
  DECLARE v_i       INT DEFAULT 0;
  DECLARE v_count   INT DEFAULT 0;

  IF EXISTS (SELECT 1 FROM projects WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45050' SET MESSAGE_TEXT = 'Project slug already exists';
  END IF;

  START TRANSACTION;
    INSERT INTO projects (
      title, slug, short_description, full_description,
      target_audience, required_skills, participation_mode,
      header_image_url, video_url, status,
      is_highlighted, is_visible, max_collaborators,
      current_collaborator_count, created_by_admin_id,
      created_at, updated_at
    ) VALUES (
      p_title, p_slug, p_short_description, p_full_description,
      p_target_audience, p_required_skills, p_participation_mode,
      p_header_image_url, p_video_url, p_status,
      p_is_highlighted, p_is_visible, p_max_collaborators,
      0, p_created_by_admin_id,
      NOW(), NOW()
    );
    SET p_project_id = LAST_INSERT_ID();

    -- Tags
    IF p_tag_ids IS NOT NULL AND JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO project_tags (project_id, tag_id, created_at)
        VALUES (p_project_id,
                JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']')),
                NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Meeting days
    SET v_i = 0;
    IF p_meeting_days IS NOT NULL AND JSON_LENGTH(p_meeting_days) > 0 THEN
      SET v_count = JSON_LENGTH(p_meeting_days);
      WHILE v_i < v_count DO
        INSERT INTO project_meeting_days (project_id, day_of_week, notes)
        VALUES (
          p_project_id,
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].day_of_week'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].notes')))
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Managers
    SET v_i = 0;
    IF p_manager_ids IS NOT NULL AND JSON_LENGTH(p_manager_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_manager_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO project_managers (
          project_id, admin_id, is_primary, assigned_at
        ) VALUES (
          p_project_id,
          JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].admin_id')),
          COALESCE(JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].is_primary')), FALSE),
          NOW()
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'administrator', p_created_by_admin_id, 'create',
      'projects', p_project_id,
      NULL,
      JSON_OBJECT('title', p_title, 'slug', p_slug, 'status', p_status),
      'Project created',
      NULL
    );
  COMMIT;
END$$

DELIMITER ;
