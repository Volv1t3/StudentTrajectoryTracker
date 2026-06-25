-- sp_media_delete
-- Deletes a media_assets record. Rejects deletion if the media URL is still referenced by any content entity.

DROP PROCEDURE IF EXISTS sp_media_delete;

DELIMITER $$

CREATE PROCEDURE sp_media_delete(IN p_media_id INT UNSIGNED, IN p_admin_id INT UNSIGNED)
BEGIN
  DECLARE v_public_url  VARCHAR(1000);
  DECLARE v_in_use      INT DEFAULT 0;

  SELECT public_url INTO v_public_url FROM media_assets WHERE id = p_media_id;

  -- Check usage across content entities
  SELECT (
    (SELECT COUNT(*) FROM projects WHERE header_image_url = v_public_url) +
    (SELECT COUNT(*) FROM events   WHERE header_image_url = v_public_url
                                      OR banner_image_url = v_public_url) +
    (SELECT COUNT(*) FROM home_hero WHERE background_image_url = v_public_url) +
    (SELECT COUNT(*) FROM dlab_identity WHERE image_url = v_public_url) +
    (SELECT COUNT(*) FROM value_propositions WHERE image_url = v_public_url)
  ) INTO v_in_use;

  IF v_in_use > 0 THEN
    SIGNAL SQLSTATE '45080'
      SET MESSAGE_TEXT = 'Media asset is still referenced by content entities';
  END IF;

  START TRANSACTION;
    DELETE FROM media_assets WHERE id = p_media_id;
    CALL sp_audit_write(
      'administrator', p_admin_id, 'delete',
      'media_assets', p_media_id,
      JSON_OBJECT('public_url', v_public_url),
      NULL, 'Media asset deleted', NULL
    );
  COMMIT;
END$$

DELIMITER ;
