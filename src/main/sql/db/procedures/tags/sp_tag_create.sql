-- sp_tag_create
-- Creates a new tag. System tags (is_system=TRUE) can only be created at seed time.

DROP PROCEDURE IF EXISTS sp_tag_create;

DELIMITER $$

CREATE PROCEDURE sp_tag_create(
  IN  p_name               VARCHAR(100),
  IN  p_slug               VARCHAR(100),
  IN  p_category           VARCHAR(30),
  IN  p_created_by_admin_id INT UNSIGNED,
  OUT p_tag_id             INT UNSIGNED
)
BEGIN
  IF EXISTS (SELECT 1 FROM tags WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45070' SET MESSAGE_TEXT = 'Tag slug already exists';
  END IF;

  INSERT INTO tags (name, slug, category, is_system, created_by_admin_id, created_at)
  VALUES (p_name, p_slug, p_category, FALSE, p_created_by_admin_id, NOW());

  SET p_tag_id = LAST_INSERT_ID();
END$$

DELIMITER ;
