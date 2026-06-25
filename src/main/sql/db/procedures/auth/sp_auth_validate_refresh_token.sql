-- ============================================================================
-- Procedure: sp_auth_validate_refresh_token
-- Description: Validates a refresh token by hash. Returns the token record only
--              if it exists, is not revoked, and has not expired. Returns empty
--              result set if invalid — the service layer must treat empty 
--              result as 401.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_validate_refresh_token;

DELIMITER $$

CREATE PROCEDURE sp_auth_validate_refresh_token(IN p_token_hash VARCHAR(255))
BEGIN
  SELECT id, user_type, user_id, expires_at, issued_at
  FROM   refresh_tokens
  WHERE  token_hash = p_token_hash
    AND  is_revoked  = FALSE
    AND  expires_at  > NOW();
END$$

DELIMITER ;
