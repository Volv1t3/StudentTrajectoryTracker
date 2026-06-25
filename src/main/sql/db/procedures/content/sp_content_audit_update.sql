-- sp_content_audit_update
-- Audit-only procedure called after Drizzle ORM update for generic content entities.

DROP PROCEDURE IF EXISTS sp_content_audit_update;

DELIMITER $$

CREATE PROCEDURE sp_content_audit_update(
  IN p_table_name VARCHAR(100),
  IN p_entity_id  INT UNSIGNED,
  IN p_admin_id   INT UNSIGNED
)
BEGIN
  CALL sp_audit_write(
    'administrator', p_admin_id, 'update',
    p_table_name, p_entity_id,
    NULL, NULL,
    CONCAT(p_table_name, ' content updated by admin ', p_admin_id),
    NULL
  );
END$$

DELIMITER ;
