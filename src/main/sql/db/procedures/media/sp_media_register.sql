-- sp_media_register
-- Inserts a media_assets record after file upload to Docker volume.

DROP PROCEDURE IF EXISTS sp_media_register;

DELIMITER $$

CREATE PROCEDURE sp_media_register(
  IN  p_original_filename    VARCHAR(500),
  IN  p_stored_filename      VARCHAR(500),
  IN  p_public_url           VARCHAR(1000),
  IN  p_storage_type         VARCHAR(10),
  IN  p_storage_path         VARCHAR(1000),
  IN  p_mime_type            VARCHAR(100),
  IN  p_file_size_bytes      INT UNSIGNED,
  IN  p_entity_type          VARCHAR(100),
  IN  p_entity_id            INT UNSIGNED,
  IN  p_alt_text             VARCHAR(300),
  IN  p_caption              VARCHAR(500),
  IN  p_uploaded_by_admin_id INT UNSIGNED,
  OUT p_media_id             INT UNSIGNED
)
BEGIN
  INSERT INTO media_assets (
    original_filename, stored_filename, public_url,
    storage_type, storage_path, mime_type, file_size_bytes,
    entity_type, entity_id, alt_text, caption,
    uploaded_by_admin_id, created_at
  ) VALUES (
    p_original_filename, p_stored_filename, p_public_url,
    p_storage_type, p_storage_path, p_mime_type, p_file_size_bytes,
    p_entity_type, p_entity_id, p_alt_text, p_caption,
    p_uploaded_by_admin_id, NOW()
  );
  SET p_media_id = LAST_INSERT_ID();
END$$

DELIMITER ;
