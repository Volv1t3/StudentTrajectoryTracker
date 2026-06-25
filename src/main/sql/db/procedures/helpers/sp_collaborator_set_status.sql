-- ============================================================================
-- Procedure: sp_collaborator_set_status
-- Description: Updates trajectory_status on a collaborator row, enforcing the
--              allowed transition machine. Writes an audit entry automatically.
--              Called internally by other procedures — never directly by the API.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_set_status;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_set_status(
  IN p_collaborator_id INT UNSIGNED,
  IN p_new_status      VARCHAR(20),
  IN p_actor_id        INT UNSIGNED,
  IN p_ip_address      VARCHAR(45)
)
BEGIN
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_allowed        TINYINT DEFAULT 0;

  SELECT trajectory_status INTO v_current_status
  FROM collaborators
  WHERE id = p_collaborator_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Collaborator not found';
  END IF;

  -- Validate transition
  SET v_allowed = CASE
    WHEN v_current_status = 'nuevo'       AND p_new_status IN ('en_revision','inactivo')  THEN 1
    WHEN v_current_status = 'en_revision' AND p_new_status IN ('contactado','inactivo')   THEN 1
    WHEN v_current_status = 'contactado'  AND p_new_status IN ('vinculado','inactivo')    THEN 1
    WHEN v_current_status = 'vinculado'   AND p_new_status IN ('inactivo')                THEN 1
    WHEN v_current_status = 'inactivo'    AND p_new_status IN ('en_revision')             THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Invalid transition: ', v_current_status, ' → ', p_new_status);
  END IF;

  UPDATE collaborators
  SET trajectory_status = p_new_status,
      updated_at        = NOW()
  WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    'administrator', p_actor_id, 'status_change',
    'collaborators', p_collaborator_id,
    JSON_OBJECT('trajectory_status', v_current_status),
    JSON_OBJECT('trajectory_status', p_new_status),
    CONCAT('Status changed: ', v_current_status, ' → ', p_new_status),
    p_ip_address
  );
END$$

DELIMITER ;
