import * as tagQ from '../queries/tag.queries.js';
import { generateSlug } from '../utils/slug.utils.js';
import { normalizeTagName } from '../services/tag.service.js';

export async function list(req, res, next) {
  try {
    const rows = await tagQ.listWithUsage({ scope: req.query.scope });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { name, category } = req.validated;
    const normalizedName = normalizeTagName(name);
    const slug = generateSlug(normalizedName);
    const id = await tagQ.create({ name: normalizedName, slug, category, adminId: req.user.sub });
    res.status(201).json({ id, slug });
  } catch (e) {
    next(e);
  }
}

export async function deleteTag(req, res, next) {
  try {
    await tagQ.deleteTag(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
