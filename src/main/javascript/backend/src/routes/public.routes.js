import { Router } from 'express';
import * as project from '../controllers/project.controller.js';
import * as event from '../controllers/event.controller.js';
import * as tag from '../controllers/tag.controller.js';
import * as content from '../controllers/content.controller.js';
import * as media from '../controllers/media.controller.js';
import * as contact from '../controllers/contact.controller.js';
import { validate } from '../validators/validate.js';
import { contactInquirySchema } from '../validators/contact.validator.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = Router();

router.get('/projects', project.list);
router.get('/projects/:slug', project.getBySlug);
router.get('/events', event.list);
router.get('/events/:slug', event.getBySlug);
router.get('/tags', tag.list);
router.get('/content/:section', content.getSection);
router.get('/media', media.list);
router.post('/contact', rateLimiter, validate(contactInquirySchema), contact.submitInquiry);

export default router;
