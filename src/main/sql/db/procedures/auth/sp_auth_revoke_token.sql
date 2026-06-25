-- ============================================================================
-- Procedure: sp_auth_revoke_token
-- Description: Revokes a single refresh token by its hash. Used on logout and
--              token rotation. Does not error if token not found (idempotent).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_revoke_token;

DELIMITER $$

CREATE PROCEDURE sp_auth_revoke_token(IN p_token_hash VARCHAR(255))
BEGIN
  UPDATE refresh_tokens
  SET    is_revoked = TRUE
  WHERE  token_hash = p_token_hash;
END$$

DELIMITER ;
