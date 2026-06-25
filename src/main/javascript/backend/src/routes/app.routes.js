import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.js';
import { validate } from '../validators/validate.js';
import { updateProfileSchema, updateAvailabilitySchema } from '../validators/collaborator.validator.js';
import { submitApplicationSchema } from '../validators/application.validator.js';
import * as collaborator from '../controllers/collaborator.controller.js';
import * as application from '../controllers/application.controller.js';
import * as assignment from '../controllers/assignment.controller.js';

const router = Router();
router.use(verifyAccessToken);

router.get('/profile', collaborator.getProfile);
router.put('/profile', validate(updateProfileSchema), collaborator.updateProfile);
router.post('/tags', collaborator.createTag);
router.get('/applications', application.list);
router.post('/applications', validate(submitApplicationSchema), application.submit);
router.delete('/applications/:id', application.withdraw);
router.get('/assignments', assignment.list);
router.get('/availability', collaborator.getAvailability);
router.put('/availability', validate(updateAvailabilitySchema), collaborator.updateAvailability);

export default router;
