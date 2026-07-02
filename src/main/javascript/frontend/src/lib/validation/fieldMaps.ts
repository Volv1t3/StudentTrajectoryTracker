/**
 * fieldMaps.ts — centralized backend→frontend field-name mapping tables.
 *
 * Backend ERR_VALIDATION payloads key errors by backend payload names
 * (e.g. `title`, `short_description`, `registration_url`). Svelte forms in
 * this codebase render fields under Spanish UI names (`nombre`,
 * `descripcion_corta`, `link_externo`). These tables translate between the
 * two so route components can bind backend errors to the correct controls
 * without route-local one-off mappings.
 *
 * Each map is `Record<backend_key, frontend_key>`. Keys not in the map are
 * passed through verbatim by `mapBackendFields`.
 *
 * Coverage required by `frontend/agent-task.md`:
 *   - project: title→nombre, short_description→descripcion_corta, …
 *   - event: title→nombre, registration_url→link_externo, …
 *   - signup, auth, profile mappings
 * Add additional entries here when introducing new forms; do NOT scatter
 * field mappings into individual routes.
 */

export type FieldMap = Readonly<Record<string, string>>;

// ---------------------------------------------------------------------------
// Project (admin/projects/new + admin/projects/[id])
// ---------------------------------------------------------------------------
export const projectFieldMap: FieldMap = Object.freeze({
  title: 'nombre',
  slug: 'slug',
  short_description: 'descripcion_corta',
  full_description: 'descripcion_larga',
  target_audience: 'target_audience',
  required_skills: 'habilidades_requeridas',
  participation_mode: 'modalidad',
  status: 'estado',
  max_collaborators: 'cupo_maximo',
  header_image_url: 'header_image_url',
  video_url: 'video_url',
  header_image_media_asset_id: 'header_image_media_asset_id',
  video_media_asset_id: 'video_media_asset_id',
  is_visible: 'es_visible',
  is_highlighted: 'es_destacado',
  tags: 'etiquetas',
  new_tags: 'etiquetas_nuevas',
  required_skill_items: 'habilidades_items',
  meetingDays: 'dias_reunion',
  managers: 'responsables',
});

// ---------------------------------------------------------------------------
// Event (admin/events/new + admin/events/[id])
// ---------------------------------------------------------------------------
export const eventFieldMap: FieldMap = Object.freeze({
  title: 'nombre',
  slug: 'slug',
  type: 'tipo',
  short_description: 'descripcion_corta',
  full_description: 'descripcion_larga',
  target_audience: 'target_audience',
  location: 'lugar',
  event_date: 'fecha',
  event_end_date: 'fecha_fin',
  registration_deadline: 'fecha_limite_inscripcion',
  capacity: 'cupo_maximo',
  banner_image_url: 'banner_image_url',
  poster_image_url: 'poster_image_url',
  video_url: 'video_url',
  registration_url: 'link_externo',
  status: 'estado',
  is_visible: 'es_visible',
  is_highlighted: 'es_destacado',
  tags: 'etiquetas',
  managers: 'responsables',
});

// ---------------------------------------------------------------------------
// Signup (auth/signup/+page.svelte)
// ---------------------------------------------------------------------------
export const signupFieldMap: FieldMap = Object.freeze({
  first_name: 'nombres',
  middle_name: 'nombre_medio',
  last_name: 'apellidos',
  second_last_name: 'segundo_apellido',
  personal_email: 'correo_personal',
  usfq_email: 'correo_institucional',
  phone_number: 'telefono',
  date_of_birth: 'fecha_nacimiento',
  major: 'carrera',
  current_university_year: 'semestre',
  expected_graduation_year: 'anio_graduacion',
  motivation_description: 'motivacion',
  experience_description: 'experiencia_previa',
  interest_in_machinery: 'interestInMachinery',
  interest_in_design: 'interestInDesign',
  interest_in_materials: 'interestInMaterials',
  tag_names: 'habilidades',
  availability_slots: 'disponibilidad_semanal',
});

// ---------------------------------------------------------------------------
// Auth (login, forgot, reset, activate, admin login)
// ---------------------------------------------------------------------------
export const authFieldMap: FieldMap = Object.freeze({
  email: 'correo',
  password: 'contrasena',
  new_password: 'nueva_contrasena',
  confirm: 'confirmar_contrasena',
  token: 'token',
});

// ---------------------------------------------------------------------------
// Profile (app/profile + admin collaborator edit). Backend uses camelCase
// here (see backend/src/validators/collaborator.validator.js).
// ---------------------------------------------------------------------------
export const profileFieldMap: FieldMap = Object.freeze({
  firstName: 'firstName',
  middleName: 'middleName',
  lastName: 'lastName',
  secondLastName: 'secondLastName',
  personalEmail: 'personalEmail',
  usfqEmail: 'usfqEmail',
  phoneNumber: 'phoneNumber',
  dateOfBirth: 'dateOfBirth',
  major: 'major',
  currentUniversityYear: 'currentUniversityYear',
  expectedGraduationYear: 'expectedGraduationYear',
  experienceDescription: 'experienceDescription',
  motivationDescription: 'motivationDescription',
  interestInMachinery: 'interestInMachinery',
  interestInDesign: 'interestInDesign',
  interestInMaterials: 'interestInMaterials',
  tag_ids: 'tag_ids',
  slots: 'availability_slots',
});

// ---------------------------------------------------------------------------
// Administrator (admin/administradores/nuevo + admin/administradores/[id]).
// Backend also uses camelCase here.
// ---------------------------------------------------------------------------
export const administratorFieldMap: FieldMap = Object.freeze({
  administrator_id: 'administratorId',
  firstName: 'firstName',
  middleName: 'middleName',
  lastName: 'lastName',
  secondLastName: 'secondLastName',
  personalEmail: 'personalEmail',
  usfqEmail: 'usfqEmail',
  phoneNumber: 'phoneNumber',
  dateOfBirth: 'dateOfBirth',
  password: 'password',
  isActive: 'isActive',
});

// ---------------------------------------------------------------------------
// Contact (public/contact)
// ---------------------------------------------------------------------------
export const contactFieldMap: FieldMap = Object.freeze({
  name: 'nombre',
  email: 'correo',
  subject: 'asunto',
  message: 'mensaje',
});

// ---------------------------------------------------------------------------
// Application (app/projects/[slug]/apply + admin review/assign/end)
// ---------------------------------------------------------------------------
export const applicationFieldMap: FieldMap = Object.freeze({
  project_id: 'proyecto',
  reason_for_applying: 'mensaje_motivacion',
  status: 'estado',
  admin_notes: 'admin_notes',
  role_in_project: 'role_in_project',
  end_status: 'end_status',
  end_reason: 'end_reason',
  collaborator_id: 'colaborador',
  reason_for_linking: 'reason_for_linking',
});

// ---------------------------------------------------------------------------
// Admin collaborator flows (reject / note / deactivate / status). Backend
// fields are simple singulars from collaborator.validator.js.
// ---------------------------------------------------------------------------
export const collaboratorAdminFieldMap: FieldMap = Object.freeze({
  note: 'note',
  reason: 'reason',
  status: 'status',
});

// ---------------------------------------------------------------------------
// Content (admin/content/*). Backend keys match the DB column names.
// ---------------------------------------------------------------------------
export const contentFieldMap: FieldMap = Object.freeze({
  headline: 'titular',
  subheadline: 'subtitular',
  primary_cta_label: 'cta_primario',
  primary_cta_url: 'cta_primario_url',
  secondary_cta_label: 'cta_secundario',
  secondary_cta_url: 'cta_secundario_url',
  title: 'titulo',
  body: 'cuerpo',
  mission_title: 'mision_titulo',
  mission_body: 'mision_cuerpo',
  vision_title: 'vision_titulo',
  vision_body: 'vision_cuerpo',
  description: 'descripcion',
  icon_identifier: 'icono',
  target_audience: 'target_audience',
  sort_order: 'orden',
  is_visible: 'es_visible',
  step_number: 'numero_paso',
  platform: 'plataforma',
  url: 'url',
  first_name: 'nombres',
  middle_name: 'nombre_medio',
  last_name: 'apellidos',
  title_description: 'cargo',
  contact_email: 'correo_contacto',
  contact_phone: 'telefono_contacto',
  physical_location: 'ubicacion_fisica',
  cta_headline: 'cta_titular',
  cta_description: 'cta_descripcion',
  is_active: 'activo',
  ordered_ids: 'orden_ids',
});

// ---------------------------------------------------------------------------
// Index of all maps keyed by form name. Useful when a route component wants
// to fetch its map by string instead of importing the constant directly.
// ---------------------------------------------------------------------------
export const fieldMaps: Readonly<Record<string, FieldMap>> = Object.freeze({
  project: projectFieldMap,
  event: eventFieldMap,
  signup: signupFieldMap,
  auth: authFieldMap,
  profile: profileFieldMap,
  administrator: administratorFieldMap,
  contact: contactFieldMap,
  application: applicationFieldMap,
  content: contentFieldMap,
  collaboratorAdmin: collaboratorAdminFieldMap,
});

export type FieldMapName = keyof typeof fieldMaps;
