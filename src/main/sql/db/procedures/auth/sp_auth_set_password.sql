-- ============================================================================
-- Procedure: sp_auth_set_password
-- Description: Sets or updates the password_hash for a collaborator. Used during
--              account activation and password reset flows. Does NOT validate the
--              old password — that must be done in the service layer first.
--              Revokes all existing refresh tokens on completion (force re-login).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_set_password;

DELIMITER $$

CREATE PROCEDURE sp_auth_set_password(
  IN p_collaborator_id INT UNSIGNED,
  IN p_password_hash   VARCHAR(255),
  IN p_ip_address      VARCHAR(45)
)
BEGIN
  START TRANSACTION;
    UPDATE collaborators
    SET    password_hash = p_password_hash,
           updated_at    = NOW()
    WHERE  id            = p_collaborator_id;

    CALL sp_auth_revoke_all_user_tokens('Colaborador', p_collaborator_id);

    CALL sp_audit_write(
      'system', NULL, 'update',
      'collaborators', p_collaborator_id,
      NULL, JSON_OBJECT('password_hash', 'REDACTED'),
      'Password set / changed',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
