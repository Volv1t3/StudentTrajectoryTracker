# DLAB — Domain Model Definition
## Plataforma de Gestión de la Trayectoria Estudiantil

> **Version:** 1.0  
> **Date:** 2026-06-09  
> **Purpose:** Define all domain entities, their attributes, and relationships for use in ER diagram construction and system implementation.  
> **Methodology:** Model-Driven Systems Engineering (MDSE) — entities defined before implementation.

---

## Table of Contents

1. [Domain Overview](#1-domain-overview)
2. [Entity Groups](#2-entity-groups)
3. [Core User Entities](#3-core-user-entities)
4. [Authentication & Security Entities](#4-authentication--security-entities)
5. [Operational Domain Entities](#5-operational-domain-entities)
6. [Relationship / Junction Entities](#6-relationship--junction-entities)
7. [Content Management Entities](#7-content-management-entities)
8. [Media & Asset Entities](#8-media--asset-entities)
9. [Audit & System Entities](#9-audit--system-entities)
10. [Relationships Summary](#10-relationships-summary)
11. [Enumerated Types (ENUMs)](#11-enumerated-types-enums)
12. [Design Notes & Constraints](#12-design-notes--constraints)

---

## 1. Domain Overview

The DLAB platform manages the full student trajectory lifecycle:

```
Visitor → Interest Form → Collaborator → Application → Assignment → Active Member
```

The system serves two user types:
- **Collaborators** — students who have submitted the interest form and registered.
- **Administrators** — DLAB staff who manage projects, events, assignments and content.

Visitors (anonymous users browsing the public portal) are **not stored** as entities. Their behavioral data flows only to PostHog analytics.

---

## 2. Entity Groups

| Group | Purpose |
|---|---|
| **Core Users** | `administrators`, `collaborators` |
| **Auth & Security** | `refresh_tokens` |
| **Operational Domain** | `projects`, `events`, `tags`, `availability_slots`, `project_meeting_days` |
| **Relationships** | `applications`, `assignments`, `project_managers`, `event_managers`, `collaborator_tags`, `project_tags`, `event_tags` |
| **Content Management** | `home_hero`, `dlab_identity`, `value_propositions`, `participation_steps`, `contact_info`, `social_links` |
| **Media & Assets** | `media_assets` |
| **Audit & System** | `audit_log` |

---

## 3. Core User Entities

### 3.1 `administrators`

Represents DLAB staff members with backend access and CRUD permissions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `first_name` | `VARCHAR(100)` | NOT NULL | First name |
| `middle_name` | `VARCHAR(100)` | NULL | Middle name (optional) |
| `last_name` | `VARCHAR(100)` | NOT NULL | Last name (apellido paterno) |
| `second_last_name` | `VARCHAR(100)` | NULL | Second last name (optional) |
| `personal_email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Personal email address |
| `usfq_email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Institutional USFQ email |
| `phone_number` | `VARCHAR(20)` | NULL | Phone number (optional) |
| `date_of_birth` | `DATE` | NULL | Date of birth |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password (bcrypt) |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Whether account is active |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update timestamp |

**Notes:**
- Administrators have full CRUD on Projects, Events, and Assignments.
- An administrator may be assigned as `project_manager` of one or more projects.
- An administrator may be assigned as `event_manager` of one or more events.

---

### 3.2 `collaborators`

Represents students who have submitted the interest form and whose profile is registered in the system. These are the core subjects of the student trajectory model.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `first_name` | `VARCHAR(100)` | NOT NULL | First name |
| `middle_name` | `VARCHAR(100)` | NULL | Middle name (optional) |
| `last_name` | `VARCHAR(100)` | NOT NULL | Last last name |
| `second_last_name` | `VARCHAR(100)` | NULL | Second last name (optional) |
| `personal_email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Personal email address |
| `usfq_email` | `VARCHAR(255)` | NULL, UNIQUE | USFQ institutional email (optional at intake) |
| `phone_number` | `VARCHAR(20)` | NULL | Phone number (optional) |
| `date_of_birth` | `DATE` | NULL | Date of birth |
| `password_hash` | `VARCHAR(255)` | NULL | Hashed password — NULL until account is activated |
| `major` | `VARCHAR(150)` | NOT NULL | Declared major / career |
| `current_university_year` | `TINYINT UNSIGNED` | NOT NULL | Current year in university (1–6) |
| `expected_graduation_year` | `YEAR` | NOT NULL | Expected graduation year (e.g. 2027) |
| `experience_description` | `TEXT` | NULL | Free-text description of prior experience |
| `motivation_description` | `TEXT` | NULL | Free-text motivation for joining DLAB |
| `interest_in_training` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Interested in workshops/training |
| `interest_in_research` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Interested in research |
| `interest_in_fabrication` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Interested in fabrication/design |
| `trajectory_status` | `ENUM` | NOT NULL, DEFAULT 'nuevo' | Current status in the participation funnel |
| `profile_complete` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether all key fields are filled |
| `intake_source` | `VARCHAR(100)` | NULL | How they found DLAB (form, event, referral...) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update timestamp |

**`trajectory_status` ENUM values:**
- `nuevo` — Registered, not yet reviewed
- `en_revision` — Under internal review
- `contactado` — Contacted by admin
- `vinculado` — Assigned to at least one project
- `inactivo` — No longer active

**Notes:**
- A collaborator can have multiple `availability_slots`.
- A collaborator can have multiple `tags` (interests) via `collaborator_tags`.
- A collaborator can submit multiple `applications`.
- A collaborator can be in multiple `assignments` (different projects).

---

## 4. Authentication & Security Entities

### 4.1 `refresh_tokens`

Stores valid refresh tokens for both collaborators and administrators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `user_type` | `ENUM('administrator','collaborator')` | NOT NULL | Which user type owns this token |
| `user_id` | `INT UNSIGNED` | NOT NULL | FK to the owning user (polymorphic) |
| `token_hash` | `VARCHAR(255)` | NOT NULL, UNIQUE | Hashed refresh token value |
| `expires_at` | `TIMESTAMP` | NOT NULL | Token expiration datetime |
| `is_revoked` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether token has been revoked |
| `issued_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Token creation timestamp |
| `user_agent` | `VARCHAR(512)` | NULL | Browser/device user agent for context |
| `ip_address` | `VARCHAR(45)` | NULL | IP at time of issuance |

**Notes:**
- JWT access tokens are short-lived and stateless (not stored).
- Refresh tokens are stored here to enable revocation and rotation.
- `user_type` + `user_id` forms a polymorphic reference to either `administrators` or `collaborators`.

---

## 5. Operational Domain Entities

### 5.1 `tags`

Shared taxonomy of interest/skill tags used by both collaborators (interests) and projects (matching criteria). Tags are shared across the system.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Tag display name |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | URL-safe slug (e.g. `materials`, `machinery`) |
| `category` | `ENUM` | NOT NULL, DEFAULT 'general' | Tag category grouping |
| `is_system` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | TRUE = system-defined; FALSE = user-created |
| `created_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Admin who created the tag (if admin-created) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Creation timestamp |

**`category` ENUM values:**
- `materials` — Materials-related work
- `machinery` — Machinery and fabrication
- `design` — Design and creative
- `software` — Software and development
- `research` — Research and academic work
- `general` — General or uncategorized

**Default system tags:**
- `Materials` (system, category: materials)
- `Machinery` (system, category: machinery)
- `Design` (system, category: design)

**Notes:**
- Both collaborators and projects reference tags via junction tables.
- Admins or collaborators can create custom tags (is_system = FALSE).

---

### 5.2 `projects`

Core domain entity. Represents active, completed, or upcoming DLAB projects visible publicly and internally.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `title` | `VARCHAR(255)` | NOT NULL | Project title |
| `slug` | `VARCHAR(255)` | NOT NULL, UNIQUE | URL-safe slug for routing |
| `short_description` | `VARCHAR(500)` | NOT NULL | Brief 1-2 sentence description (card preview) |
| `full_description` | `TEXT` | NOT NULL | Full detailed description (project page) |
| `target_audience` | `VARCHAR(300)` | NULL | Who this project is for |
| `required_skills` | `TEXT` | NULL | Free-text description of skills/background needed |
| `participation_mode` | `VARCHAR(200)` | NULL | How students participate (presencial, híbrido, remoto) |
| `header_image_url` | `VARCHAR(1000)` | NULL | URL to header image (local volume or cloud storage) |
| `video_url` | `VARCHAR(1000)` | NULL | URL to project description video |
| `status` | `ENUM` | NOT NULL, DEFAULT 'activo' | Current project status |
| `is_highlighted` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether to feature on homepage/projects listing |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Whether project is publicly visible |
| `max_collaborators` | `SMALLINT UNSIGNED` | NULL | Maximum collaborators allowed (NULL = no limit) |
| `current_collaborator_count` | `SMALLINT UNSIGNED` | NOT NULL, DEFAULT 0 | Cached count of active assignments |
| `created_by_admin_id` | `INT UNSIGNED` | NOT NULL, FK → administrators.id | Admin who created the project record |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update timestamp |

**`status` ENUM values:**
- `activo` — Currently active and open for applications
- `en_pausa` — Temporarily paused
- `completado` — Finished project
- `archivado` — Archived, not shown publicly
- `proximo` — Upcoming, not yet open

**Notes:**
- Projects reference tags via `project_tags` junction.
- Projects reference admins as managers via `project_managers`.
- Projects receive applications via `applications`.
- Projects have confirmed collaborators via `assignments`.
- Projects define meeting days via `project_meeting_days`.

---

### 5.3 `project_meeting_days`

Stores which days of the week a project holds its regular sessions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `project_id` | `INT UNSIGNED` | NOT NULL, FK → projects.id | Owning project |
| `day_of_week` | `ENUM` | NOT NULL | Day of the week |
| `notes` | `VARCHAR(300)` | NULL | Optional notes (e.g. "biweekly", "after 14:00") |

**`day_of_week` ENUM values:**
- `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo`

---

### 5.4 `events`

Represents workshops, open calls, talks, and other time-bound activities organized by DLAB.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `title` | `VARCHAR(255)` | NOT NULL | Event title |
| `slug` | `VARCHAR(255)` | NOT NULL, UNIQUE | URL-safe slug for routing |
| `type` | `ENUM` | NOT NULL | Type of event |
| `short_description` | `VARCHAR(500)` | NOT NULL | Brief description (card/listing view) |
| `full_description` | `TEXT` | NOT NULL | Full description (event detail page) |
| `target_audience` | `VARCHAR(300)` | NULL | Who this event is for |
| `location` | `VARCHAR(300)` | NULL | Physical or virtual location |
| `event_date` | `DATETIME` | NULL | Main event date and time |
| `event_end_date` | `DATETIME` | NULL | End date/time (for multi-day events) |
| `registration_deadline` | `DATETIME` | NULL | Deadline to register or apply |
| `capacity` | `SMALLINT UNSIGNED` | NULL | Maximum participants (NULL = no limit) |
| `header_image_url` | `VARCHAR(1000)` | NULL | URL to header image |
| `banner_image_url` | `VARCHAR(1000)` | NULL | Optional secondary/banner image |
| `registration_url` | `VARCHAR(1000)` | NULL | External registration link (if applicable) |
| `status` | `ENUM` | NOT NULL, DEFAULT 'proximo' | Event status |
| `is_highlighted` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Feature on homepage |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Publicly visible |
| `created_by_admin_id` | `INT UNSIGNED` | NOT NULL, FK → administrators.id | Admin who created the event |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update timestamp |

**`type` ENUM values:**
- `taller` — Workshop / skill training session
- `charla` — Talk or presentation
- `convocatoria` — Open call / application period
- `hackathon` — Hackathon or intensive sprint
- `demo_day` — Demo or showcase event
- `visita` — Lab visit or open house
- `otro` — Other

**`status` ENUM values:**
- `proximo` — Upcoming, not yet open
- `abierto` — Open for registration
- `en_curso` — Currently happening
- `finalizado` — Event completed
- `cancelado` — Cancelled

---

### 5.5 `availability_slots`

Stores a collaborator's declared days and time windows of availability for project participation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `collaborator_id` | `INT UNSIGNED` | NOT NULL, FK → collaborators.id | Owning collaborator |
| `day_of_week` | `ENUM` | NOT NULL | Day of the week |
| `time_from` | `TIME` | NOT NULL | Start of available window |
| `time_to` | `TIME` | NOT NULL | End of available window |
| `notes` | `VARCHAR(200)` | NULL | Optional notes |

**`day_of_week` ENUM values:**
- `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado`, `domingo`

---

## 6. Relationship / Junction Entities

### 6.1 `applications`

Created when a collaborator formally applies to join a project. Tracks the full application lifecycle.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `collaborator_id` | `INT UNSIGNED` | NOT NULL, FK → collaborators.id | Applicant |
| `project_id` | `INT UNSIGNED` | NOT NULL, FK → projects.id | Target project |
| `reason_for_applying` | `TEXT` | NOT NULL | Collaborator's stated reason for applying |
| `status` | `ENUM` | NOT NULL, DEFAULT 'pendiente' | Application status |
| `applied_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Application submission timestamp |
| `reviewed_at` | `TIMESTAMP` | NULL | When application was reviewed |
| `approved_at` | `TIMESTAMP` | NULL | When application was approved |
| `rejected_at` | `TIMESTAMP` | NULL | When application was rejected |
| `approver_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Admin who approved or rejected |
| `admin_notes` | `TEXT` | NULL | Internal admin notes on this application |
| `UNIQUE` | — | `(collaborator_id, project_id)` | One active application per collaborator per project |

**`status` ENUM values:**
- `pendiente` — Submitted, awaiting review
- `en_revision` — Under active review
- `aprobada` — Approved, pending assignment creation
- `rechazada` — Rejected
- `retirada` — Withdrawn by collaborator

---

### 6.2 `assignments`

The confirmed relationship between a collaborator and a project. Created when an application is approved. This is the final state of the trajectory.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `collaborator_id` | `INT UNSIGNED` | NOT NULL, FK → collaborators.id | Assigned collaborator |
| `project_id` | `INT UNSIGNED` | NOT NULL, FK → projects.id | Project assigned to |
| `application_id` | `INT UNSIGNED` | NULL, FK → applications.id | Originating application (if applicable) |
| `assigned_by_admin_id` | `INT UNSIGNED` | NOT NULL, FK → administrators.id | Admin who created the assignment |
| `role_in_project` | `VARCHAR(150)` | NULL | Collaborator's role (e.g. Diseñador, Programador) |
| `assigned_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Assignment creation timestamp |
| `ended_at` | `TIMESTAMP` | NULL | When assignment ended (NULL = still active) |
| `end_reason` | `VARCHAR(300)` | NULL | Reason for ending (graduation, withdrawal, etc.) |
| `status` | `ENUM` | NOT NULL, DEFAULT 'activo' | Current assignment status |
| `UNIQUE` | — | `(collaborator_id, project_id)` — with status check | Prevent duplicate active assignments |

**`status` ENUM values:**
- `activo` — Currently participating
- `pausado` — Temporarily inactive
- `finalizado` — Participation ended normally
- `removido` — Removed by admin

---

### 6.3 `project_managers`

Defines which administrators manage which projects. A project can have multiple managers; an admin can manage multiple projects.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `project_id` | `INT UNSIGNED` | NOT NULL, FK → projects.id | Managed project |
| `admin_id` | `INT UNSIGNED` | NOT NULL, FK → administrators.id | Managing administrator |
| `is_primary` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Whether this is the primary/lead manager |
| `assigned_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | When management was assigned |
| `UNIQUE` | — | `(project_id, admin_id)` | No duplicate manager assignments |

---

### 6.4 `event_managers`

Defines which administrators manage which events.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `event_id` | `INT UNSIGNED` | NOT NULL, FK → events.id | Managed event |
| `admin_id` | `INT UNSIGNED` | NOT NULL, FK → administrators.id | Managing administrator |
| `is_primary` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Primary/lead manager flag |
| `assigned_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Assignment timestamp |
| `UNIQUE` | — | `(event_id, admin_id)` | No duplicate manager assignments |

---

### 6.5 `collaborator_tags`

Many-to-many relationship between collaborators and tags (interest areas).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `collaborator_id` | `INT UNSIGNED` | NOT NULL, FK → collaborators.id | Collaborator |
| `tag_id` | `INT UNSIGNED` | NOT NULL, FK → tags.id | Associated tag |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | When tag was associated |
| `PRIMARY KEY` | — | `(collaborator_id, tag_id)` | Composite PK |

---

### 6.6 `project_tags`

Many-to-many relationship between projects and tags.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `project_id` | `INT UNSIGNED` | NOT NULL, FK → projects.id | Project |
| `tag_id` | `INT UNSIGNED` | NOT NULL, FK → tags.id | Associated tag |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | When tag was associated |
| `PRIMARY KEY` | — | `(project_id, tag_id)` | Composite PK |

---

### 6.7 `event_tags`

Many-to-many relationship between events and tags.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `event_id` | `INT UNSIGNED` | NOT NULL, FK → events.id | Event |
| `tag_id` | `INT UNSIGNED` | NOT NULL, FK → tags.id | Associated tag |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | When tag was associated |
| `PRIMARY KEY` | — | `(event_id, tag_id)` | Composite PK |

---

## 7. Content Management Entities

These entities store editable content that populates the public-facing pages of the DLAB portal. All are admin-managed via CRUD in the admin panel.

### 7.1 `home_hero`

Content for the hero section of the home/landing page.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `headline` | `VARCHAR(255)` | NOT NULL | Main headline text |
| `subheadline` | `VARCHAR(500)` | NULL | Supporting subtext |
| `primary_cta_label` | `VARCHAR(100)` | NOT NULL | Primary CTA button text (e.g. "Únete al DLAB") |
| `primary_cta_url` | `VARCHAR(500)` | NOT NULL | Primary CTA destination (interest form or anchor) |
| `secondary_cta_label` | `VARCHAR(100)` | NULL | Secondary CTA button text (e.g. "Ver proyectos") |
| `secondary_cta_url` | `VARCHAR(500)` | NULL | Secondary CTA destination |
| `background_image_url` | `VARCHAR(1000)` | NULL | Hero background image URL |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Only one should be active at a time |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.2 `dlab_identity`

Stores the "What is DLAB" section content for the home page.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `title` | `VARCHAR(255)` | NOT NULL | Section title |
| `body` | `TEXT` | NOT NULL | Main body content (short explanation) |
| `image_url` | `VARCHAR(1000)` | NULL | Accompanying image URL |
| `video_url` | `VARCHAR(1000)` | NULL | Optional intro video |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Active content flag |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.3 `value_propositions`

Individual "why join DLAB" cards shown in the value proposition section. Multiple entries are ordered and displayed as a list/grid.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `title` | `VARCHAR(200)` | NOT NULL | Card heading (e.g. "Aprende haciendo") |
| `description` | `TEXT` | NOT NULL | Card body text |
| `icon_identifier` | `VARCHAR(100)` | NULL | Icon name or class for frontend rendering |
| `image_url` | `VARCHAR(1000)` | NULL | Optional card image |
| `target_audience` | `VARCHAR(200)` | NULL | Who this value applies to (e.g. all students, engineers) |
| `sort_order` | `TINYINT UNSIGNED` | NOT NULL, DEFAULT 0 | Display order |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Visibility toggle |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.4 `participation_steps`

Ordered steps describing how a student can join DLAB. Powers the "Participation Routes" section.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `step_number` | `TINYINT UNSIGNED` | NOT NULL | Step sequence order |
| `title` | `VARCHAR(200)` | NOT NULL | Step title (e.g. "Descubre el DLAB") |
| `description` | `TEXT` | NOT NULL | What happens at this step |
| `icon_identifier` | `VARCHAR(100)` | NULL | Optional icon |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Visibility toggle |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.5 `contact_info`

DLAB contact information for the contact/CTA section of the public site.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `contact_email` | `VARCHAR(255)` | NULL | Primary public contact email |
| `contact_phone` | `VARCHAR(30)` | NULL | Contact phone number |
| `physical_location` | `VARCHAR(300)` | NULL | DLAB physical location description |
| `maps_url` | `VARCHAR(1000)` | NULL | Google Maps or location link |
| `cta_headline` | `VARCHAR(255)` | NULL | CTA section headline |
| `cta_description` | `TEXT` | NULL | Short text inviting action |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Active flag |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.6 `social_links`

DLAB social media and external channel links shown in the contact section or footer.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `platform` | `VARCHAR(100)` | NOT NULL | Platform name (Instagram, LinkedIn, GitHub, etc.) |
| `url` | `VARCHAR(1000)` | NOT NULL | Full URL to the channel |
| `icon_identifier` | `VARCHAR(100)` | NULL | Icon name for frontend rendering |
| `sort_order` | `TINYINT UNSIGNED` | NOT NULL, DEFAULT 0 | Display order |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Visibility toggle |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

### 7.7 `interest_form_config`

Stores the configurable content shown on the interest form page (what students see before and after submitting).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `page_headline` | `VARCHAR(255)` | NOT NULL | Headline above the form |
| `page_description` | `TEXT` | NULL | Explanation of what happens after submission |
| `success_message` | `TEXT` | NOT NULL | Message shown after successful submission |
| `success_email_subject` | `VARCHAR(255)` | NULL | Email subject for confirmation (sent via Resend) |
| `success_email_body` | `TEXT` | NULL | Email body for confirmation |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | Active flag |
| `updated_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Last editor |
| `updated_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update |

---

## 8. Media & Asset Entities

### 8.1 `media_assets`

Central registry for all media files used in the system. Files are stored in a Docker persistent volume locally; the URL may later point to cloud storage. Metadata is always stored here.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `original_filename` | `VARCHAR(500)` | NOT NULL | Original file name at upload |
| `stored_filename` | `VARCHAR(500)` | NOT NULL | Actual stored filename (UUID-based) |
| `public_url` | `VARCHAR(1000)` | NOT NULL | Accessible URL served by backend or CDN |
| `storage_type` | `ENUM('local','cloud')` | NOT NULL, DEFAULT 'local' | Where the file is stored |
| `storage_path` | `VARCHAR(1000)` | NULL | Local volume path (if storage_type = local) |
| `mime_type` | `VARCHAR(100)` | NOT NULL | MIME type (image/jpeg, video/mp4, etc.) |
| `file_size_bytes` | `INT UNSIGNED` | NULL | File size in bytes |
| `entity_type` | `VARCHAR(100)` | NULL | Associated entity type (project, event, hero, etc.) |
| `entity_id` | `INT UNSIGNED` | NULL | Associated entity ID |
| `alt_text` | `VARCHAR(300)` | NULL | Accessibility alt text for images |
| `caption` | `VARCHAR(500)` | NULL | Optional caption |
| `uploaded_by_admin_id` | `INT UNSIGNED` | NULL, FK → administrators.id | Uploader |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Notes:**
- `entity_type` + `entity_id` is a soft polymorphic reference — not a hard FK.
- This allows any content entity to reference media without hard coupling.
- `storage_type` enables future migration to cloud storage (S3, R2, Supabase) by changing this field and `public_url` without restructuring the model.

---

## 9. Audit & System Entities

### 9.1 `audit_log`

Tracks all meaningful create/update/delete operations performed by administrators on key entities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | Unique identifier |
| `actor_type` | `ENUM('administrator','system')` | NOT NULL | Who performed the action |
| `actor_id` | `INT UNSIGNED` | NULL | ID of the acting administrator (NULL if system) |
| `action` | `ENUM` | NOT NULL | Type of action performed |
| `entity_type` | `VARCHAR(100)` | NOT NULL | Table/entity type affected |
| `entity_id` | `INT UNSIGNED` | NOT NULL | ID of the affected record |
| `previous_value` | `JSON` | NULL | JSON snapshot of data before change |
| `new_value` | `JSON` | NULL | JSON snapshot of data after change |
| `description` | `VARCHAR(500)` | NULL | Human-readable summary of the action |
| `ip_address` | `VARCHAR(45)` | NULL | Actor IP address |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | When the action occurred |

**`action` ENUM values:**
- `create` — Record created
- `update` — Record updated
- `delete` — Record deleted
- `approve` — Application approved
- `reject` — Application rejected
- `assign` — Collaborator assigned to project
- `unassign` — Assignment ended
- `status_change` — Status field changed
- `login` — Admin login event

---

## 10. Relationships Summary

### Core Relationships

| From | Relationship | To | Type | Via |
|---|---|---|---|---|
| `collaborators` | has many | `availability_slots` | 1:N | FK on availability_slots |
| `collaborators` | has many | `tags` (interests) | M:N | `collaborator_tags` |
| `collaborators` | submits many | `applications` | 1:N | FK on applications |
| `collaborators` | assigned to many | `projects` | M:N | `assignments` |
| `administrators` | manages many | `projects` | M:N | `project_managers` |
| `administrators` | manages many | `events` | M:N | `event_managers` |
| `administrators` | creates | `projects` | 1:N | FK on projects |
| `administrators` | creates | `events` | 1:N | FK on events |
| `administrators` | reviews | `applications` | 1:N | FK on applications |
| `administrators` | creates | `assignments` | 1:N | FK on assignments |
| `projects` | has many | `tags` | M:N | `project_tags` |
| `projects` | has many | `meeting_days` | 1:N | `project_meeting_days` |
| `projects` | receives many | `applications` | 1:N | FK on applications |
| `projects` | has many | `assignments` | 1:N | FK on assignments |
| `events` | has many | `tags` | M:N | `event_tags` |
| `applications` | may produce one | `assignment` | 1:0..1 | FK on assignments |
| `media_assets` | loosely linked to | any entity | polymorphic | entity_type + entity_id |
| `refresh_tokens` | belong to | administrators or collaborators | polymorphic | user_type + user_id |

### Content Relationships

| Content Entity | Managed by | Displayed on |
|---|---|---|
| `home_hero` | administrators | Home / Landing |
| `dlab_identity` | administrators | Home / Landing |
| `value_propositions` | administrators | Home / Landing |
| `participation_steps` | administrators | Participation Routes section |
| `contact_info` | administrators | Contact / CTA section |
| `social_links` | administrators | Contact / CTA section + footer |
| `interest_form_config` | administrators | Interest Form page |
| `projects` | administrators | Projects section + project detail pages |
| `events` | administrators | Events section + event detail pages |

---

## 11. Enumerated Types (ENUMs)

### Collaborator Trajectory Status
```
nuevo → en_revision → contactado → vinculado
                                  ↓
                               inactivo
```

| Value | Meaning |
|---|---|
| `nuevo` | Just registered via interest form |
| `en_revision` | Admin has started reviewing profile |
| `contactado` | Admin has reached out to collaborator |
| `vinculado` | Collaborator has at least one active assignment |
| `inactivo` | No longer participating |

### Application Status
```
pendiente → en_revision → aprobada → (assignment created)
                        ↘ rechazada
pendiente → retirada
```

### Assignment Status
```
activo → pausado → activo (cyclical)
activo → finalizado
activo → removido
```

### Project Status
```
proximo → activo → en_pausa → activo (cyclical)
activo  → completado → archivado
```

### Event Status
```
proximo → abierto → en_curso → finalizado
abierto → cancelado
```

---

## 12. Design Notes & Constraints

### On Media Storage
- All image and video content is stored externally to the database.
- `media_assets.public_url` always contains the accessible URL used by the frontend.
- For the local MVP, files live in a Docker persistent volume; `storage_type = 'local'`.
- When migrating to cloud, update `storage_type = 'cloud'` and `public_url` to the CDN URL. No schema change required.

### On Authentication
- Only `administrators` and `collaborators` (after account activation) can authenticate.
- Visitors are never stored.
- Collaborators may initially have `password_hash = NULL` (registered but not yet account-activated).
- Account activation flow: admin approves → email sent via Resend → collaborator sets password.

### On Tag Extensibility
- Three system tags are seeded: `Materials`, `Machinery`, `Design`.
- Admins and collaborators may define additional tags.
- Tags are shared across all entities to allow consistent matching.

### On Content Entities
- Content entities (`home_hero`, `value_propositions`, etc.) are edited in the admin panel.
- They are not versioned in the MVP but `updated_at` and `updated_by_admin_id` provide basic traceability.
- Future versions may add a full CMS versioning layer.

### On Audit Log
- The audit log should be written by the backend service layer, not directly by the database.
- `JSON` fields (`previous_value`, `new_value`) allow flexible snapshotting without additional tables.

### On Matching Logic
- Matching between collaborators and projects is driven by shared `tags` (via `collaborator_tags` and `project_tags`).
- Additionally, `availability_slots` can be compared against `project_meeting_days` for schedule-based matching.
- The matching algorithm lives in the backend service layer, not in the database.

### On Future Extensions (out of MVP scope)
The following entities are anticipated for future phases but **not implemented in the MVP**:
- `certifications` — Track completed training milestones
- `equipment_reservations` — Reserve lab machinery
- `dlab_passport` — Aggregated record of a collaborator's full trajectory
- `materials_inventory` — Inventory of lab resources
- `skill_validations` — Peer or admin skill endorsements
- `notifications` — Internal notification queue (email handled via Resend for MVP)