-- sp_content_upsert_home_hero
-- Deactivates all existing home_hero rows, then inserts or updates the given row. Only one hero is active at a time.

DROP PROCEDURE IF EXISTS sp_content_upsert_home_hero;

DELIMITER $$

CREATE PROCEDURE sp_content_upsert_home_hero(
  IN p_id                   INT UNSIGNED,
  IN p_headline             VARCHAR(255),
  IN p_subheadline          VARCHAR(500),
  IN p_primary_cta_label    VARCHAR(100),
  IN p_primary_cta_url      VARCHAR(500),
  IN p_secondary_cta_label  VARCHAR(100),
  IN p_secondary_cta_url    VARCHAR(500),
  IN p_background_image_url VARCHAR(1000),
  IN p_admin_id             INT UNSIGNED
)
BEGIN
  START TRANSACTION;
    UPDATE home_hero SET is_active = FALSE;

    IF p_id IS NULL THEN
      INSERT INTO home_hero (
        headline, subheadline,
        primary_cta_label, primary_cta_url,
        secondary_cta_label, secondary_cta_url,
        background_image_url, is_active,
        updated_by_admin_id, updated_at
      ) VALUES (
        p_headline, p_subheadline,
        p_primary_cta_label, p_primary_cta_url,
        p_secondary_cta_label, p_secondary_cta_url,
        p_background_image_url, TRUE,
        p_admin_id, NOW()
      );
    ELSE
      UPDATE home_hero SET
        headline             = p_headline,
        subheadline          = p_subheadline,
        primary_cta_label    = p_primary_cta_label,
        primary_cta_url      = p_primary_cta_url,
        secondary_cta_label  = p_secondary_cta_label,
        secondary_cta_url    = p_secondary_cta_url,
        background_image_url = p_background_image_url,
        is_active            = TRUE,
        updated_by_admin_id  = p_admin_id,
        updated_at           = NOW()
      WHERE id = p_id;
    END IF;

    CALL sp_audit_write(
      'administrator', p_admin_id, 'update',
      'home_hero', COALESCE(p_id, LAST_INSERT_ID()),
      NULL, NULL, 'Home hero content updated', NULL
    );
  COMMIT;
END$$

DELIMITER ;
