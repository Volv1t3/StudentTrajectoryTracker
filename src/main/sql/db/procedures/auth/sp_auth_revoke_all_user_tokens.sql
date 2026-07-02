-- ============================================================================
-- Procedure: sp_auth_revoke_all_user_tokens
-- Description: Revokes ALL active refresh tokens for a given user.
--              Used on password change and admin deactivation.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_revoke_all_user_tokens;

DELIMITER $$

CREATE PROCEDURE sp_auth_revoke_all_user_tokens(
  IN p_user_type ENUM('Administrador','Colaborador'),
  IN p_user_id   INT UNSIGNED
)
BEGIN
  UPDATE refresh_tokens
  SET    is_revoked = TRUE
  WHERE  user_type  = p_user_type
    AND  user_id    = p_user_id
    AND  is_revoked = FALSE;
END$$

DELIMITER ;
