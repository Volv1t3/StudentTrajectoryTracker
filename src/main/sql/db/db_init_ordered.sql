-- =============================================================================
-- DLAB — Plataforma de Gestión de la Trayectoria Estudiantil
-- Database Schema — MySQL 9
-- Source of truth: docs/db/pmi-db-entity-analysis.md v1.0
-- Generated: 2026-06-10
-- =============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- CORE USER ENTITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS administrators (
  id                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  first_name          VARCHAR(100)     NOT NULL,
  middle_name         VARCHAR(100)     NULL,
  last_name           VARCHAR(100)     NOT NULL,
  second_last_name    VARCHAR(100)     NULL,
  personal_email      VARCHAR(255)     NOT NULL,
  usfq_email          VARCHAR(255)     NOT NULL,
  phone_number        VARCHAR(20)      NULL,
  date_of_birth       DATE             NULL,
  password_hash       VARCHAR(255)     NOT NULL,
  is_active           BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_administrators_personal_email (personal_email),
  UNIQUE KEY uq_administrators_usfq_email    (usfq_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS collaborators (
  id                          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  first_name                  VARCHAR(100)     NOT NULL,
  middle_name                 VARCHAR(100)     NULL,
  last_name                   VARCHAR(100)     NOT NULL,
  second_last_name            VARCHAR(100)     NULL,
  personal_email              VARCHAR(255)     NOT NULL,
  usfq_email                  VARCHAR(255)     NULL,
  phone_number                VARCHAR(20)      NULL,
  date_of_birth               DATE             NULL,
  password_hash               VARCHAR(255)     NULL,
  major                       VARCHAR(150)     NOT NULL,
  current_university_year     TINYINT UNSIGNED NOT NULL,
  expected_graduation_year    YEAR             NOT NULL,
  experience_description      TEXT             NULL,
  motivation_description      TEXT             NULL,
  interest_in_machinery       BOOLEAN          NOT NULL DEFAULT FALSE,
  interest_in_design          BOOLEAN          NOT NULL DEFAULT FALSE,
  interest_in_materials       BOOLEAN          NOT NULL DEFAULT FALSE,
  trajectory_status           ENUM(
                                'Nuevo',
                                'En_Revisión',
                                'Contactado',
                                'Vinculado',
                                'Inactivo'
                              )                NOT NULL DEFAULT 'Nuevo',
  is_active                   BOOLEAN          NOT NULL DEFAULT TRUE,
  profile_complete            BOOLEAN          NOT NULL DEFAULT FALSE,
  intake_source               VARCHAR(100)     NULL,
  created_at                  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collaborators_personal_email (personal_email),
  UNIQUE KEY uq_collaborators_usfq_email     (usfq_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- AUTHENTICATION & SECURITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED                        NOT NULL AUTO_INCREMENT,
  user_type   ENUM('Administrador', 'Colaborador') NOT NULL,
  user_id     INT UNSIGNED                        NOT NULL,
  token_hash  VARCHAR(255)                        NOT NULL,
  expires_at  TIMESTAMP                           NOT NULL,
  is_revoked  BOOLEAN                             NOT NULL DEFAULT FALSE,
  issued_at   TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_agent  VARCHAR(512)                        NULL,
  ip_address  VARCHAR(45)                         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  INDEX idx_refresh_tokens_user (user_type, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- OPERATIONAL DOMAIN
-- =============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name                 VARCHAR(100)  NOT NULL,
  slug                 VARCHAR(100)  NOT NULL,
  category             ENUM(
                         'Materiales',
                         'Maquinaria',
                         'Diseño',
                         'Software',
                         'Investigación',
                         'General'
                       )             NOT NULL DEFAULT 'General',
  is_system            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_by_admin_id  INT UNSIGNED  NULL,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name),
  UNIQUE KEY uq_tags_slug (slug),
  CONSTRAINT fk_tags_admin FOREIGN KEY (created_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS projects (
  id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title                       VARCHAR(255)    NOT NULL,
  slug                        VARCHAR(255)    NOT NULL,
  short_description           VARCHAR(500)    NOT NULL,
  full_description            TEXT            NOT NULL,
  target_audience             VARCHAR(300)    NULL,
  required_skills             TEXT            NULL,
  participation_mode          ENUM('Presencial','Remoto','Híbrido') NULL,
  header_image_media_asset_id INT UNSIGNED    NULL,
  video_media_asset_id        INT UNSIGNED    NULL,
  status                      ENUM(
                                'Activo',
                                'En_Pausa',
                                'Completado',
                                'Archivado',
                                'Próximo'
                              )               NOT NULL DEFAULT 'Activo',
  is_highlighted              BOOLEAN         NOT NULL DEFAULT FALSE,
  is_visible                  BOOLEAN         NOT NULL DEFAULT TRUE,
  max_collaborators           SMALLINT UNSIGNED NULL,
  current_collaborator_count  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_by_admin_id         INT UNSIGNED    NOT NULL,
  created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slug (slug),
  CONSTRAINT fk_projects_admin FOREIGN KEY (created_by_admin_id)
    REFERENCES administrators (id),
  CONSTRAINT fk_projects_header_media FOREIGN KEY (header_image_media_asset_id)
    REFERENCES media_assets (id) ON DELETE SET NULL,
  CONSTRAINT fk_projects_video_media FOREIGN KEY (video_media_asset_id)
    REFERENCES media_assets (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS project_meeting_days (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED  NOT NULL,
  day_of_week ENUM(
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo'
              )             NOT NULL,
  start_time  TIME          NOT NULL,
  end_time    TIME          NOT NULL,
  notes       VARCHAR(300)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_pmd_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS events (
  id                    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  title                 VARCHAR(255)   NOT NULL,
  slug                  VARCHAR(255)   NOT NULL,
  type                  ENUM(
                          'Taller',
                          'Charla',
                          'Convocatoria',
                          'Hackatón',
                          'Día_De_Demostración',
                          'Visita',
                          'Otro'
                        )              NOT NULL,
  short_description     VARCHAR(500)   NOT NULL,
  full_description      TEXT           NOT NULL,
  target_audience       VARCHAR(300)   NULL,
  location              VARCHAR(300)   NULL,
  event_date            DATETIME       NULL,
  event_end_date        DATETIME       NULL,
  registration_deadline DATETIME       NULL,
  capacity              SMALLINT UNSIGNED NULL,
  banner_media_asset_id INT UNSIGNED   NULL,
  video_media_asset_id  INT UNSIGNED   NULL,
  poster_media_asset_id INT UNSIGNED   NULL,
  registration_url      VARCHAR(1000)  NULL,
  status                ENUM(
                          'Próximo',
                          'Abierto',
                          'En_Curso',
                          'Finalizado',
                          'Cancelado'
                        )              NOT NULL DEFAULT 'Próximo',
  is_highlighted        BOOLEAN        NOT NULL DEFAULT FALSE,
  is_visible            BOOLEAN        NOT NULL DEFAULT TRUE,
  created_by_admin_id   INT UNSIGNED   NOT NULL,
  created_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_slug (slug),
  CONSTRAINT fk_events_admin FOREIGN KEY (created_by_admin_id)
    REFERENCES administrators (id),
  CONSTRAINT fk_events_banner_media FOREIGN KEY (banner_media_asset_id)
    REFERENCES media_assets (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_video_media FOREIGN KEY (video_media_asset_id)
    REFERENCES media_assets (id) ON DELETE SET NULL,
  CONSTRAINT fk_events_poster_media FOREIGN KEY (poster_media_asset_id)
    REFERENCES media_assets (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS availability_slots (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  collaborator_id  INT UNSIGNED  NOT NULL,
  day_of_week      ENUM(
                     'Lunes',
                     'Martes',
                     'Miércoles',
                     'Jueves',
                     'Viernes',
                     'Sábado',
                     'Domingo'
                   )             NOT NULL,
  time_from        TIME          NOT NULL,
  time_to          TIME          NOT NULL,
  notes            VARCHAR(200)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_avail_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- RELATIONSHIP / JUNCTION ENTITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  collaborator_id     INT UNSIGNED  NOT NULL,
  project_id          INT UNSIGNED  NOT NULL,
  reason_for_applying TEXT          NOT NULL,
  status              ENUM(
                        'Pendiente',
                        'En_Revisión',
                        'Aprobada',
                        'Rechazada',
                        'Retirada'
                      )             NOT NULL DEFAULT 'Pendiente',
  applied_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at         TIMESTAMP     NULL,
  approved_at         TIMESTAMP     NULL,
  rejected_at         TIMESTAMP     NULL,
  approver_admin_id   INT UNSIGNED  NULL,
  admin_notes         TEXT          NULL,
  PRIMARY KEY (id),
  KEY idx_applications_collab_project (collaborator_id, project_id),
  CONSTRAINT fk_applications_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id),
  CONSTRAINT fk_applications_project FOREIGN KEY (project_id)
    REFERENCES projects (id),
  CONSTRAINT fk_applications_admin FOREIGN KEY (approver_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS assignments (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  collaborator_id       INT UNSIGNED  NOT NULL,
  project_id            INT UNSIGNED  NOT NULL,
  application_id        INT UNSIGNED  NULL,
  assigned_by_admin_id  INT UNSIGNED  NOT NULL,
  role_in_project       VARCHAR(150)  NULL,
  assigned_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at              TIMESTAMP     NULL,
  end_reason            VARCHAR(300)  NULL,
  status                ENUM(
                          'Activo',
                          'Pausado',
                          'Finalizado',
                          'Removido'
                        )             NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (id),
  KEY idx_assignments_collab_project (collaborator_id, project_id),
  CONSTRAINT fk_assignments_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id),
  CONSTRAINT fk_assignments_project FOREIGN KEY (project_id)
    REFERENCES projects (id),
  CONSTRAINT fk_assignments_application FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE SET NULL,
  CONSTRAINT fk_assignments_admin FOREIGN KEY (assigned_by_admin_id)
    REFERENCES administrators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS project_managers (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED  NOT NULL,
  admin_id    INT UNSIGNED  NOT NULL,
  is_primary  BOOLEAN       NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_managers (project_id, admin_id),
  CONSTRAINT fk_pm_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_admin FOREIGN KEY (admin_id)
    REFERENCES administrators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS event_managers (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  event_id    INT UNSIGNED  NOT NULL,
  admin_id    INT UNSIGNED  NOT NULL,
  is_primary  BOOLEAN       NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_managers (event_id, admin_id),
  CONSTRAINT fk_em_event FOREIGN KEY (event_id)
    REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_em_admin FOREIGN KEY (admin_id)
    REFERENCES administrators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS collaborator_tags (
  collaborator_id  INT UNSIGNED  NOT NULL,
  tag_id           INT UNSIGNED  NOT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collaborator_id, tag_id),
  CONSTRAINT fk_ct_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS project_tags (
  project_id  INT UNSIGNED  NOT NULL,
  tag_id      INT UNSIGNED  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, tag_id),
  CONSTRAINT fk_ptag_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_ptag_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS project_required_skills (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  project_id          INT UNSIGNED  NOT NULL,
  name                VARCHAR(100)  NOT NULL,
  slug                VARCHAR(100)  NOT NULL,
  created_by_admin_id INT UNSIGNED  NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_required_skills (project_id, slug),
  UNIQUE KEY uq_project_required_skills_id (project_id, id),
  CONSTRAINT fk_prs_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_prs_admin FOREIGN KEY (created_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS event_tags (
  event_id    INT UNSIGNED  NOT NULL,
  tag_id      INT UNSIGNED  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, tag_id),
  CONSTRAINT fk_etag_event FOREIGN KEY (event_id)
    REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_etag_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- CONTENT MANAGEMENT ENTITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS home_hero (
  id                    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  headline              VARCHAR(255)   NOT NULL,
  subheadline           VARCHAR(500)   NULL,
  primary_cta_label     VARCHAR(100)   NOT NULL,
  primary_cta_url       VARCHAR(500)   NOT NULL,
  secondary_cta_label   VARCHAR(100)   NULL,
  secondary_cta_url     VARCHAR(500)   NULL,
  background_image_url  VARCHAR(1000)  NULL,
  is_active             BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_by_admin_id   INT UNSIGNED   NULL,
  updated_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_hero_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS dlab_identity (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  title                VARCHAR(255)   NOT NULL,
  body                 TEXT           NOT NULL,
  mission_title        VARCHAR(255)   NULL,
  mission_body         TEXT           NULL,
  vision_title         VARCHAR(255)   NULL,
  vision_body          TEXT           NULL,
  image_url            VARCHAR(1000)  NULL,
  video_url            VARCHAR(1000)  NULL,
  is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_by_admin_id  INT UNSIGNED   NULL,
  updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_dlab_identity_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS value_propositions (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  title                VARCHAR(200)   NOT NULL,
  description          TEXT           NOT NULL,
  icon_identifier      VARCHAR(100)   NULL,
  image_url            VARCHAR(1000)  NULL,
  target_audience      VARCHAR(200)   NULL,
  sort_order           TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_visible           BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_by_admin_id  INT UNSIGNED   NULL,
  updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_vp_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS participation_steps (
  id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  step_number          TINYINT UNSIGNED NOT NULL,
  title                VARCHAR(200)     NOT NULL,
  description          TEXT             NOT NULL,
  icon_identifier      VARCHAR(100)     NULL,
  is_visible           BOOLEAN          NOT NULL DEFAULT TRUE,
  updated_by_admin_id  INT UNSIGNED     NULL,
  updated_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ps_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS contact_info (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  first_name           VARCHAR(100)   NOT NULL,
  middle_name          VARCHAR(100)   NULL,
  last_name            VARCHAR(100)   NOT NULL,
  title_description    VARCHAR(255)   NULL,
  contact_email        VARCHAR(255)   NULL,
  contact_phone        VARCHAR(30)    NULL,
  physical_location    VARCHAR(300)   NULL,
  maps_url             VARCHAR(1000)  NULL,
  cta_headline         VARCHAR(255)   NULL,
  cta_description      TEXT           NULL,
  is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_by_admin_id  INT UNSIGNED   NULL,
  updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_contact_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS social_links (
  id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  platform             VARCHAR(100)     NOT NULL,
  url                  VARCHAR(1000)    NOT NULL,
  icon_identifier      VARCHAR(100)     NULL,
  sort_order           TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_visible           BOOLEAN          NOT NULL DEFAULT TRUE,
  updated_by_admin_id  INT UNSIGNED     NULL,
  updated_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_social_admin FOREIGN KEY (updated_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- MEDIA & ASSETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS media_assets (
  id                    INT UNSIGNED                  NOT NULL AUTO_INCREMENT,
  original_filename     VARCHAR(500)                  NOT NULL,
  stored_filename       VARCHAR(500)                  NOT NULL,
  public_url            VARCHAR(1000)                 NOT NULL,
  storage_type          ENUM('Local', 'Nube')        NOT NULL DEFAULT 'Local',
  storage_path          VARCHAR(1000)                 NULL,
  mime_type             VARCHAR(100)                  NOT NULL,
  file_size_bytes       INT UNSIGNED                  NULL,
  entity_type           VARCHAR(100)                  NULL,
  entity_id             INT UNSIGNED                  NULL,
  alt_text              VARCHAR(300)                  NULL,
  caption               VARCHAR(500)                  NULL,
  uploaded_by_admin_id  INT UNSIGNED                  NULL,
  created_at            TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_media_entity (entity_type, entity_id),
  CONSTRAINT fk_media_admin FOREIGN KEY (uploaded_by_admin_id)
    REFERENCES administrators (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- AUDIT & SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGINT UNSIGNED                        NOT NULL AUTO_INCREMENT,
  actor_type      ENUM('Administrador', 'Sistema')        NOT NULL,
  actor_id        INT UNSIGNED                           NULL,
  action          ENUM(
                    'Crear',
                    'Actualizar',
                    'Eliminar',
                    'Aprobar',
                    'Rechazar',
                    'Asignar',
                    'Desasignar',
                    'Cambio_De_Estado',
                    'Iniciar_Sesión'
                  )                                      NOT NULL,
  entity_type     VARCHAR(100)                           NOT NULL,
  entity_id       INT UNSIGNED                           NOT NULL,
  previous_value  JSON                                   NULL,
  new_value       JSON                                   NULL,
  description     VARCHAR(500)                           NULL,
  ip_address      VARCHAR(45)                            NULL,
  created_at      TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_entity  (entity_type, entity_id),
  INDEX idx_audit_actor   (actor_type, actor_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- SEED DATA — System tags
-- =============================================================================

INSERT INTO tags (name, slug, category, is_system) VALUES
  ('Materiales', 'Materiales', 'Materiales', TRUE),
  ('Maquinaria',  'Maquinaria',  'Maquinaria',  TRUE),
  ('Diseño',     'Diseño',     'Diseño',     TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  category = VALUES(category),
  is_system = VALUES(is_system);

-- ============================================================================
-- SEED DATA — Media assets (landing page images)
-- ============================================================================

INSERT INTO media_assets (
  original_filename, stored_filename, public_url,
  storage_type, storage_path, mime_type,
  entity_type, alt_text, caption
) VALUES
  (
    '0_mision.jpg',
    'fend-landing/0_mision.jpg',
    'https://iwafxggdxerajwghssgy.supabase.co/storage/v1/object/public/pmi-dlab-visres/fend-landing/0_mision.jpg',
    'Nube',
    'pmi-dlab-visres/fend-landing/0_mision.jpg',
    'image/jpeg',
    'value_propositions',
    'Misión del DLAB',
    'Imagen representativa de la misión del laboratorio'
  ),
  (
    '0_vision.jpeg',
    'fend-landing/0_vision.jpeg',
    'https://iwafxggdxerajwghssgy.supabase.co/storage/v1/object/public/pmi-dlab-visres/fend-landing/0_vision.jpeg',
    'Nube',
    'pmi-dlab-visres/fend-landing/0_vision.jpeg',
    'image/jpeg',
    'value_propositions',
    'Visión del DLAB',
    'Imagen representativa de la visión del laboratorio'
  ),
  (
    'logo-dlab.svg',
    'dlab-image/logo-dlab.svg',
    'https://iwafxggdxerajwghssgy.supabase.co/storage/v1/object/public/pmi-dlab-visres/dlab-image/logo-dlab.svg',
    'Nube',
    'pmi-dlab-visres/dlab-image/logo-dlab.svg',
    'image/svg+xml',
    'navigation_logo',
    'Logo del DLAB para navegación',
    'Imagen del logo del DLAB para ser usada en la barra de navegación'
  );

-- ============================================================================
-- AUTH TOKEN TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS activation_tokens (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  collaborator_id  INT UNSIGNED  NOT NULL,
  token_hash       VARCHAR(255)  NOT NULL,
  expires_at       TIMESTAMP     NOT NULL,
  is_used          BOOLEAN       NOT NULL DEFAULT FALSE,
  used_at          TIMESTAMP     NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activation_token_hash (token_hash),
  CONSTRAINT fk_activation_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  collaborator_id  INT UNSIGNED  NOT NULL,
  token_hash       VARCHAR(255)  NOT NULL,
  expires_at       TIMESTAMP     NOT NULL,
  is_used          BOOLEAN       NOT NULL DEFAULT FALSE,
  used_at          TIMESTAMP     NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_reset_token_hash (token_hash),
  CONSTRAINT fk_reset_collaborator FOREIGN KEY (collaborator_id)
    REFERENCES collaborators (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Procedure: sp_audit_write
-- Description: Inserts a single row into audit_log. Called by all other 
--              procedures that modify data. Never called directly by the 
--              application layer.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_audit_write;

DELIMITER $$

CREATE PROCEDURE sp_audit_write(
  IN p_actor_type   ENUM('Administrador','Sistema'),
  IN p_actor_id     INT UNSIGNED,
  IN p_action       VARCHAR(50),
  IN p_entity_type  VARCHAR(100),
  IN p_entity_id    INT UNSIGNED,
  IN p_prev_value   JSON,
  IN p_new_value    JSON,
  IN p_description  VARCHAR(500),
  IN p_ip_address   VARCHAR(45)
)
BEGIN
  INSERT INTO audit_log (
    actor_type, actor_id, action,
    entity_type, entity_id,
    previous_value, new_value,
    description, ip_address, created_at
  ) VALUES (
    p_actor_type, p_actor_id, p_action,
    p_entity_type, p_entity_id,
    p_prev_value, p_new_value,
    p_description, p_ip_address, NOW()
  );
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_collaborator_set_status
-- Description: Updates trajectory_status on a collaborator row, enforcing the
--              allowed transition machine. Writes an audit entry automatically.
--              Called internally by other procedures — never directly by the API.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_set_status;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_set_status(
  IN p_collaborator_id INT UNSIGNED,
  IN p_new_status      VARCHAR(20),
  IN p_actor_id        INT UNSIGNED,
  IN p_ip_address      VARCHAR(45)
)
BEGIN
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_allowed        TINYINT DEFAULT 0;

  SELECT trajectory_status INTO v_current_status
  FROM collaborators
  WHERE id = p_collaborator_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Collaborator not found';
  END IF;

  -- Validate transition
  SET v_allowed = CASE
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'Nuevo'       AND p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Revisión','Inactivo')  THEN 1
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'En_Revisión' AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Contactado','Inactivo')   THEN 1
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'Contactado'  AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Vinculado','Inactivo')    THEN 1
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'Vinculado'   AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Inactivo')                THEN 1
    WHEN v_current_status COLLATE utf8mb4_unicode_ci = 'Inactivo'    AND p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Revisión')             THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SET @error_msg = CONCAT('Invalid transition: ', v_current_status, ' → ', p_new_status);
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = @error_msg;
  END IF;

  UPDATE collaborators
  SET trajectory_status = p_new_status,
      is_active         = (p_new_status COLLATE utf8mb4_unicode_ci IN ('Contactado', 'Vinculado')),
      updated_at        = NOW()
  WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    'Administrador', p_actor_id, 'Cambio_De_Estado',
    'collaborators', p_collaborator_id,
    JSON_OBJECT('trajectory_status', v_current_status),
    JSON_OBJECT('trajectory_status', p_new_status, 'is_active', p_new_status COLLATE utf8mb4_unicode_ci IN ('Contactado', 'Vinculado')),
    CONCAT('Status changed: ', v_current_status, ' → ', p_new_status),
    p_ip_address
  );
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_auth_store_refresh_token
-- Description: Inserts a new refresh token record. Called after any successful
--              login or token rotation. Old tokens for the same user+device
--              should be revoked by the service layer before calling this.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_auth_store_refresh_token;

DELIMITER $$

CREATE PROCEDURE sp_auth_store_refresh_token(
  IN  p_user_type   ENUM('Administrador','Colaborador'),
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
      'Sistema', NULL, 'Actualizar',
      'collaborators', p_collaborator_id,
      NULL, JSON_OBJECT('password_hash', 'REDACTED'),
      'Password set / changed',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_collaborator_register
-- Description: Inserts a new collaborator from the public interest form with
--              tags and availability slots in a single transaction.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_register;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_register(
  IN  p_first_name               VARCHAR(100),
  IN  p_middle_name              VARCHAR(100),
  IN  p_last_name                VARCHAR(100),
  IN  p_second_last_name         VARCHAR(100),
  IN  p_personal_email           VARCHAR(255),
  IN  p_usfq_email               VARCHAR(255),
  IN  p_phone_number             VARCHAR(20),
  IN  p_date_of_birth            DATE,
  IN  p_major                    VARCHAR(150),
  IN  p_current_university_year  TINYINT UNSIGNED,
  IN  p_expected_graduation_year YEAR,
  IN  p_experience_description   TEXT,
  IN  p_motivation_description   TEXT,
  IN  p_interest_in_machinery    BOOLEAN,
  IN  p_interest_in_design       BOOLEAN,
  IN  p_interest_in_materials    BOOLEAN,
  IN  p_intake_source            VARCHAR(100),
  IN  p_tag_ids                  JSON,
  IN  p_availability_slots       JSON,
  OUT p_collaborator_id          INT UNSIGNED
)
BEGIN
  DECLARE v_tag_count  INT DEFAULT 0;
  DECLARE v_slot_count INT DEFAULT 0;
  DECLARE v_i          INT DEFAULT 0;
  DECLARE v_tag_id     INT UNSIGNED;
  DECLARE v_day        VARCHAR(20);
  DECLARE v_from       TIME;
  DECLARE v_to         TIME;
  DECLARE v_notes      VARCHAR(200);

  -- Duplicate email guard
  IF EXISTS (
    SELECT 1
    FROM collaborators
    WHERE personal_email COLLATE utf8mb4_unicode_ci = p_personal_email COLLATE utf8mb4_unicode_ci
  ) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'personal_email already registered';
  END IF;

  IF p_usfq_email IS NOT NULL AND
     EXISTS (
       SELECT 1
       FROM collaborators
       WHERE usfq_email COLLATE utf8mb4_unicode_ci = p_usfq_email COLLATE utf8mb4_unicode_ci
     ) THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'usfq_email already registered';
  END IF;

  START TRANSACTION;

    INSERT INTO collaborators (
      first_name, middle_name, last_name, second_last_name,
      personal_email, usfq_email, phone_number, date_of_birth,
      major, current_university_year, expected_graduation_year,
      experience_description, motivation_description,
      interest_in_machinery, interest_in_design, interest_in_materials,
      trajectory_status, profile_complete, intake_source,
      is_active,
      created_at, updated_at
    ) VALUES (
      p_first_name, p_middle_name, p_last_name, p_second_last_name,
      p_personal_email, p_usfq_email, p_phone_number, p_date_of_birth,
      p_major, p_current_university_year, p_expected_graduation_year,
      p_experience_description, p_motivation_description,
      p_interest_in_machinery, p_interest_in_design, p_interest_in_materials,
      'En_Revisión', TRUE, p_intake_source,
      FALSE,
      NOW(), NOW()
    );

    SET p_collaborator_id = LAST_INSERT_ID();

    -- Insert tags
    IF JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_tag_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_tag_count DO
        SET v_tag_id = JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']'));
        INSERT IGNORE INTO collaborator_tags (collaborator_id, tag_id, created_at)
        VALUES (p_collaborator_id, v_tag_id, NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Insert availability slots
    SET v_i = 0;
    IF p_availability_slots IS NOT NULL AND JSON_LENGTH(p_availability_slots) > 0 THEN
      SET v_slot_count = JSON_LENGTH(p_availability_slots);
      WHILE v_i < v_slot_count DO
        SET v_day   = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].day_of_week')));
        SET v_from  = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].time_from')));
        SET v_to    = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].time_to')));
        SET v_notes = JSON_UNQUOTE(JSON_EXTRACT(p_availability_slots, CONCAT('$[', v_i, '].notes')));
        INSERT INTO availability_slots (collaborator_id, day_of_week, time_from, time_to, notes)
        VALUES (p_collaborator_id, v_day, v_from, v_to, v_notes);
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'Sistema', NULL, 'Crear',
      'collaborators', p_collaborator_id,
      NULL,
      JSON_OBJECT('trajectory_status','En_Revisión','personal_email', p_personal_email, 'usfq_email', p_usfq_email),
      'New collaborator registered via interest form',
      NULL
    );

  COMMIT;
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_collaborator_update_profile
-- Description: Updates editable profile fields for a collaborator.
--              NULL values are ignored (COALESCE keeps existing value).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_update_profile;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_update_profile(
  IN p_collaborator_id          INT UNSIGNED,
  IN p_first_name               VARCHAR(100),
  IN p_middle_name              VARCHAR(100),
  IN p_last_name                VARCHAR(100),
  IN p_second_last_name         VARCHAR(100),
  IN p_personal_email           VARCHAR(255),
  IN p_usfq_email               VARCHAR(255),
  IN p_phone_number             VARCHAR(20),
  IN p_date_of_birth            DATE,
  IN p_major                    VARCHAR(150),
  IN p_current_university_year  TINYINT UNSIGNED,
  IN p_expected_graduation_year YEAR,
  IN p_experience_description   TEXT,
  IN p_motivation_description   TEXT,
  IN p_interest_in_machinery    BOOLEAN,
  IN p_interest_in_design       BOOLEAN,
  IN p_interest_in_materials    BOOLEAN,
  IN p_actor_id                 INT UNSIGNED,
  IN p_ip_address               VARCHAR(45)
)
BEGIN
  DECLARE v_profile_complete BOOLEAN DEFAULT FALSE;

  UPDATE collaborators SET
    first_name               = COALESCE(p_first_name, first_name),
    middle_name              = COALESCE(p_middle_name, middle_name),
    last_name                = COALESCE(p_last_name, last_name),
    second_last_name         = COALESCE(p_second_last_name, second_last_name),
    personal_email           = COALESCE(p_personal_email, personal_email),
    usfq_email               = COALESCE(p_usfq_email, usfq_email),
    phone_number             = COALESCE(p_phone_number, phone_number),
    date_of_birth            = COALESCE(p_date_of_birth, date_of_birth),
    major                    = COALESCE(p_major, major),
    current_university_year  = COALESCE(p_current_university_year, current_university_year),
    expected_graduation_year = COALESCE(p_expected_graduation_year, expected_graduation_year),
    experience_description   = COALESCE(p_experience_description, experience_description),
    motivation_description   = COALESCE(p_motivation_description, motivation_description),
    interest_in_machinery    = p_interest_in_machinery,
    interest_in_design       = p_interest_in_design,
    interest_in_materials    = p_interest_in_materials,
    updated_at               = NOW()
  WHERE id = p_collaborator_id;

  -- Re-evaluate profile completeness after update
  SELECT
    (major IS NOT NULL AND major != ''
     AND current_university_year IS NOT NULL
     AND expected_graduation_year IS NOT NULL
     AND motivation_description IS NOT NULL AND motivation_description != '')
  INTO v_profile_complete
  FROM collaborators WHERE id = p_collaborator_id;

  UPDATE collaborators SET profile_complete = v_profile_complete WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    IF(p_actor_id IS NOT NULL, 'Administrador', 'Sistema'),
    p_actor_id, 'Actualizar',
    'collaborators', p_collaborator_id,
    NULL, NULL,
    'Collaborator profile updated',
    p_ip_address
  );
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_collaborator_sync_tags
-- Description: Replaces all collaborator_tags for a collaborator with the
--              provided set of tag IDs (full replacement strategy).
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_collaborator_sync_tags;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_sync_tags(
  IN p_collaborator_id INT UNSIGNED,
  IN p_tag_ids         JSON
)
BEGIN
  DECLARE v_i       INT DEFAULT 0;
  DECLARE v_count   INT DEFAULT 0;
  DECLARE v_tag_id  INT UNSIGNED;

  START TRANSACTION;
    DELETE FROM collaborator_tags WHERE collaborator_id = p_collaborator_id;

    IF JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        SET v_tag_id = JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']'));
        INSERT IGNORE INTO collaborator_tags (collaborator_id, tag_id, created_at)
        VALUES (p_collaborator_id, v_tag_id, NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;
  COMMIT;
END$$

DELIMITER ;
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

DROP PROCEDURE IF EXISTS sp_collaborator_admin_create;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_admin_create(
  IN p_first_name               VARCHAR(100),
  IN p_middle_name              VARCHAR(100),
  IN p_last_name                VARCHAR(100),
  IN p_second_last_name         VARCHAR(100),
  IN p_personal_email           VARCHAR(255),
  IN p_usfq_email               VARCHAR(255),
  IN p_phone_number             VARCHAR(20),
  IN p_date_of_birth            DATE,
  IN p_password_hash            VARCHAR(255),
  IN p_major                    VARCHAR(150),
  IN p_current_university_year  TINYINT UNSIGNED,
  IN p_expected_graduation_year YEAR,
  IN p_experience_description   TEXT,
  IN p_motivation_description   TEXT,
  IN p_interest_in_machinery    BOOLEAN,
  IN p_interest_in_design       BOOLEAN,
  IN p_interest_in_materials    BOOLEAN,
  IN p_trajectory_status        VARCHAR(20),
  IN p_is_active                BOOLEAN,
  IN p_profile_complete         BOOLEAN,
  IN p_intake_source            VARCHAR(100),
  IN p_actor_id                 INT UNSIGNED,
  IN p_ip_address               VARCHAR(45),
  OUT p_collaborator_id         INT UNSIGNED
)
BEGIN
  INSERT INTO collaborators (
    first_name, middle_name, last_name, second_last_name,
    personal_email, usfq_email, phone_number, date_of_birth,
    password_hash, major, current_university_year, expected_graduation_year,
    experience_description, motivation_description,
    interest_in_machinery, interest_in_design, interest_in_materials,
    trajectory_status, is_active, profile_complete, intake_source,
    created_at, updated_at
  ) VALUES (
    p_first_name, p_middle_name, p_last_name, p_second_last_name,
    p_personal_email, p_usfq_email, p_phone_number, p_date_of_birth,
    p_password_hash, p_major, p_current_university_year, p_expected_graduation_year,
    p_experience_description, p_motivation_description,
    p_interest_in_machinery, p_interest_in_design, p_interest_in_materials,
    p_trajectory_status, p_is_active, p_profile_complete, p_intake_source,
    NOW(), NOW()
  );

  SET p_collaborator_id = LAST_INSERT_ID();

  CALL sp_audit_write(
    'Administrador', p_actor_id, 'Crear',
    'collaborators', p_collaborator_id,
    NULL,
    JSON_OBJECT('personal_email', p_personal_email, 'trajectory_status', p_trajectory_status, 'is_active', p_is_active),
    'Collaborator created by admin',
    p_ip_address
  );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_collaborator_admin_update;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_admin_update(
  IN p_collaborator_id          INT UNSIGNED,
  IN p_first_name               VARCHAR(100),
  IN p_middle_name              VARCHAR(100),
  IN p_last_name                VARCHAR(100),
  IN p_second_last_name         VARCHAR(100),
  IN p_personal_email           VARCHAR(255),
  IN p_usfq_email               VARCHAR(255),
  IN p_phone_number             VARCHAR(20),
  IN p_date_of_birth            DATE,
  IN p_major                    VARCHAR(150),
  IN p_current_university_year  TINYINT UNSIGNED,
  IN p_expected_graduation_year YEAR,
  IN p_experience_description   TEXT,
  IN p_motivation_description   TEXT,
  IN p_interest_in_machinery    BOOLEAN,
  IN p_interest_in_design       BOOLEAN,
  IN p_interest_in_materials    BOOLEAN,
  IN p_trajectory_status        VARCHAR(20),
  IN p_is_active                BOOLEAN,
  IN p_profile_complete         BOOLEAN,
  IN p_intake_source            VARCHAR(100),
  IN p_actor_id                 INT UNSIGNED,
  IN p_ip_address               VARCHAR(45)
)
BEGIN
  UPDATE collaborators SET
    first_name               = p_first_name,
    middle_name              = p_middle_name,
    last_name                = p_last_name,
    second_last_name         = p_second_last_name,
    personal_email           = p_personal_email,
    usfq_email               = p_usfq_email,
    phone_number             = p_phone_number,
    date_of_birth            = p_date_of_birth,
    major                    = p_major,
    current_university_year  = p_current_university_year,
    expected_graduation_year = p_expected_graduation_year,
    experience_description   = p_experience_description,
    motivation_description   = p_motivation_description,
    interest_in_machinery    = p_interest_in_machinery,
    interest_in_design       = p_interest_in_design,
    interest_in_materials    = p_interest_in_materials,
    trajectory_status        = p_trajectory_status,
    is_active                = p_is_active,
    profile_complete         = p_profile_complete,
    intake_source            = p_intake_source,
    updated_at               = NOW()
  WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    'Administrador', p_actor_id, 'Actualizar',
    'collaborators', p_collaborator_id,
    NULL,
    JSON_OBJECT('trajectory_status', p_trajectory_status, 'is_active', p_is_active),
    'Collaborator updated by admin',
    p_ip_address
  );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_collaborator_admin_set_active;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_admin_set_active(
  IN p_collaborator_id INT UNSIGNED,
  IN p_is_active       BOOLEAN,
  IN p_actor_id        INT UNSIGNED,
  IN p_ip_address      VARCHAR(45)
)
BEGIN
  UPDATE collaborators
  SET is_active = p_is_active,
      trajectory_status = IF(p_is_active, trajectory_status, 'Inactivo'),
      updated_at = NOW()
  WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    'Administrador', p_actor_id, 'Actualizar',
    'collaborators', p_collaborator_id,
    NULL,
    JSON_OBJECT('is_active', p_is_active),
    CONCAT('Collaborator set ', IF(p_is_active, 'active', 'inactive')),
    p_ip_address
  );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_collaborator_admin_delete;

DELIMITER $$

CREATE PROCEDURE sp_collaborator_admin_delete(
  IN p_collaborator_id INT UNSIGNED,
  IN p_actor_id        INT UNSIGNED,
  IN p_ip_address      VARCHAR(45)
)
BEGIN
  DECLARE v_app_count INT DEFAULT 0;
  DECLARE v_asg_count INT DEFAULT 0;

  SELECT COUNT(*) INTO v_app_count FROM applications WHERE collaborator_id = p_collaborator_id;
  SELECT COUNT(*) INTO v_asg_count FROM assignments WHERE collaborator_id = p_collaborator_id;

  IF v_app_count > 0 OR v_asg_count > 0 THEN
    SIGNAL SQLSTATE '45030' SET MESSAGE_TEXT = 'Collaborator has related records and cannot be deleted';
  END IF;

  DELETE FROM collaborator_tags WHERE collaborator_id = p_collaborator_id;
  DELETE FROM availability_slots WHERE collaborator_id = p_collaborator_id;
  DELETE FROM collaborators WHERE id = p_collaborator_id;

  CALL sp_audit_write(
    'Administrador', p_actor_id, 'Eliminar',
    'collaborators', p_collaborator_id,
    NULL,
    NULL,
    'Collaborator deleted by admin',
    p_ip_address
  );
END$$

DELIMITER ;
-- ============================================================================
-- Procedure: sp_application_submit
-- Description: Creates a new application record with validation for
--              collaborator status, project visibility, and capacity.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_application_submit;

DELIMITER $$

CREATE PROCEDURE sp_application_submit(
  IN  p_collaborator_id     INT UNSIGNED,
  IN  p_project_id          INT UNSIGNED,
  IN  p_reason_for_applying TEXT,
  IN  p_ip_address          VARCHAR(45),
  OUT p_application_id      INT UNSIGNED
)
BEGIN
  DECLARE v_traj_status    VARCHAR(20);
  DECLARE v_proj_status    VARCHAR(20);
  DECLARE v_proj_visible   BOOLEAN;
  DECLARE v_max_collab     SMALLINT UNSIGNED;
  DECLARE v_cur_count      SMALLINT UNSIGNED;
  DECLARE v_dup_count      INT DEFAULT 0;
  DECLARE v_live_assign_count INT DEFAULT 0;

  SELECT trajectory_status INTO v_traj_status
  FROM collaborators WHERE id = p_collaborator_id;

  IF v_traj_status COLLATE utf8mb4_unicode_ci NOT IN ('Contactado','Vinculado') THEN
    SIGNAL SQLSTATE '45010'
      SET MESSAGE_TEXT = 'Collaborator status does not permit applying to projects';
  END IF;

  SELECT status, is_visible, max_collaborators, current_collaborator_count
  INTO v_proj_status, v_proj_visible, v_max_collab, v_cur_count
  FROM projects WHERE id = p_project_id;

  IF v_proj_status COLLATE utf8mb4_unicode_ci != 'Activo' OR v_proj_visible = FALSE THEN
    SIGNAL SQLSTATE '45012'
      SET MESSAGE_TEXT = 'Project is not accepting applications';
  END IF;

  IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
    SIGNAL SQLSTATE '45013'
      SET MESSAGE_TEXT = 'Project has reached maximum collaborator capacity';
  END IF;

  SELECT COUNT(*) INTO v_dup_count
  FROM applications
  WHERE collaborator_id = p_collaborator_id
    AND project_id      = p_project_id
    AND status COLLATE utf8mb4_unicode_ci IN ('Pendiente','En_Revisión');

  IF v_dup_count > 0 THEN
    SIGNAL SQLSTATE '45011'
      SET MESSAGE_TEXT = 'An active application already exists for this project';
  END IF;

  SELECT COUNT(*) INTO v_live_assign_count
  FROM assignments
  WHERE collaborator_id = p_collaborator_id
    AND project_id      = p_project_id
    AND status COLLATE utf8mb4_unicode_ci IN ('Activo','Pausado');

  IF v_live_assign_count > 0 THEN
    SIGNAL SQLSTATE '45014'
      SET MESSAGE_TEXT = 'A live assignment already exists for this project';
  END IF;

  START TRANSACTION;
    INSERT INTO applications (
      collaborator_id, project_id, reason_for_applying,
      status, applied_at
    ) VALUES (
      p_collaborator_id, p_project_id, p_reason_for_applying,
      'Pendiente', NOW()
    );

    SET p_application_id = LAST_INSERT_ID();

    CALL sp_audit_write(
      'Sistema', NULL, 'Crear',
      'applications', p_application_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'status', 'Pendiente'),
      'Application submitted by collaborator',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
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
      rejected_at  = IF(p_new_status COLLATE utf8mb4_unicode_ci = 'Rechazada',   NOW(), rejected_at),
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
-- ============================================================================
-- Procedure: sp_application_approve
-- Description: Core transactional procedure that atomically approves an
--              application AND creates the resulting assignment.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_application_approve;

DELIMITER $$

CREATE PROCEDURE sp_application_approve(
  IN  p_application_id  INT UNSIGNED,
  IN  p_admin_id        INT UNSIGNED,
  IN  p_role_in_project VARCHAR(150),
  IN  p_admin_notes     TEXT,
  IN  p_ip_address      VARCHAR(45),
  OUT p_assignment_id   INT UNSIGNED
)
BEGIN
  DECLARE v_app_status    VARCHAR(20);
  DECLARE v_collab_id     INT UNSIGNED;
  DECLARE v_project_id    INT UNSIGNED;
  DECLARE v_traj_status   VARCHAR(20);
  DECLARE v_max_collab    SMALLINT UNSIGNED;
  DECLARE v_cur_count     SMALLINT UNSIGNED;
  DECLARE v_dup_assign    INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  -- Lock application row
  SELECT status, collaborator_id, project_id
  INTO v_app_status, v_collab_id, v_project_id
  FROM applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_app_status IS NULL THEN
    SIGNAL SQLSTATE '45023'
      SET MESSAGE_TEXT = 'Application not found';
  END IF;

  IF v_app_status COLLATE utf8mb4_unicode_ci NOT IN ('Pendiente', 'En_Revisión') THEN
    SIGNAL SQLSTATE '45020'
      SET MESSAGE_TEXT = 'Application cannot be approved from its current status';
  END IF;

  -- Check capacity
  SELECT max_collaborators, current_collaborator_count
  INTO v_max_collab, v_cur_count
  FROM projects WHERE id = v_project_id FOR UPDATE;

  IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
    SIGNAL SQLSTATE '45021'
      SET MESSAGE_TEXT = 'Project is at max collaborator capacity';
  END IF;

  -- Check duplicate active assignment
  SELECT COUNT(*) INTO v_dup_assign
  FROM assignments
  WHERE collaborator_id = v_collab_id
    AND project_id      = v_project_id
    AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado');

  IF v_dup_assign > 0 THEN
    SIGNAL SQLSTATE '45022'
      SET MESSAGE_TEXT = 'Collaborator already has a live assignment for this project';
  END IF;

  SELECT trajectory_status INTO v_traj_status
  FROM collaborators WHERE id = v_collab_id FOR UPDATE;

  START TRANSACTION;

    -- 1. Approve application
    UPDATE applications SET
      status            = 'Aprobada',
      approved_at       = NOW(),
      reviewed_at       = COALESCE(reviewed_at, NOW()),
      approver_admin_id = p_admin_id,
      admin_notes       = COALESCE(p_admin_notes, admin_notes)
    WHERE id = p_application_id;

    -- 2. Create assignment
    INSERT INTO assignments (
      collaborator_id, project_id, application_id,
      assigned_by_admin_id, role_in_project,
      assigned_at, status
    ) VALUES (
      v_collab_id, v_project_id, p_application_id,
      p_admin_id, p_role_in_project,
      NOW(), 'Activo'
    );
    SET p_assignment_id = LAST_INSERT_ID();

    -- 3. Increment project counter
    UPDATE projects
    SET current_collaborator_count = current_collaborator_count + 1,
        updated_at                 = NOW()
    WHERE id = v_project_id;

    -- 4. Set collaborator trajectory_status to vinculado (if not already)
    IF v_traj_status COLLATE utf8mb4_unicode_ci != 'Vinculado' THEN
      UPDATE collaborators
      SET trajectory_status = 'Vinculado', updated_at = NOW()
      WHERE id = v_collab_id;
    END IF;

    -- 5a. Audit: approval
    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Aprobar',
      'applications', p_application_id,
      JSON_OBJECT('status', v_app_status),
      JSON_OBJECT('status', 'Aprobada'),
      CONCAT('Application approved; assignment ', LAST_INSERT_ID(), ' created'),
      p_ip_address
    );

    -- 5b. Audit: assignment creation
    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Asignar',
      'assignments', p_assignment_id,
      NULL,
      JSON_OBJECT('collaborator_id', v_collab_id,
                  'project_id', v_project_id,
                  'status', 'Activo'),
      'Assignment created from application approval',
      p_ip_address
    );

  COMMIT;
END$$

DELIMITER ;
-- sp_assignment_create_manual
-- Creates an approved application plus assignment for an admin-driven linkage.

DROP PROCEDURE IF EXISTS sp_assignment_create_manual;

DELIMITER $$

CREATE PROCEDURE sp_assignment_create_manual(
  IN  p_collaborator_id    INT UNSIGNED,
  IN  p_project_id         INT UNSIGNED,
  IN  p_admin_id           INT UNSIGNED,
  IN  p_reason_for_linking TEXT,
  IN  p_role_in_project    VARCHAR(150),
  IN  p_admin_notes        TEXT,
  IN  p_ip_address         VARCHAR(45),
  OUT p_assignment_id      INT UNSIGNED
)
BEGIN
  DECLARE v_dup_count      INT DEFAULT 0;
  DECLARE v_max_collab     SMALLINT UNSIGNED;
  DECLARE v_cur_count      SMALLINT UNSIGNED;
  DECLARE v_project_row_id INT UNSIGNED;
  DECLARE v_traj_status    VARCHAR(20);
  DECLARE v_application_id INT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

    SELECT trajectory_status
    INTO v_traj_status
    FROM collaborators
    WHERE id = p_collaborator_id
    FOR UPDATE;

    IF v_traj_status IS NULL THEN
      SIGNAL SQLSTATE '45032'
        SET MESSAGE_TEXT = 'Collaborator not found';
    END IF;

    SELECT id, max_collaborators, current_collaborator_count
    INTO v_project_row_id, v_max_collab, v_cur_count
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF v_project_row_id IS NULL THEN
      SIGNAL SQLSTATE '45033'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;

    SELECT COUNT(*) INTO v_dup_count
    FROM assignments
    WHERE collaborator_id = p_collaborator_id
      AND project_id = p_project_id
      AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado');

    IF v_dup_count > 0 THEN
      SIGNAL SQLSTATE '45030'
        SET MESSAGE_TEXT = 'Live assignment already exists';
    END IF;

    IF v_max_collab IS NOT NULL AND v_cur_count >= v_max_collab THEN
      SIGNAL SQLSTATE '45031'
        SET MESSAGE_TEXT = 'Project at max capacity';
    END IF;

    INSERT INTO applications (
      collaborator_id,
      project_id,
      reason_for_applying,
      status,
      applied_at,
      reviewed_at,
      approved_at,
      approver_admin_id,
      admin_notes
    ) VALUES (
      p_collaborator_id,
      p_project_id,
      p_reason_for_linking,
      'Aprobada',
      NOW(),
      NOW(),
      NOW(),
      p_admin_id,
      NULLIF(TRIM(p_admin_notes), '')
    );
    SET v_application_id = LAST_INSERT_ID();

    INSERT INTO assignments (
      collaborator_id, project_id, application_id,
      assigned_by_admin_id, role_in_project,
      assigned_at, status
    ) VALUES (
      p_collaborator_id, p_project_id, v_application_id,
      p_admin_id, NULLIF(TRIM(p_role_in_project), ''),
      NOW(), 'Activo'
    );
    SET p_assignment_id = LAST_INSERT_ID();

    UPDATE projects
    SET current_collaborator_count = current_collaborator_count + 1,
        updated_at = NOW()
    WHERE id = p_project_id;

    IF v_traj_status COLLATE utf8mb4_unicode_ci != 'Vinculado' THEN
      UPDATE collaborators
      SET trajectory_status = 'Vinculado', updated_at = NOW()
      WHERE id = p_collaborator_id;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Aprobar',
      'applications', v_application_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'status', 'Aprobada',
                  'reason_for_applying', p_reason_for_linking),
      'Manual linkage created approved application',
      p_ip_address
    );

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Asignar',
      'assignments', p_assignment_id,
      NULL,
      JSON_OBJECT('collaborator_id', p_collaborator_id,
                  'project_id', p_project_id,
                  'application_id', v_application_id,
                  'role', NULLIF(TRIM(p_role_in_project), ''),
                  'status', 'Activo'),
      'Manual linkage assignment created by admin',
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_assignment_delete_hard
-- Hard deletes an assignment and its linked application when present.

DROP PROCEDURE IF EXISTS sp_assignment_delete_hard;

DELIMITER $$

CREATE PROCEDURE sp_assignment_delete_hard(
  IN p_assignment_id INT UNSIGNED,
  IN p_admin_id      INT UNSIGNED,
  IN p_ip_address    VARCHAR(45)
)
BEGIN
  DECLARE v_collab_id         INT UNSIGNED;
  DECLARE v_project_id        INT UNSIGNED;
  DECLARE v_application_id    INT UNSIGNED;
  DECLARE v_current_status    VARCHAR(20);
  DECLARE v_remaining_active  INT DEFAULT 0;
  DECLARE v_should_decrement  TINYINT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

    SELECT collaborator_id, project_id, application_id, status
    INTO v_collab_id, v_project_id, v_application_id, v_current_status
    FROM assignments
    WHERE id = p_assignment_id
    FOR UPDATE;

    IF v_collab_id IS NULL THEN
      SIGNAL SQLSTATE '45050'
        SET MESSAGE_TEXT = 'Assignment not found';
    END IF;

    SET v_should_decrement = CASE
      WHEN v_current_status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado') THEN 1
      ELSE 0
    END;

    DELETE FROM assignments
    WHERE id = p_assignment_id;

    IF v_application_id IS NOT NULL THEN
      DELETE FROM applications
      WHERE id = v_application_id;
    END IF;

    IF v_should_decrement = 1 THEN
      UPDATE projects
      SET current_collaborator_count = CASE
            WHEN current_collaborator_count > 0 THEN current_collaborator_count - 1
            ELSE 0
          END,
          updated_at = NOW()
      WHERE id = v_project_id;
    END IF;

    SELECT COUNT(*) INTO v_remaining_active
    FROM assignments
    WHERE collaborator_id = v_collab_id
      AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado');

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Eliminar',
      'assignments', p_assignment_id,
      JSON_OBJECT('collaborator_id', v_collab_id,
                  'project_id', v_project_id,
                  'application_id', v_application_id,
                  'status', v_current_status),
      JSON_OBJECT('deleted', TRUE,
                  'application_deleted', IF(v_application_id IS NOT NULL, TRUE, FALSE)),
      'Assignment hard deleted by admin',
      p_ip_address
    );

  COMMIT;
END$$

DELIMITER ;
-- sp_assignment_end
-- Ends an active assignment. Decrements project counter and demotes collaborator if no remaining assignments.

DROP PROCEDURE IF EXISTS sp_assignment_end;

DELIMITER $$

CREATE PROCEDURE sp_assignment_end(
  IN p_assignment_id INT UNSIGNED,
  IN p_end_status    VARCHAR(20),
  IN p_end_reason    VARCHAR(300),
  IN p_admin_id      INT UNSIGNED,
  IN p_ip_address    VARCHAR(45)
)
BEGIN
  DECLARE v_collab_id      INT UNSIGNED;
  DECLARE v_project_id     INT UNSIGNED;
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_remaining      INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT collaborator_id, project_id, status
  INTO v_collab_id, v_project_id, v_current_status
  FROM assignments WHERE id = p_assignment_id FOR UPDATE;

  IF v_collab_id IS NULL THEN
    SIGNAL SQLSTATE '45042'
      SET MESSAGE_TEXT = 'Assignment not found';
  END IF;

  IF v_current_status COLLATE utf8mb4_unicode_ci NOT IN ('Activo','Pausado') THEN
    SIGNAL SQLSTATE '45040'
      SET MESSAGE_TEXT = 'Assignment is not in an endable state';
  END IF;

  IF p_end_status COLLATE utf8mb4_unicode_ci NOT IN ('Finalizado','Removido','Pausado') THEN
    SIGNAL SQLSTATE '45041'
      SET MESSAGE_TEXT = 'Invalid end status value';
  END IF;

  IF p_end_status COLLATE utf8mb4_unicode_ci IN ('Finalizado','Removido')
     AND (p_end_reason IS NULL OR CHAR_LENGTH(TRIM(p_end_reason)) = 0) THEN
    SIGNAL SQLSTATE '45043'
      SET MESSAGE_TEXT = 'End reason is required';
  END IF;

    UPDATE assignments SET
      status     = p_end_status,
      ended_at   = IF(p_end_status COLLATE utf8mb4_unicode_ci = 'Pausado', NULL, NOW()),
      end_reason = NULLIF(TRIM(p_end_reason), '')
    WHERE id = p_assignment_id;

    -- Decrement counter only when fully ending (not pausing)
    IF p_end_status COLLATE utf8mb4_unicode_ci IN ('Finalizado','Removido') THEN
      UPDATE projects
      SET current_collaborator_count = CASE
            WHEN current_collaborator_count > 0 THEN current_collaborator_count - 1
            ELSE 0
          END,
          updated_at = NOW()
      WHERE id = v_project_id;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Desasignar',
      'assignments', p_assignment_id,
      JSON_OBJECT('status', v_current_status),
      JSON_OBJECT('status', p_end_status, 'end_reason', NULLIF(TRIM(p_end_reason), '')),
      CONCAT('Assignment ended: ', p_end_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_project_create
-- Creates a new project with tags, meeting_days, and managers in one transaction.

DROP PROCEDURE IF EXISTS sp_project_create;

DELIMITER $$

CREATE PROCEDURE sp_project_create(
  IN  p_title               VARCHAR(255),
  IN  p_slug                VARCHAR(255),
  IN  p_short_description   VARCHAR(500),
  IN  p_full_description    TEXT,
  IN  p_target_audience     VARCHAR(300),
  IN  p_required_skills     TEXT,
  IN  p_participation_mode  VARCHAR(200),
  IN  p_header_image_media_asset_id INT UNSIGNED,
  IN  p_video_media_asset_id        INT UNSIGNED,
  IN  p_status              VARCHAR(20),
  IN  p_is_highlighted      BOOLEAN,
  IN  p_is_visible          BOOLEAN,
  IN  p_max_collaborators   SMALLINT UNSIGNED,
  IN  p_created_by_admin_id INT UNSIGNED,
  IN  p_tag_ids             JSON,
  IN  p_required_skill_items JSON,
  IN  p_meeting_days        JSON,
  IN  p_manager_ids         JSON,
  OUT p_project_id          INT UNSIGNED
)
BEGIN
  DECLARE v_i       INT DEFAULT 0;
  DECLARE v_count   INT DEFAULT 0;
  DECLARE v_day_of_week VARCHAR(20);
  DECLARE v_start_time  VARCHAR(10);
  DECLARE v_end_time    VARCHAR(10);
  DECLARE v_notes       VARCHAR(300);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF EXISTS (SELECT 1 FROM projects WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45050' SET MESSAGE_TEXT = 'Project slug already exists';
  END IF;

  START TRANSACTION;
    INSERT INTO projects (
      title, slug, short_description, full_description,
      target_audience, required_skills, participation_mode,
      header_image_media_asset_id, video_media_asset_id, status,
      is_highlighted, is_visible, max_collaborators,
      current_collaborator_count, created_by_admin_id,
      created_at, updated_at
    ) VALUES (
      p_title, p_slug, p_short_description, p_full_description,
      p_target_audience, p_required_skills, p_participation_mode,
      p_header_image_media_asset_id, p_video_media_asset_id, p_status,
      p_is_highlighted, p_is_visible, p_max_collaborators,
      0, p_created_by_admin_id,
      NOW(), NOW()
    );
    SET p_project_id = LAST_INSERT_ID();

    -- Tags
    IF p_tag_ids IS NOT NULL AND JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO project_tags (project_id, tag_id, created_at)
        VALUES (p_project_id,
                JSON_EXTRACT(p_tag_ids, CONCAT('$[', v_i, ']')),
                NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Required skills
    SET v_i = 0;
    IF p_required_skill_items IS NOT NULL AND JSON_LENGTH(p_required_skill_items) > 0 THEN
      SET v_count = JSON_LENGTH(p_required_skill_items);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO project_required_skills (
          project_id, name, slug, created_by_admin_id, created_at
        ) VALUES (
          p_project_id,
          JSON_UNQUOTE(JSON_EXTRACT(p_required_skill_items, CONCAT('$[', v_i, '].name'))),
          COALESCE(
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_required_skill_items, CONCAT('$[', v_i, '].slug'))), ''),
            JSON_UNQUOTE(JSON_EXTRACT(p_required_skill_items, CONCAT('$[', v_i, '].name')))
          ),
          p_created_by_admin_id,
          NOW()
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Meeting days
    SET v_i = 0;
    IF p_meeting_days IS NOT NULL AND JSON_LENGTH(p_meeting_days) > 0 THEN
      SET v_count = JSON_LENGTH(p_meeting_days);
      WHILE v_i < v_count DO
        SET v_day_of_week = COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].day_of_week'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].dayOfWeek')))
        );
        SET v_start_time = COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].start_time'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].startTime')))
        );
        SET v_end_time = COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].end_time'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].endTime')))
        );
        SET v_notes = COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].notes'))),
          JSON_UNQUOTE(JSON_EXTRACT(p_meeting_days, CONCAT('$[',v_i,'].note')))
        );
        IF v_day_of_week IS NOT NULL AND v_start_time IS NOT NULL AND v_end_time IS NOT NULL THEN
          INSERT INTO project_meeting_days (project_id, day_of_week, start_time, end_time, notes)
          VALUES (
            p_project_id,
            v_day_of_week,
            v_start_time,
            v_end_time,
            v_notes
          );
        END IF;
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Managers
    SET v_i = 0;
    IF p_manager_ids IS NOT NULL AND JSON_LENGTH(p_manager_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_manager_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO project_managers (
          project_id, admin_id, is_primary, assigned_at
        ) VALUES (
          p_project_id,
          JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].admin_id')),
          COALESCE(JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].is_primary')), FALSE),
          NOW()
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_created_by_admin_id, 'Crear',
      'projects', p_project_id,
      NULL,
      JSON_OBJECT('title', p_title, 'slug', p_slug, 'status', p_status),
      'Project created',
      NULL
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_project_set_status
-- Updates project status with transition enforcement.

DROP PROCEDURE IF EXISTS sp_project_set_status;

DELIMITER $$

CREATE PROCEDURE sp_project_set_status(
  IN p_project_id INT UNSIGNED,
  IN p_new_status VARCHAR(20),
  IN p_admin_id   INT UNSIGNED,
  IN p_ip_address VARCHAR(45)
)
BEGIN
  DECLARE v_current VARCHAR(20);
  DECLARE v_allowed TINYINT DEFAULT 0;

  SELECT status INTO v_current FROM projects WHERE id = p_project_id FOR UPDATE;

  SET v_allowed = CASE
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'Próximo'    AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Activo','Archivado')         THEN 1
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'Activo'     AND p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Pausa','Completado','Archivado') THEN 1
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'En_Pausa'   AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Activo','Archivado')         THEN 1
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'Completado' AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Archivado')                  THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SET @error_msg = CONCAT('Invalid project transition: ', v_current,' → ',p_new_status);
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = @error_msg;
  END IF;

  START TRANSACTION;
    UPDATE projects
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_project_id;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Cambio_De_Estado',
      'projects', p_project_id,
      JSON_OBJECT('status', v_current),
      JSON_OBJECT('status', p_new_status),
      CONCAT('Project status → ', p_new_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_project_toggle_visibility
-- Toggles is_visible for a project.

DROP PROCEDURE IF EXISTS sp_project_toggle_visibility;

DELIMITER $$

CREATE PROCEDURE sp_project_toggle_visibility(
  IN p_project_id INT UNSIGNED,
  IN p_admin_id   INT UNSIGNED
)
BEGIN
  UPDATE projects
  SET is_visible = NOT is_visible, updated_at = NOW()
  WHERE id = p_project_id;

  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Actualizar',
    'projects', p_project_id,
    NULL, NULL, 'Project visibility toggled', NULL
  );
END$$

DELIMITER ;
-- sp_event_create
-- Creates a new event with tags and managers in one transaction.

DROP PROCEDURE IF EXISTS sp_event_create;

DELIMITER $$

CREATE PROCEDURE sp_event_create(
  IN  p_title                 VARCHAR(255),
  IN  p_slug                  VARCHAR(255),
  IN  p_type                  VARCHAR(30),
  IN  p_short_description     VARCHAR(500),
  IN  p_full_description      TEXT,
  IN  p_target_audience       VARCHAR(300),
  IN  p_location              VARCHAR(300),
  IN  p_event_date            DATETIME,
  IN  p_event_end_date        DATETIME,
  IN  p_registration_deadline DATETIME,
  IN  p_capacity              SMALLINT UNSIGNED,
  IN  p_banner_media_asset_id INT UNSIGNED,
  IN  p_video_media_asset_id  INT UNSIGNED,
  IN  p_poster_media_asset_id INT UNSIGNED,
  IN  p_registration_url      VARCHAR(1000),
  IN  p_status                VARCHAR(20),
  IN  p_is_highlighted        BOOLEAN,
  IN  p_is_visible            BOOLEAN,
  IN  p_created_by_admin_id   INT UNSIGNED,
  IN  p_tag_ids               JSON,
  IN  p_manager_ids           JSON,
  OUT p_event_id              INT UNSIGNED
)
BEGIN
  DECLARE v_i INT DEFAULT 0; DECLARE v_count INT DEFAULT 0;

  IF EXISTS (SELECT 1 FROM events WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45060' SET MESSAGE_TEXT = 'Event slug already exists';
  END IF;

  START TRANSACTION;
    INSERT INTO events (
      title, slug, type, short_description, full_description,
      target_audience, location, event_date, event_end_date,
      registration_deadline, capacity,
      banner_media_asset_id, video_media_asset_id, poster_media_asset_id, registration_url,
      status, is_highlighted, is_visible,
      created_by_admin_id, created_at, updated_at
    ) VALUES (
      p_title, p_slug, p_type, p_short_description, p_full_description,
      p_target_audience, p_location, p_event_date, p_event_end_date,
      p_registration_deadline, p_capacity,
      p_banner_media_asset_id, p_video_media_asset_id, p_poster_media_asset_id, p_registration_url,
      p_status, p_is_highlighted, p_is_visible,
      p_created_by_admin_id, NOW(), NOW()
    );
    SET p_event_id = LAST_INSERT_ID();

    -- Tags
    IF p_tag_ids IS NOT NULL AND JSON_LENGTH(p_tag_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_tag_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO event_tags (event_id, tag_id, created_at)
        VALUES (p_event_id,
                JSON_EXTRACT(p_tag_ids, CONCAT('$[',v_i,']')),
                NOW());
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    -- Managers
    SET v_i = 0;
    IF p_manager_ids IS NOT NULL AND JSON_LENGTH(p_manager_ids) > 0 THEN
      SET v_count = JSON_LENGTH(p_manager_ids);
      WHILE v_i < v_count DO
        INSERT IGNORE INTO event_managers (event_id, admin_id, is_primary, assigned_at)
        VALUES (
          p_event_id,
          JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].admin_id')),
          COALESCE(JSON_EXTRACT(p_manager_ids, CONCAT('$[',v_i,'].is_primary')), FALSE),
          NOW()
        );
        SET v_i = v_i + 1;
      END WHILE;
    END IF;

    CALL sp_audit_write(
      'Administrador', p_created_by_admin_id, 'Crear',
      'events', p_event_id, NULL,
      JSON_OBJECT('title', p_title, 'slug', p_slug, 'status', p_status),
      'Event created', NULL
    );
  COMMIT;
END$$

DELIMITER ;
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
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'Próximo'  AND p_new_status COLLATE utf8mb4_unicode_ci IN ('Abierto','Cancelado')  THEN 1
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'Abierto'  AND p_new_status COLLATE utf8mb4_unicode_ci IN ('En_Curso','Cancelado') THEN 1
    WHEN v_current COLLATE utf8mb4_unicode_ci = 'En_Curso' AND p_new_status COLLATE utf8mb4_unicode_ci = 'Finalizado'              THEN 1
    ELSE 0
  END;

  IF v_allowed = 0 THEN
    SET @error_msg = CONCAT('Invalid event transition: ', v_current,' → ',p_new_status);
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = @error_msg;
  END IF;

  START TRANSACTION;
    UPDATE events SET status = p_new_status, updated_at = NOW()
    WHERE id = p_event_id;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Cambio_De_Estado',
      'events', p_event_id,
      JSON_OBJECT('status', v_current),
      JSON_OBJECT('status', p_new_status),
      CONCAT('Event status → ', p_new_status),
      p_ip_address
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_tag_create
-- Creates a new tag. System tags (is_system=TRUE) can only be created at seed time.

DROP PROCEDURE IF EXISTS sp_tag_create;

DELIMITER $$

CREATE PROCEDURE sp_tag_create(
  IN  p_name               VARCHAR(100),
  IN  p_slug               VARCHAR(100),
  IN  p_category           VARCHAR(30),
  IN  p_created_by_admin_id INT UNSIGNED,
  OUT p_tag_id             INT UNSIGNED
)
BEGIN
  IF EXISTS (SELECT 1 FROM tags WHERE slug = p_slug COLLATE utf8mb4_unicode_ci) THEN
    SIGNAL SQLSTATE '45070' SET MESSAGE_TEXT = 'Tag slug already exists';
  END IF;

  INSERT INTO tags (name, slug, category, is_system, created_by_admin_id, created_at)
  VALUES (p_name, p_slug, p_category, FALSE, p_created_by_admin_id, NOW());

  SET p_tag_id = LAST_INSERT_ID();
END$$

DELIMITER ;
-- sp_tag_delete
-- Deletes a tag and removes all junction references. System tags cannot be deleted.

DROP PROCEDURE IF EXISTS sp_tag_delete;

DELIMITER $$

CREATE PROCEDURE sp_tag_delete(IN p_tag_id INT UNSIGNED, IN p_admin_id INT UNSIGNED)
BEGIN
  DECLARE v_is_system BOOLEAN;

  SELECT is_system INTO v_is_system FROM tags WHERE id = p_tag_id;

  IF v_is_system = TRUE THEN
    SIGNAL SQLSTATE '45071' SET MESSAGE_TEXT = 'Cannot delete system-defined tags';
  END IF;

  START TRANSACTION;
    DELETE FROM collaborator_tags WHERE tag_id = p_tag_id;
    DELETE FROM project_tags       WHERE tag_id = p_tag_id;
    DELETE FROM event_tags         WHERE tag_id = p_tag_id;
    DELETE FROM tags               WHERE id     = p_tag_id;

    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Eliminar',
      'tags', p_tag_id,
      NULL, NULL, 'Tag deleted and de-referenced', NULL
    );
  COMMIT;
END$$

DELIMITER ;
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
      'Administrador', p_admin_id, 'Actualizar',
      'home_hero', COALESCE(p_id, LAST_INSERT_ID()),
      NULL, NULL, 'Home hero content updated', NULL
    );
  COMMIT;
END$$

DELIMITER ;
-- sp_content_audit_update
-- Audit-only procedure called after Drizzle ORM update for generic content entities.

DROP PROCEDURE IF EXISTS sp_content_audit_update;

DELIMITER $$

CREATE PROCEDURE sp_content_audit_update(
  IN p_table_name VARCHAR(100),
  IN p_entity_id  INT UNSIGNED,
  IN p_admin_id   INT UNSIGNED
)
BEGIN
  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Actualizar',
    p_table_name, p_entity_id,
    NULL, NULL,
    CONCAT(p_table_name, ' content updated by admin ', p_admin_id),
    NULL
  );
END$$

DELIMITER ;
-- sp_contact_info_list
-- Returns contact info rows, optionally filtering to active only.

DROP PROCEDURE IF EXISTS sp_contact_info_list;

DELIMITER $$

CREATE PROCEDURE sp_contact_info_list(IN p_only_active BOOLEAN)
BEGIN
  IF p_only_active THEN
    SELECT *
    FROM contact_info
    WHERE is_active = TRUE
    ORDER BY id;
  ELSE
    SELECT *
    FROM contact_info
    ORDER BY id;
  END IF;
END$$

DELIMITER ;
-- sp_contact_info_create
-- Creates a contact_info row and writes an audit record.

DROP PROCEDURE IF EXISTS sp_contact_info_create;

DELIMITER $$

CREATE PROCEDURE sp_contact_info_create(
  IN  p_first_name         VARCHAR(100),
  IN  p_middle_name        VARCHAR(100),
  IN  p_last_name          VARCHAR(100),
  IN  p_title_description  VARCHAR(255),
  IN  p_contact_email      VARCHAR(255),
  IN  p_contact_phone      VARCHAR(30),
  IN  p_physical_location  VARCHAR(300),
  IN  p_maps_url           VARCHAR(1000),
  IN  p_cta_headline       VARCHAR(255),
  IN  p_cta_description    TEXT,
  IN  p_is_active          BOOLEAN,
  IN  p_admin_id           INT UNSIGNED,
  OUT p_contact_id         INT UNSIGNED
)
BEGIN
  INSERT INTO contact_info (
    first_name, middle_name, last_name, title_description,
    contact_email, contact_phone, physical_location,
    maps_url, cta_headline, cta_description,
    is_active, updated_by_admin_id, updated_at
  ) VALUES (
    p_first_name, NULLIF(p_middle_name, ''), p_last_name, NULLIF(p_title_description, ''),
    NULLIF(p_contact_email, ''), NULLIF(p_contact_phone, ''), NULLIF(p_physical_location, ''),
    NULLIF(p_maps_url, ''), NULLIF(p_cta_headline, ''), NULLIF(p_cta_description, ''),
    p_is_active, p_admin_id, NOW()
  );

  SET p_contact_id = LAST_INSERT_ID();

  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Crear',
    'contact_info', p_contact_id,
    NULL, NULL, 'Contact info record created', NULL
  );
END$$

DELIMITER ;
-- sp_contact_info_update
-- Updates a contact_info row and writes an audit record.

DROP PROCEDURE IF EXISTS sp_contact_info_update;

DELIMITER $$

CREATE PROCEDURE sp_contact_info_update(
  IN p_contact_id         INT UNSIGNED,
  IN p_first_name         VARCHAR(100),
  IN p_middle_name        VARCHAR(100),
  IN p_last_name          VARCHAR(100),
  IN p_title_description  VARCHAR(255),
  IN p_contact_email      VARCHAR(255),
  IN p_contact_phone      VARCHAR(30),
  IN p_physical_location  VARCHAR(300),
  IN p_maps_url           VARCHAR(1000),
  IN p_cta_headline       VARCHAR(255),
  IN p_cta_description    TEXT,
  IN p_is_active          BOOLEAN,
  IN p_admin_id           INT UNSIGNED
)
BEGIN
  UPDATE contact_info
  SET
    first_name = p_first_name,
    middle_name = NULLIF(p_middle_name, ''),
    last_name = p_last_name,
    title_description = NULLIF(p_title_description, ''),
    contact_email = NULLIF(p_contact_email, ''),
    contact_phone = NULLIF(p_contact_phone, ''),
    physical_location = NULLIF(p_physical_location, ''),
    maps_url = NULLIF(p_maps_url, ''),
    cta_headline = NULLIF(p_cta_headline, ''),
    cta_description = NULLIF(p_cta_description, ''),
    is_active = p_is_active,
    updated_by_admin_id = p_admin_id,
    updated_at = NOW()
  WHERE id = p_contact_id;

  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Actualizar',
    'contact_info', p_contact_id,
    NULL, NULL, 'Contact info record updated', NULL
  );
END$$

DELIMITER ;
-- sp_contact_info_set_active
-- Sets active/inactive state for one contact_info row and writes an audit record.

DROP PROCEDURE IF EXISTS sp_contact_info_set_active;

DELIMITER $$

CREATE PROCEDURE sp_contact_info_set_active(
  IN p_contact_id  INT UNSIGNED,
  IN p_is_active   BOOLEAN,
  IN p_admin_id    INT UNSIGNED
)
BEGIN
  UPDATE contact_info
  SET
    is_active = p_is_active,
    updated_by_admin_id = p_admin_id,
    updated_at = NOW()
  WHERE id = p_contact_id;

  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Cambio_De_Estado',
    'contact_info', p_contact_id,
    NULL, NULL,
    CONCAT('Contact info status updated to ', IF(p_is_active, 'active', 'inactive')),
    NULL
  );
END$$

DELIMITER ;
-- sp_contact_info_delete
-- Deletes one contact_info row and writes an audit record.

DROP PROCEDURE IF EXISTS sp_contact_info_delete;

DELIMITER $$

CREATE PROCEDURE sp_contact_info_delete(
  IN p_contact_id INT UNSIGNED,
  IN p_admin_id   INT UNSIGNED
)
BEGIN
  DELETE FROM contact_info WHERE id = p_contact_id;

  CALL sp_audit_write(
    'Administrador', p_admin_id, 'Eliminar',
    'contact_info', p_contact_id,
    NULL, NULL, 'Contact info record deleted', NULL
  );
END$$

DELIMITER ;
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

      CALL sp_audit_write(
        'Administrador', p_admin_id, 'Actualizar',
        'value_propositions', v_id,
        NULL, JSON_OBJECT('sort_order', v_order),
        'Value proposition reordered', NULL
      );

      SET v_i = v_i + 1;
    END WHILE;
  COMMIT;
END$$

DELIMITER ;
-- sp_participation_step_reorder
-- Updates step_number for multiple participation_steps rows from a JSON array of {id, step_number} pairs.

DROP PROCEDURE IF EXISTS sp_participation_step_reorder;

DELIMITER $$

CREATE PROCEDURE sp_participation_step_reorder(
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
      SET v_order = JSON_EXTRACT(p_order_map, CONCAT('$[',v_i,'].step_number'));
      UPDATE participation_steps
      SET step_number = v_order, updated_at = NOW(), updated_by_admin_id = p_admin_id
      WHERE id = v_id;

      CALL sp_audit_write(
        'Administrador', p_admin_id, 'Actualizar',
        'participation_steps', v_id,
        NULL, JSON_OBJECT('step_number', v_order),
        'Participation step reordered', NULL
      );

      SET v_i = v_i + 1;
    END WHILE;
  COMMIT;
END$$

DELIMITER ;
-- sp_media_register
-- Inserts a media_assets record after file upload to Docker volume.

DROP PROCEDURE IF EXISTS sp_media_register;

DELIMITER $$

CREATE PROCEDURE sp_media_register(
  IN  p_original_filename    VARCHAR(500),
  IN  p_stored_filename      VARCHAR(500),
  IN  p_public_url           VARCHAR(1000),
  IN  p_storage_type         VARCHAR(10),
  IN  p_storage_path         VARCHAR(1000),
  IN  p_mime_type            VARCHAR(100),
  IN  p_file_size_bytes      INT UNSIGNED,
  IN  p_entity_type          VARCHAR(100),
  IN  p_entity_id            INT UNSIGNED,
  IN  p_alt_text             VARCHAR(300),
  IN  p_caption              VARCHAR(500),
  IN  p_uploaded_by_admin_id INT UNSIGNED,
  OUT p_media_id             INT UNSIGNED
)
BEGIN
  INSERT INTO media_assets (
    original_filename, stored_filename, public_url,
    storage_type, storage_path, mime_type, file_size_bytes,
    entity_type, entity_id, alt_text, caption,
    uploaded_by_admin_id, created_at
  ) VALUES (
    p_original_filename, p_stored_filename, p_public_url,
    p_storage_type, p_storage_path, p_mime_type, p_file_size_bytes,
    p_entity_type, p_entity_id, p_alt_text, p_caption,
    p_uploaded_by_admin_id, NOW()
  );
  SET p_media_id = LAST_INSERT_ID();
END$$

DELIMITER ;
-- sp_media_delete
-- Deletes a media_assets record. Rejects deletion if the media URL is still referenced by any content entity.

DROP PROCEDURE IF EXISTS sp_media_delete;

DELIMITER $$

CREATE PROCEDURE sp_media_delete(IN p_media_id INT UNSIGNED, IN p_admin_id INT UNSIGNED)
BEGIN
  DECLARE v_public_url  VARCHAR(1000);
  DECLARE v_in_use      INT DEFAULT 0;

  SELECT public_url INTO v_public_url FROM media_assets WHERE id = p_media_id;

  -- Check usage across content entities
  SELECT (
    (SELECT COUNT(*) FROM projects WHERE header_image_media_asset_id = p_media_id OR video_media_asset_id = p_media_id) +
    (SELECT COUNT(*) FROM events   WHERE banner_media_asset_id = p_media_id
                                      OR video_media_asset_id = p_media_id
                                      OR poster_media_asset_id = p_media_id) +
    (SELECT COUNT(*) FROM home_hero WHERE background_image_url COLLATE utf8mb4_unicode_ci = v_public_url COLLATE utf8mb4_unicode_ci) +
    (SELECT COUNT(*) FROM dlab_identity WHERE image_url COLLATE utf8mb4_unicode_ci = v_public_url COLLATE utf8mb4_unicode_ci) +
    (SELECT COUNT(*) FROM value_propositions WHERE image_url COLLATE utf8mb4_unicode_ci = v_public_url COLLATE utf8mb4_unicode_ci)
  ) INTO v_in_use;

  IF v_in_use > 0 THEN
    SIGNAL SQLSTATE '45080'
      SET MESSAGE_TEXT = 'Media asset is still referenced by content entities';
  END IF;

  START TRANSACTION;
    DELETE FROM media_assets WHERE id = p_media_id;
    CALL sp_audit_write(
      'Administrador', p_admin_id, 'Eliminar',
      'media_assets', p_media_id,
      JSON_OBJECT('public_url', v_public_url),
      NULL, 'Media asset deleted', NULL
    );
  COMMIT;
END$$

DELIMITER ;
-- ============================================================================
-- View: vw_public_projects
-- Description: Projects visible on the public portal. Used by the public 
--              /projects route. Pre-joins tags as a JSON array for 
--              single-query card rendering.
-- ============================================================================

CREATE OR REPLACE VIEW vw_public_projects AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.short_description,
  p.full_description,
  p.target_audience,
  p.required_skills,
  p.participation_mode,
  p.header_image_media_asset_id,
  p.video_media_asset_id,
  (SELECT ma.public_url FROM media_assets ma WHERE ma.id = p.header_image_media_asset_id) AS header_image_url,
  (SELECT mv.public_url FROM media_assets mv WHERE mv.id = p.video_media_asset_id) AS video_url,
  p.status,
  p.is_highlighted,
  p.max_collaborators,
  p.current_collaborator_count,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug, 'category', t.category, 'is_system', t.is_system)
    )
    FROM project_tags pt
    JOIN tags t ON t.id = pt.tag_id
    WHERE pt.project_id = p.id
  ) AS tags,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', prs.id,
        'name', prs.name,
        'slug', prs.slug
      )
    )
    FROM project_required_skills prs
    WHERE prs.project_id = p.id
  ) AS required_skill_items,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', pmd.id,
        'day_of_week', pmd.day_of_week,
        'start_time', DATE_FORMAT(pmd.start_time, '%H:%i'),
        'end_time', DATE_FORMAT(pmd.end_time, '%H:%i'),
        'notes', pmd.notes
      )
    )
    FROM project_meeting_days pmd
    WHERE pmd.project_id = p.id
  ) AS meeting_days,
  (
    SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, pmd.start_time, pmd.end_time)), 0)
    FROM project_meeting_days pmd
    WHERE pmd.project_id = p.id
  ) AS weekly_duration_minutes,
  (
    SELECT GROUP_CONCAT(
      DISTINCT CONCAT(
        pmd.day_of_week, ' ',
        TIME_FORMAT(pmd.start_time, '%H:%i'), '-',
        TIME_FORMAT(pmd.end_time, '%H:%i'),
        COALESCE(CONCAT(' (', pmd.notes, ')'), '')
      )
      ORDER BY pmd.day_of_week, pmd.start_time SEPARATOR ', '
    )
    FROM project_meeting_days pmd
    WHERE pmd.project_id = p.id
  ) AS meeting_days_summary
FROM projects p
WHERE p.is_visible = TRUE
  AND p.status COLLATE utf8mb4_unicode_ci NOT IN ('Archivado');
-- ============================================================================
-- View: vw_public_events
-- Description: Public-facing events with tags aggregated.
-- ============================================================================

CREATE OR REPLACE VIEW vw_public_events AS
SELECT
  e.id,
  e.title,
  e.slug,
  e.type,
  e.short_description,
  e.full_description,
  e.target_audience,
  e.location,
  e.event_date,
  e.event_end_date,
  e.registration_deadline,
  e.capacity,
  e.banner_media_asset_id,
  e.video_media_asset_id,
  e.poster_media_asset_id,
  (SELECT ma.public_url FROM media_assets ma WHERE ma.id = e.banner_media_asset_id) AS banner_image_url,
  (SELECT mv.public_url FROM media_assets mv WHERE mv.id = e.video_media_asset_id) AS video_url,
  (SELECT mp.public_url FROM media_assets mp WHERE mp.id = e.poster_media_asset_id) AS poster_image_url,
  e.registration_url,
  e.status,
  e.is_highlighted,
  JSON_ARRAYAGG(
    IF(t.id IS NOT NULL,
       JSON_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug),
       NULL)
  ) AS tags
FROM events e
LEFT JOIN event_tags et ON et.event_id = e.id
LEFT JOIN tags t        ON t.id = et.tag_id
WHERE e.is_visible = TRUE
  AND e.status COLLATE utf8mb4_unicode_ci NOT IN ('Cancelado')
GROUP BY e.id;
-- ============================================================================
-- View: vw_admin_collaborators
-- Description: Full collaborator list for admin panel with tag list and
--              active assignment count pre-computed.
-- ============================================================================

CREATE OR REPLACE VIEW vw_admin_collaborators AS
SELECT
  c.id,
  c.first_name,
  c.middle_name,
  c.last_name,
  c.second_last_name,
  c.personal_email,
  c.usfq_email,
  c.phone_number,
  c.date_of_birth,
  c.major,
  c.current_university_year,
  c.expected_graduation_year,
  c.experience_description,
  c.motivation_description,
  c.interest_in_machinery,
  c.interest_in_design,
  c.interest_in_materials,
  c.trajectory_status,
  c.is_active,
  c.profile_complete,
  c.intake_source,
  c.created_at,
  c.updated_at,
  (SELECT COUNT(*) FROM assignments a
   WHERE a.collaborator_id = c.id AND a.status COLLATE utf8mb4_unicode_ci = 'Activo') AS active_assignment_count,
  (SELECT COUNT(*) FROM applications ap
   WHERE ap.collaborator_id = c.id
     AND ap.status COLLATE utf8mb4_unicode_ci = 'Pendiente')                           AS pending_application_count,
  JSON_ARRAYAGG(
    IF(t.id IS NOT NULL,
       JSON_OBJECT('id', t.id, 'name', t.name, 'category', t.category),
       NULL)
  ) AS tags
FROM collaborators c
LEFT JOIN collaborator_tags ct ON ct.collaborator_id = c.id
LEFT JOIN tags t               ON t.id = ct.tag_id
GROUP BY c.id;
-- ============================================================================
-- View: vw_collaborator_match_score
-- Description: Matching view: for each (collaborator, project) pair computes
--              a tag_overlap_count (shared tags) and a schedule_overlap flag
--              (TRUE if at least one availability_slot overlaps a 
--              project_meeting_day). Used by the admin linkage suggestion 
--              feature.
-- ============================================================================

CREATE OR REPLACE VIEW vw_collaborator_match_score AS
SELECT
  c.id                        AS collaborator_id,
  p.id                        AS project_id,
  p.title                     AS project_title,
  c.trajectory_status,
  COUNT(DISTINCT shared.id) AS tag_overlap_count,
  MAX(
    CASE WHEN asl.day_of_week IS NOT NULL
              AND pmd.day_of_week IS NOT NULL
         THEN 1 ELSE 0 END
  )                            AS has_schedule_overlap
FROM collaborators c
CROSS JOIN projects p
LEFT JOIN collaborator_tags ct    ON ct.collaborator_id = c.id
LEFT JOIN project_tags      ptag  ON ptag.project_id    = p.id
           AND ptag.tag_id = ct.tag_id
LEFT JOIN tags shared             ON shared.id = ct.tag_id
           AND shared.id = ptag.tag_id
LEFT JOIN availability_slots asl  ON asl.collaborator_id = c.id
LEFT JOIN project_meeting_days pmd ON pmd.project_id = p.id
           AND pmd.day_of_week = asl.day_of_week
WHERE p.is_visible = TRUE
  AND p.status COLLATE utf8mb4_unicode_ci = 'Activo'
GROUP BY c.id, p.id;

-- =============================================================================
-- PLACEHOLDER DATA BOOTSTRAP (FILL BEFORE DEPLOY)
-- =============================================================================

INSERT INTO administrators (
  id, first_name, middle_name, last_name, second_last_name,
  personal_email, usfq_email, phone_number, date_of_birth,
  password_hash, is_active
) VALUES
  (1, 'Santiago', 'Francisco', 'Arellano', 'Jaramillo',
   'sanfranmillo@outlook.com', 'sarellanoj@estud.usfq.edu.ec', '+593988123456', '2002-03-21',
   '$2b$12$x.maYYi/yxqWyrqTeWqTM.DrAho4eQYtSbGlHqGbU4IHzpXAlsPMa', TRUE)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  middle_name = VALUES(middle_name),
  last_name = VALUES(last_name),
  second_last_name = VALUES(second_last_name),
  personal_email = VALUES(personal_email),
  usfq_email = VALUES(usfq_email),
  phone_number = VALUES(phone_number),
  date_of_birth = VALUES(date_of_birth),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active);

INSERT INTO collaborators (
  id, first_name, middle_name, last_name, second_last_name,
  personal_email, usfq_email, phone_number, date_of_birth,
  password_hash, major, current_university_year, expected_graduation_year,
  experience_description, motivation_description,
  interest_in_machinery, interest_in_design, interest_in_materials,
  trajectory_status, is_active, profile_complete, intake_source
) VALUES
  (1, 'Santiago', 'Francisco', 'Arellano', 'Jaramillo',
   'sanfranmillo@outlook.com', 'sarellanoj@estud.usfq.edu.ec', '+593988123456', '2002-03-21',
   '$2b$12$x.maYYi/yxqWyrqTeWqTM.DrAho4eQYtSbGlHqGbU4IHzpXAlsPMa', 'Ingeniería en Software', 4, 2027,
   'Ha colaborado en proyectos de automatización y herramientas web internas.', 'Busca aportar en iniciativas multidisciplinarias y fortalecer su experiencia en investigación aplicada.',
   TRUE, TRUE, FALSE,
   'Contactado', TRUE, TRUE, 'manual_seed')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  middle_name = VALUES(middle_name),
  last_name = VALUES(last_name),
  second_last_name = VALUES(second_last_name),
  personal_email = VALUES(personal_email),
  usfq_email = VALUES(usfq_email),
  phone_number = VALUES(phone_number),
  date_of_birth = VALUES(date_of_birth),
  password_hash = VALUES(password_hash),
  major = VALUES(major),
  current_university_year = VALUES(current_university_year),
  expected_graduation_year = VALUES(expected_graduation_year),
  experience_description = VALUES(experience_description),
  motivation_description = VALUES(motivation_description),
  interest_in_machinery = VALUES(interest_in_machinery),
  interest_in_design = VALUES(interest_in_design),
  interest_in_materials = VALUES(interest_in_materials),
  trajectory_status = VALUES(trajectory_status),
  is_active = VALUES(is_active),
  profile_complete = VALUES(profile_complete),
  intake_source = VALUES(intake_source);

INSERT INTO projects (
  id, title, slug, short_description, full_description,
  target_audience, required_skills, participation_mode,
  header_image_media_asset_id, video_media_asset_id,
  status, is_highlighted, is_visible,
  max_collaborators, current_collaborator_count,
  created_by_admin_id
) VALUES
  (1, 'FILL_PROJECT_TITLE_1', 'fill-project-slug-1', 'FILL_PROJECT_SHORT_DESCRIPTION_1', 'FILL_PROJECT_FULL_DESCRIPTION_1',
   'FILL_PROJECT_TARGET_AUDIENCE_1', 'FILL_PROJECT_REQUIRED_SKILLS_1', 'Presencial',
   NULL, NULL,
   'Activo', TRUE, TRUE,
   15, 0,
   1),
  (2, 'FILL_PROJECT_TITLE_2', 'fill-project-slug-2', 'FILL_PROJECT_SHORT_DESCRIPTION_2', 'FILL_PROJECT_FULL_DESCRIPTION_2',
   'FILL_PROJECT_TARGET_AUDIENCE_2', 'FILL_PROJECT_REQUIRED_SKILLS_2', 'Híbrido',
   NULL, NULL,
   'Próximo', FALSE, TRUE,
   20, 0,
   1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  short_description = VALUES(short_description),
  full_description = VALUES(full_description),
  status = VALUES(status);

INSERT INTO project_meeting_days (
  id, project_id, day_of_week, start_time, end_time, notes
) VALUES
  (1, 1, 'Lunes', '09:00:00', '11:00:00', 'FILL_PROJECT_1_MEETING_NOTES'),
  (2, 1, 'Miércoles', '14:00:00', '16:00:00', 'FILL_PROJECT_1_MEETING_NOTES_2'),
  (3, 2, 'Martes', '10:00:00', '12:00:00', 'FILL_PROJECT_2_MEETING_NOTES')
ON DUPLICATE KEY UPDATE
  day_of_week = VALUES(day_of_week),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  notes = VALUES(notes);

INSERT INTO project_tags (project_id, tag_id)
SELECT seed.project_id, t.id
FROM (
  SELECT 1 AS project_id, 'Diseño' AS tag_slug
  UNION ALL
  SELECT 1 AS project_id, 'Materiales' AS tag_slug
  UNION ALL
  SELECT 2 AS project_id, 'Maquinaria' AS tag_slug
) seed
JOIN tags t ON t.slug = seed.tag_slug
ON DUPLICATE KEY UPDATE
  tag_id = VALUES(tag_id);

DELETE FROM tags
WHERE is_system = FALSE
  AND slug LIKE 'fill-tag-%'
  AND NOT EXISTS (SELECT 1 FROM collaborator_tags WHERE tag_id = tags.id)
  AND NOT EXISTS (SELECT 1 FROM project_tags WHERE tag_id = tags.id)
  AND NOT EXISTS (SELECT 1 FROM event_tags WHERE tag_id = tags.id);

INSERT INTO project_managers (
  id, project_id, admin_id, is_primary
) VALUES
  (1, 1, 1, TRUE),
  (2, 2, 1, TRUE)
ON DUPLICATE KEY UPDATE
  project_id = VALUES(project_id),
  admin_id = VALUES(admin_id),
  is_primary = VALUES(is_primary);

INSERT INTO events (
  id, title, slug, type,
  short_description, full_description,
  target_audience, location,
  event_date, event_end_date, registration_deadline,
  capacity, banner_media_asset_id, video_media_asset_id, poster_media_asset_id, registration_url,
  status, is_highlighted, is_visible,
  created_by_admin_id
) VALUES
  (1, 'FILL_EVENT_TITLE_1', 'fill-event-slug-1', 'Taller',
   'FILL_EVENT_SHORT_DESCRIPTION_1', 'FILL_EVENT_FULL_DESCRIPTION_1',
   'FILL_EVENT_TARGET_AUDIENCE_1', 'FILL_EVENT_LOCATION_1',
   '2026-09-01 10:00:00', '2026-09-01 12:00:00', '2026-08-25 23:59:59',
   50, NULL, NULL, NULL, 'https://example.com/fill-registration-url-1',
   'Abierto', TRUE, TRUE,
   1),
  (2, 'FILL_EVENT_TITLE_2', 'fill-event-slug-2', 'Charla',
   'FILL_EVENT_SHORT_DESCRIPTION_2', 'FILL_EVENT_FULL_DESCRIPTION_2',
   'FILL_EVENT_TARGET_AUDIENCE_2', 'FILL_EVENT_LOCATION_2',
   '2026-10-15 17:00:00', '2026-10-15 19:00:00', '2026-10-10 23:59:59',
   100, NULL, NULL, NULL, 'https://example.com/fill-registration-url-2',
   'Próximo', FALSE, TRUE,
   1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  short_description = VALUES(short_description),
  full_description = VALUES(full_description),
  status = VALUES(status);

INSERT INTO event_managers (
  id, event_id, admin_id, is_primary
) VALUES
  (1, 1, 1, TRUE),
  (2, 2, 1, TRUE)
ON DUPLICATE KEY UPDATE
  event_id = VALUES(event_id),
  admin_id = VALUES(admin_id),
  is_primary = VALUES(is_primary);

INSERT INTO availability_slots (
  id, collaborator_id, day_of_week, time_from, time_to, notes
) VALUES
  (1, 1, 'Lunes', '09:00', '12:00:00', 'FILL_AVAILABILITY_NOTES_1'),
  (2, 1, 'Miércoles', '10:00', '17:00:00', 'FILL_AVAILABILITY_NOTES_2')
ON DUPLICATE KEY UPDATE
  day_of_week = VALUES(day_of_week),
  time_from = VALUES(time_from),
  time_to = VALUES(time_to),
  notes = VALUES(notes);

INSERT INTO applications (
  id, collaborator_id, project_id, reason_for_applying,
  status, reviewed_at, approved_at, rejected_at,
  approver_admin_id, admin_notes
) VALUES
  (1, 1, 1, 'FILL_APPLICATION_REASON_1',
   'En_Revisión', NOW(), NULL, NULL,
   1, 'FILL_APPLICATION_ADMIN_NOTES_1')
ON DUPLICATE KEY UPDATE
  reason_for_applying = VALUES(reason_for_applying),
  status = VALUES(status),
  admin_notes = VALUES(admin_notes);

INSERT INTO assignments (
  collaborator_id, project_id, application_id,
  assigned_by_admin_id, role_in_project,
  assigned_at, ended_at, end_reason, status
) VALUES
  (1, 1, 1,
   1, 'FILL_ASSIGNMENT_ROLE_1',
   NOW(), NULL, NULL, 'Activo')
ON DUPLICATE KEY UPDATE
  role_in_project = VALUES(role_in_project),
  status = VALUES(status);

INSERT INTO home_hero (
  id, headline, subheadline,
  primary_cta_label, primary_cta_url,
  secondary_cta_label, secondary_cta_url,
  background_image_url, is_active, updated_by_admin_id
) VALUES
  (1, 'FILL_HOME_HERO_HEADLINE', 'FILL_HOME_HERO_SUBHEADLINE',
   'FILL_HOME_PRIMARY_CTA_LABEL', '/signup',
   'FILL_HOME_SECONDARY_CTA_LABEL', '/projects',
   NULL, TRUE, 1)
ON DUPLICATE KEY UPDATE
  headline = VALUES(headline),
  subheadline = VALUES(subheadline),
  primary_cta_label = VALUES(primary_cta_label),
  primary_cta_url = VALUES(primary_cta_url),
  secondary_cta_label = VALUES(secondary_cta_label),
  secondary_cta_url = VALUES(secondary_cta_url),
  background_image_url = VALUES(background_image_url),
  is_active = VALUES(is_active),
  updated_by_admin_id = VALUES(updated_by_admin_id);

INSERT INTO dlab_identity (
  id, title, body, mission_title, mission_body, vision_title, vision_body,
  image_url, video_url, is_active, updated_by_admin_id
) VALUES
  (
    1,
    'FILL_DLAB_IDENTITY_TITLE',
    'FILL_DLAB_IDENTITY_BODY',
    'FILL_MISSION_TITLE',
    'FILL_MISSION_BODY',
    'FILL_VISION_TITLE',
    'FILL_VISION_BODY',
    NULL,
    NULL,
    TRUE,
    1
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  body = VALUES(body),
  mission_title = VALUES(mission_title),
  mission_body = VALUES(mission_body),
  vision_title = VALUES(vision_title),
  vision_body = VALUES(vision_body),
  image_url = VALUES(image_url),
  video_url = VALUES(video_url),
  is_active = VALUES(is_active),
  updated_by_admin_id = VALUES(updated_by_admin_id);

INSERT INTO value_propositions (
  id, title, description, icon_identifier, image_url,
  target_audience, sort_order, is_visible, updated_by_admin_id
) VALUES
  (1, 'FILL_VALUE_PROP_TITLE_1', 'FILL_VALUE_PROP_DESCRIPTION_1', 'sparkles', NULL,
   'FILL_VALUE_PROP_AUDIENCE_1', 1, TRUE, 1),
  (2, 'FILL_VALUE_PROP_TITLE_2', 'FILL_VALUE_PROP_DESCRIPTION_2', 'lightbulb', NULL,
   'FILL_VALUE_PROP_AUDIENCE_2', 2, TRUE, 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  sort_order = VALUES(sort_order),
  is_visible = VALUES(is_visible),
  updated_by_admin_id = VALUES(updated_by_admin_id);

INSERT INTO participation_steps (
  id, step_number, title, description, icon_identifier, is_visible, updated_by_admin_id
) VALUES
  (1, 1, 'Crea tu cuenta de usuario de D.Lab y espera por tu aprobación como usuario', 'Para aplicar a los proyectos activos, debes tener una cuenta valida como colaborador del D.Lab. Ház clic en el botón de unirse, llena el formulario con tu información y espera a que tu cuenta sea validada y aprobada.', 'file-text', TRUE, 1),
  (2, 2, 'Revisa el registro de proyectos y sus horarios de trabajo', 'Ingresa al apartado de proyectos y revisa aquellos proyectos que te parezcan interesantes. Revisa que el horario de trabajo sea factible y que el tema sea interesante para tí. Recuerda que es importante que no solo quieras aportar, sino que te diviertas y aprendas motivado al mismo tiempo.', 'users', TRUE, 1),
  (3, 3, 'Envía una solicitud de asociación al proyecto', 'Una vez seleccionaste el proyecto, registra tu deseo de participar con una solicitud de asociación al proyecto, esto les informará a los responsables del proyecto que quieres participar, y luego de revisar tu factibilidad en el proyecto serás asociado.', 'rocket', TRUE, 1),
  (4,3, 'Aporta al proyecto', 'Una vez te hayan asociado al proyecto, acercate al D.Lab en sus laboratorios a la hora registrada para que seas participe del proyecto', 'rocket', TRUE, 1)
ON DUPLICATE KEY UPDATE
  step_number = VALUES(step_number),
  title = VALUES(title),
  description = VALUES(description),
  is_visible = VALUES(is_visible),
  updated_by_admin_id = VALUES(updated_by_admin_id);

INSERT INTO contact_info (
  id, first_name, middle_name, last_name, title_description,
  contact_email, contact_phone, physical_location,
  maps_url, cta_headline, cta_description,
  is_active, updated_by_admin_id
) VALUES
  (1, 'Cristina', NULL, 'Muñoz', 'Profesora Colegio de Comunicación y Artes Contemporáneas / Directora D.Lab USFQ',
   'mmunoz@usfq.edu.ec', '(+593 2) 297-1700 1567', 'Oficina Edificio Maxwell, M-113',
   'https://maps.google.com/?q=Oficina+Edificio+Maxwell+M-113',
   'Disponibilidad', 'Cada día',
   TRUE, 1)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  middle_name = VALUES(middle_name),
  last_name = VALUES(last_name),
  title_description = VALUES(title_description),
  contact_email = VALUES(contact_email),
  contact_phone = VALUES(contact_phone),
  physical_location = VALUES(physical_location),
  maps_url = VALUES(maps_url),
  cta_headline = VALUES(cta_headline),
  cta_description = VALUES(cta_description),
  is_active = VALUES(is_active),
  updated_by_admin_id = VALUES(updated_by_admin_id);

INSERT INTO social_links (
  id, platform, url, icon_identifier, sort_order, is_visible, updated_by_admin_id
) VALUES
  (1, 'instagram', 'https://www.instagram.com/dlab.usfq/', 'instagram', 1, TRUE, 1),
  (2, 'usfq', 'https://www.usfq.edu.ec/es/oficina-de-innovacion-y-sostenibilidad-ois/living-lab', 'usfq', 2, TRUE, 1)
ON DUPLICATE KEY UPDATE
  platform = VALUES(platform),
  url = VALUES(url),
  icon_identifier = VALUES(icon_identifier),
  sort_order = VALUES(sort_order),
  is_visible = VALUES(is_visible),
  updated_by_admin_id = VALUES(updated_by_admin_id);
