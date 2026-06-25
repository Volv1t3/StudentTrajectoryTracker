import * as contentQ from '../queries/content.queries.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function getSection(req, res, next) {
  try {
    const data = await contentQ.getSection(req.params.section);
    if (typeof data === 'undefined') return errorResponse(res, 'NOT_FOUND', 'Sección no encontrada', 404);

    if (data === null) {
      const section = req.params.section;
      if (section === 'home_hero') {
        return res.json({
          id: 0,
          headline: '',
          subheadline: '',
          primary_cta_label: '',
          primary_cta_url: '',
          secondary_cta_label: null,
          secondary_cta_url: null,
          background_image_url: null,
          is_active: true,
          updated_by_admin_id: null,
          updated_at: new Date(0).toISOString()
        });
      }

      if (section === 'dlab_identity') {
        return res.json({
          id: 0,
          title: '',
          body: '',
          mission_title: '',
          mission_body: '',
          vision_title: '',
          vision_body: '',
          image_url: null,
          video_url: null,
          is_active: true,
          updated_by_admin_id: null,
          updated_at: new Date(0).toISOString()
        });
      }

      if (section === 'contact_info') {
        return res.json([]);
      }
    }

    res.json(data);
  } catch (e) {
    next(e);
  }
}
