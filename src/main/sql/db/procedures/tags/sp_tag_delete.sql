-- sp_tag_delete
-- Deletes a tag and removes all junction references. System tags cannot be deleted.

DROP PROCEDURE IF EXISTS sp_tag_delete;

DELIMITER $$

CREATE PROCEDURE sp_tag_delete(IN p_tag_id INT UNSIGNED, IN p_admin_id INT UNSIGNED)
BEGIN
  DECLARE v_is_system BOOLEAN;

  SELECT is_system INTO v_is_system FROM tags WHERE id = p_tag_id;

  IF v_is_system = TRUE THEN
    SIGNAL SQLSTATE '45071' SET MESSAGE_TEXT = 'Cannot delete system-defined tags';
  END IF;

  START TRANSACTION;
    DELETE FROM collaborator_tags WHERE tag_id = p_tag_id;
    DELETE FROM project_tags       WHERE tag_id = p_tag_id;
    DELETE FROM event_tags         WHERE tag_id = p_tag_id;
    DELETE FROM tags               WHERE id     = p_tag_id;

    CALL sp_audit_write(
      'administrator', p_admin_id, 'delete',
      'tags', p_tag_id,
      NULL, NULL, 'Tag deleted and de-referenced', NULL
    );
  COMMIT;
END$$

DELIMITER ;
