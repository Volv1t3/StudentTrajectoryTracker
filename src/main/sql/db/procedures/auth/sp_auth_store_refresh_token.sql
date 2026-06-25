-- ============================================================================
-- Procedure: sp_auth_store_refresh_token
-- Description: Inserts a new refresh token record. Called after any successful
--              login or token rotation. Old tokens for the same user+device
--              should be revoked by the service layer before calling this.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_store_refresh_token;

DELIMITER $$

CREATE PROCEDURE sp_auth_store_refresh_token(
  IN  p_user_type   ENUM('administrator','collaborator'),
  IN  p_user_id     INT UNSIGNED,
  IN  p_token_hash  VARCHAR(255),
  IN  p_expires_at  TIMESTAMP,
  IN  p_user_agent  VARCHAR(512),
  IN  p_ip_address  VARCHAR(45),
  OUT p_token_id    INT UNSIGNED
)
BEGIN
  INSERT INTO refresh_tokens (
    user_type, user_id, token_hash,
    expires_at, is_revoked, issued_at,
    user_agent, ip_address
  ) VALUES (
    p_user_type, p_user_id, p_token_hash,
    p_expires_at, FALSE, NOW(),
    p_user_agent, p_ip_address
  );
  SET p_token_id = LAST_INSERT_ID();
END$$

DELIMITER ;
