-- sp_event_set_status
-- Sets event status with transition enforcement.

DROP PROCEDURE IF EXISTS sp_event_set_status;

DELIMITER $$

CREATE PROCEDURE sp_event_set_status(
  IN p_event_id   INT UNSIGNED,
  IN p_new_status VARCHAR(20),
  IN p_admin_id   INT UNSIGNED,
  IN p_ip_address VARCHAR(45)
)
BEGIN
  DECLARE v_current VARCHAR(20);
  DECLARE v_allowed TINYINT DEFAULT 0;

  SELECT status INTO v_current FROM events WHERE id = p_event_id FOR UPDATE;

  SET v_allowed = CASE
    WHEN v_current = 'proximo'  AND p_new_status IN ('abierto','cancelado')  THEN 1
    WHEN v_current = 'abierto'  AND p_new_status IN ('en_curso','cancelado') THEN 1
    WHEN v_current = 'en_curso' AND p_new_status = 'finalizado'              THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Invalid event transition: ', v_current,' → ',p_new_status);
  END IF;

  START TRANSACTION;
    UPDATE events SET status = p_new_status, updated_at = NOW()
    WHERE id = p_event_id;

    CALL sp_audit_write(
      'administrator', p_admin_id, 'status_change',
      'events', p_event_id,
      JSON_OBJECT('status', v_current),
      JSON_OBJECT('status', p_new_status),
      CONCAT('Event status → ', p_new_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
