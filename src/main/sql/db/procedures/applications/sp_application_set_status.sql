-- ============================================================================
-- Procedure: sp_application_set_status
-- Description: Moves an application to en_revision, rechazada, or retirada
--              with transition validation. Does NOT handle approval.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_application_set_status;

DELIMITER $$

CREATE PROCEDURE sp_application_set_status(
  IN p_application_id INT UNSIGNED,
  IN p_new_status     VARCHAR(20),
  IN p_admin_notes    TEXT,
  IN p_actor_id       INT UNSIGNED,
  IN p_ip_address     VARCHAR(45)
)
BEGIN
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_allowed        TINYINT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT status INTO v_current_status
  FROM applications WHERE id = p_application_id FOR UPDATE;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45002'
      SET MESSAGE_TEXT = 'Application not found';
  END IF;

  SET v_allowed = CASE
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'Pendiente'   AND p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Revisión','Rechazada','Retirada') THEN 1
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'En_Revisión' AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Rechazada','Retirada')               THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SET @error_msg = CONCAT('Invalid application transition: ',
                            v_current_status, ' → ', p_new_status);
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = @error_msg;
  END IF;

  IF p_new_status COLLATE utf8mb4_unicode_ci = 'Rechazada'
     AND (p_admin_notes IS NULL OR CHAR_LENGTH(TRIM(p_admin_notes)) = 0) THEN
    SIGNAL SQLSTATE '45001'
      SET MESSAGE_TEXT = 'Rejection reason is required';
  END IF;

  START TRANSACTION;
    UPDATE applications SET
      status       = p_new_status,
      admin_notes  = COALESCE(p_admin_notes, admin_notes),
      reviewed_at  = IF(
        p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Revisión', 'Rechazada'),
        COALESCE(reviewed_at, NOW()),
        reviewed_at
      ),
      rejected_at  = IF(p_new_status COLLATE utf8mb4_unicode_ci = 'Rechazada', NOW(), rejected_at),
      approver_admin_id = IF(p_new_status COLLATE utf8mb4_unicode_ci = 'Rechazada', p_actor_id, approver_admin_id)
    WHERE id = p_application_id;

    CALL sp_audit_write(
      'Administrador', p_actor_id,
      IF(p_new_status COLLATE utf8mb4_unicode_ci = 'Rechazada', 'Rechazar', 'Cambio_De_Estado'),
      'applications', p_application_id,
      JSON_OBJECT('status', v_current_status),
      JSON_OBJECT('status', p_new_status),
      CONCAT('Application status → ', p_new_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
