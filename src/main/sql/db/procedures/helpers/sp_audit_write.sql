-- ============================================================================
-- Procedure: sp_audit_write
-- Description: Inserts a single row into audit_log. Called by all other 
--              procedures that modify data. Never called directly by the 
--              application layer.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_audit_write;

DELIMITER $$

CREATE PROCEDURE sp_audit_write(
  IN p_actor_type   ENUM('administrator','system'),
  IN p_actor_id     INT UNSIGNED,
  IN p_action       VARCHAR(50),
  IN p_entity_type  VARCHAR(100),
  IN p_entity_id    INT UNSIGNED,
  IN p_prev_value   JSON,
  IN p_new_value    JSON,
  IN p_description  VARCHAR(500),
  IN p_ip_address   VARCHAR(45)
)
BEGIN
  INSERT INTO audit_log (
    actor_type, actor_id, action,
    entity_type, entity_id,
    previous_value, new_value,
    description, ip_address, created_at
  ) VALUES (
    p_actor_type, p_actor_id, p_action,
    p_entity_type, p_entity_id,
    p_prev_value, p_new_value,
    p_description, p_ip_address, NOW()
  );
END$$

DELIMITER ;
