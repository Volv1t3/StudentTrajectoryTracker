-- sp_event_create
-- Creates a new event with tags and managers in one transaction.

DROP PROCEDURE IF EXISTS sp_event_create;

DELIMITER $$

CREATE PROCEDURE sp_event_create(
  IN  p_title                 VARCHAR(255),
  IN  p_slug                  VARCHAR(255),
  IN  p_type                  VARCHAR(30),
  IN  p_short_description     VARCHAR(500),
  IN  p_full_description      TEXT,
  IN  p_target_audience       VARCHAR(300),
  IN  p_location              VARCHAR(300),
  IN  p_event_date            DATETIME,
  IN  p_event_end_date        DATETIME,
  IN  p_registration_deadline DATETIME,
  IN  p_capacity              SMALLINT UNSIGNED,
  IN  p_header_image_url      VARCHAR(1000),
  IN  p_banner_image_url      VARCHAR(1000),
  IN  p_registration_url      VARCHAR(1000),
  IN  p_status                VARCHAR(20),
  IN  p_is_highlighted        BOOLEAN,
  IN  p_is_visible            BOOLEAN,
  IN  p_created_by_admin_id   INT UNSIGNED,
  IN  p_tag_ids               JSON,
  IN  p_manager_ids           JSON,
  OUT p_event_id              INT UNSIGNED
)
BEGIN
  DECLARE v_i INT DEFAULT 0; DECLARE v_count INT DEFAULT 0;

  IF EXISTS (SELECT 1 FROM events WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45060' SET MESSAGE_TEXT = 'Event slug already exists';
  END IF;

  START TRANSACTION;
    INSERT INTO events (
      title, slug, type, short_description, full_description,
      target_audience, location, event_date, event_end_date,
      registration_deadline, capacity,
      header_image_url, banner_image_url, registration_url,
      status, is_highlighted, is_visible,
      created_by_admin_id, created_at, updated_at
    ) VALUES (
      p_title, p_slug, p_type, p_short_description, p_full_description,
      p_target_audience, p_location, p_event_date, p_event_end_date,
      p_registration_deadline, p_capacity,
      p_header_image_url, p_banner_image_url, p_registration_url,
      p_status, p_is_highlighted, p_is_visible,
      p_created_by_admin_id, NOW(), NOW()
    );
    SET p_event_id = LAST_INSERT_ID();

    -- Tags
    IF p_tag_ids IS NOT NULL AND JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO event_tags (event_id, tag_id, created_at)
        VALUES (p_event_id,
                JSON_EXTRACT(p_tag_ids, CONCAT('$[',v_i,']')),
                NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Managers
    SET v_i = 0;
    IF p_manager_ids IS NOT NULL AND JSON_LENGTH(p_manager_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_manager_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO event_managers (event_id, admin_id, is_primary, assigned_at)
        VALUES (
          p_event_id,
          JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].admin_id')),
          COALESCE(JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].is_primary')), FALSE),
          NOW()
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'administrator', p_created_by_admin_id, 'create',
      'events', p_event_id, NULL,
      JSON_OBJECT('title', p_title, 'slug', p_slug, 'status', p_status),
      'Event created', NULL
    );
  COMMIT;
END$$

DELIMITER ;
