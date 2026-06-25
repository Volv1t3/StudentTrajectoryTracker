-- ============================================================================
-- Procedure: sp_collaborator_sync_availability
-- Description: Replaces all availability_slots for a collaborator
--              (full replacement strategy).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_sync_availability;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_sync_availability(
  IN p_collaborator_id    INT UNSIGNED,
  IN p_availability_slots JSON
)
BEGIN
  DECLARE v_i     INT DEFAULT 0;
  DECLARE v_count INT DEFAULT 0;

  START TRANSACTION;
    DELETE FROM availability_slots WHERE collaborator_id = p_collaborator_id;

    IF p_availability_slots IS NOT NULL AND JSON_LENGTH(p_availability_slots) > 0 THEN
      SET v_count = JSON_LENGTH(p_availability_slots);
      WHILE v_i < v_count DO
        INSERT INTO availability_slots (
          collaborator_id, day_of_week, time_from, time_to, notes
        ) VALUES (
          p_collaborator_id,
          JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[',v_i,'].day_of_week'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[',v_i,'].time_from'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[',v_i,'].time_to'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[',v_i,'].notes')))
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;
  COMMIT;
END$$

DELIMITER ;
