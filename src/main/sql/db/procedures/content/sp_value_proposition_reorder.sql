-- sp_value_proposition_reorder
-- Updates sort_order for multiple value_propositions rows from a JSON array of {id, sort_order} pairs.

DROP PROCEDURE IF EXISTS sp_value_proposition_reorder;

DELIMITER $$

CREATE PROCEDURE sp_value_proposition_reorder(
  IN p_order_map JSON,
  IN p_admin_id  INT UNSIGNED
)
BEGIN
  DECLARE v_i     INT DEFAULT 0;
  DECLARE v_count INT DEFAULT JSON_LENGTH(p_order_map);
  DECLARE v_id    INT UNSIGNED;
  DECLARE v_order TINYINT UNSIGNED;

  START TRANSACTION;
    WHILE v_i < v_count DO
      SET v_id    = JSON_EXTRACT(p_order_map, CONCAT('$[',v_i,'].id'));
      SET v_order = JSON_EXTRACT(p_order_map, CONCAT('$[',v_i,'].sort_order'));
      UPDATE value_propositions
      SET sort_order = v_order, updated_at = NOW(), updated_by_admin_id = p_admin_id
      WHERE id = v_id;
      SET v_i = v_i + 1;
    END WHILE;
  COMMIT;
END$$

DELIMITER ;
