-- ============================================================================
-- Procedure: sp_collaborator_sync_tags
-- Description: Replaces all collaborator_tags for a collaborator with the
--              provided set of tag IDs (full replacement strategy).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_sync_tags;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_sync_tags(
  IN p_collaborator_id INT UNSIGNED,
  IN p_tag_ids         JSON
)
BEGIN
  DECLARE v_i       INT DEFAULT 0;
  DECLARE v_count   INT DEFAULT 0;
  DECLARE v_tag_id  INT UNSIGNED;

  START TRANSACTION;
    DELETE FROM collaborator_tags WHERE collaborator_id = p_collaborator_id;

    IF JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        SET v_tag_id = JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']'));
        INSERT IGNORE INTO collaborator_tags (collaborator_id, tag_id, created_at)
        VALUES (p_collaborator_id, v_tag_id, NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;
  COMMIT;
END$$

DELIMITER ;
