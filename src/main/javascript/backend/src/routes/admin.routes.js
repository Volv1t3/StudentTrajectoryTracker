import { Router } from 'express';
import { z } from 'zod';
import { verifyAdminToken } from '../middleware/auth.js';
import { sanitizePlainTextFields, sanitizeRichTextFields } from '../middleware/sanitizeRichTextFields.js';
import { validate } from '../validators/validate.js';
import { adminPasswordResetRequestSchema } from '../validators/auth.validator.js';
import { createProjectSchema, updateProjectSchema, updateProjectVisibilitySchema } from '../validators/project.validator.js';
import { createEventSchema, updateEventSchema, updateEventVisibilitySchema } from '../validators/event.validator.js';
import { reviewApplicationSchema, createAssignmentSchema, endAssignmentSchema, updateAssignmentSchema } from '../validators/application.validator.js';
import { collaboratorStatusSchema, collaboratorNoteSchema, rejectCollaboratorSchema, adminCollaboratorSchema, collaboratorActiveSchema } from '../validators/collaborator.validator.js';
import { adminAdministratorSchema } from '../validators/administrator.validator.js';
import { homeHeroSchema, dlabIdentitySchema, contactInfoSchema, valuePropositionSchema, participationStepSchema, socialLinkSchema, reorderSchema, visibilityToggleSchema, activeToggleSchema } from '../validators/content.validator.js';
import * as collaborators from '../controllers/admin.collaborator.controller.js';
import * as administrators from '../controllers/admin.administrator.controller.js';
import * as applications from '../controllers/admin.application.controller.js';
import * as assignments from '../controllers/admin.assignment.controller.js';
import * as projects from '../controllers/admin.project.controller.js';
import * as events from '../controllers/admin.event.controller.js';
import * as tags from '../controllers/admin.tag.controller.js';
import * as content from '../controllers/admin.content.controller.js';
import * as adminAuth from '../controllers/admin.auth.controller.js';

const router = Router();
router.use(verifyAdminToken);

// Validators applied by the GENERIC PUT /content/:section route.
// home_hero is intentionally NOT here: it has a dedicated route declared earlier
// that calls content.upsertHomeHero (sp_content_upsert_home_hero).
// contact_info is also NOT here: it's a repeatable section managed via the
// /content/contact_info CRUD endpoints below, not a singleton PUT.
const sectionValidators = {
  dlab_identity: dlabIdentitySchema,
};

const validateSection = (req, res, next) => {
  const schema = sectionValidators[req.params.section];
  if (!schema) return next();
  return validate(schema)(req, res, next);
};

router.get('/collaborators', collaborators.list);
router.post(
  '/collaborators',
  sanitizeRichTextFields(['motivationDescription', 'experienceDescription']),
  validate(adminCollaboratorSchema),
  collaborators.create,
);
router.get('/collaborators/:id', collaborators.getById);
router.put(
  '/collaborators/:id',
  sanitizeRichTextFields(['motivationDescription', 'experienceDescription']),
  validate(adminCollaboratorSchema),
  collaborators.update,
);
router.post('/collaborators/:id/approve', collaborators.approve);
router.post('/collaborators/:id/reject', validate(rejectCollaboratorSchema), collaborators.reject);
router.patch('/collaborators/:id/active', validate(collaboratorActiveSchema), collaborators.setActive);
router.patch('/collaborators/:id/status', validate(collaboratorStatusSchema), collaborators.updateStatus);
router.delete('/collaborators/:id', collaborators.remove);
router.post('/collaborators/:id/notes', validate(collaboratorNoteSchema), collaborators.addNote);

router.get('/administrators', administrators.list);
router.get('/administrators/:id', administrators.getById);
router.post('/administrators', validate(adminAdministratorSchema), administrators.create);
router.put('/administrators/:id', validate(adminAdministratorSchema), administrators.update);
router.post('/administrators/send-password-reset', validate(adminPasswordResetRequestSchema), adminAuth.sendPasswordReset);
router.delete('/administrators/:id', administrators.remove);

router.get('/applications', applications.list);
router.patch(
  '/applications/:id/status',
  sanitizeRichTextFields(['admin_notes']),
  validate(reviewApplicationSchema),
  applications.updateStatus,
);

router.get('/assignments', assignments.list);
router.post(
  '/assignments',
  sanitizeRichTextFields(['reason_for_linking', 'admin_notes']),
  validate(createAssignmentSchema),
  assignments.create,
);
router.patch(
  '/assignments/:id/end',
  sanitizePlainTextFields(['end_reason']),
  validate(endAssignmentSchema),
  assignments.end,
);
router.patch(
  '/assignments/:id',
  sanitizePlainTextFields(['end_reason']),
  validate(updateAssignmentSchema),
  assignments.update,
);
router.delete('/assignments/:id', assignments.remove);

router.get('/projects', projects.list);
router.post(
  '/projects',
  sanitizeRichTextFields(['short_description', 'full_description', 'target_audience']),
  validate(createProjectSchema),
  projects.create,
);
router.post('/projects/:id/media-failure-notification', validate(z.object({
  operation: z.enum(['create', 'edit']),
  stage: z.enum(['upload', 'attach']),
})), projects.notifyMediaFailure);
router.get('/projects/:id', projects.getById);
router.put(
  '/projects/:id',
  sanitizeRichTextFields(['short_description', 'full_description', 'target_audience']),
  validate(updateProjectSchema),
  projects.update,
);
router.patch('/projects/:id/visibility', validate(updateProjectVisibilitySchema), projects.toggleVisibility);
router.delete('/projects/:id', projects.deleteProject);

router.get('/events', events.list);
router.post(
  '/events',
  sanitizeRichTextFields(['short_description', 'full_description', 'target_audience']),
  validate(createEventSchema),
  events.create,
);
router.post('/events/:id/media-failure-notification', validate(z.object({
  operation: z.enum(['create', 'edit']),
  stage: z.enum(['upload', 'attach']),
})), events.notifyMediaFailure);
router.get('/events/:id', events.getById);
router.put(
  '/events/:id',
  sanitizeRichTextFields(['short_description', 'full_description', 'target_audience']),
  validate(updateEventSchema),
  events.update,
);
router.patch('/events/:id/visibility', validate(updateEventVisibilitySchema), events.toggleVisibility);
router.delete('/events/:id', events.deleteEvent);

router.get('/tags', tags.list);
router.post('/tags', validate(z.object({ name: z.string().min(1), category: z.string().min(1) })), tags.create);
router.delete('/tags/:id', tags.deleteTag);

router.get('/content/:section', content.getSection);

// home_hero has a dedicated upsert path that calls sp_content_upsert_home_hero.
// MUST be declared BEFORE the generic /content/:section route to take precedence.
// Even though `subheadline` renders through PageHero/SafeRichText on the
// frontend, the home hero copy is product-classified as plain text because it
// is authored through FormField/textarea rather than RichTextField.
router.put(
  '/content/home_hero',
  sanitizePlainTextFields(['headline', 'subheadline', 'primary_cta_label', 'secondary_cta_label']),
  validate(homeHeroSchema),
  content.upsertHomeHero,
);

router.put(
  '/content/:section',
  sanitizePlainTextFields(['title', 'mission_title', 'vision_title']),
  sanitizeRichTextFields(['body', 'mission_body', 'vision_body']),
  validateSection,
  content.updateSection,
);

// Reorder routes use PATCH on a fixed path — declared before /:id routes
// (they're on a different verb/path so order is not strictly required, but
// keeping reorder declarations grouped makes the contract explicit).
router.patch('/content/value_propositions/reorder', validate(reorderSchema), content.reorderValuePropositions);
router.patch('/content/participation_steps/reorder', validate(reorderSchema), content.reorderParticipationSteps);

// Value propositions CRUD + visibility toggle.
router.post(
  '/content/value_propositions',
  sanitizePlainTextFields(['title', 'target_audience']),
  sanitizeRichTextFields(['description']),
  validate(valuePropositionSchema),
  content.createValueProposition,
);
router.put(
  '/content/value_propositions/:id',
  sanitizePlainTextFields(['title', 'target_audience']),
  sanitizeRichTextFields(['description']),
  validate(valuePropositionSchema),
  content.updateValueProposition,
);
router.patch('/content/value_propositions/:id/visibility', validate(visibilityToggleSchema), content.setValuePropositionVisibility);
router.delete('/content/value_propositions/:id', content.deleteValueProposition);

// Participation steps CRUD + visibility toggle.
router.post(
  '/content/participation_steps',
  sanitizePlainTextFields(['title']),
  sanitizeRichTextFields(['description']),
  validate(participationStepSchema),
  content.createParticipationStep,
);
router.put(
  '/content/participation_steps/:id',
  sanitizePlainTextFields(['title']),
  sanitizeRichTextFields(['description']),
  validate(participationStepSchema),
  content.updateParticipationStep,
);
router.patch('/content/participation_steps/:id/visibility', validate(visibilityToggleSchema), content.setParticipationStepVisibility);
router.delete('/content/participation_steps/:id', content.deleteParticipationStep);

// Social links CRUD + visibility toggle.
router.post('/content/social_links', validate(socialLinkSchema), content.createSocialLink);
router.put('/content/social_links/:id', validate(socialLinkSchema), content.updateSocialLink);
router.patch('/content/social_links/:id/visibility', validate(visibilityToggleSchema), content.setSocialLinkVisibility);
router.delete('/content/social_links/:id', content.deleteSocialLink);

// Contact info CRUD + active toggle.
router.post(
  '/content/contact_info',
  sanitizePlainTextFields([
    'first_name',
    'middle_name',
    'last_name',
    'title_description',
    'physical_location',
    'cta_headline',
  ]),
  sanitizeRichTextFields(['cta_description']),
  validate(contactInfoSchema),
  content.createContactInfo,
);
router.put(
  '/content/contact_info/:id',
  sanitizePlainTextFields([
    'first_name',
    'middle_name',
    'last_name',
    'title_description',
    'physical_location',
    'cta_headline',
  ]),
  sanitizeRichTextFields(['cta_description']),
  validate(contactInfoSchema),
  content.updateContactInfo,
);
router.patch('/content/contact_info/:id/active', validate(activeToggleSchema), content.setContactInfoActive);
router.delete('/content/contact_info/:id', content.deleteContactInfo);

export default router;
