import * as tagQ from '../queries/tag.queries.js';

export async function list(req, res, next) {
  try {
    const scope = req.query.scope;
    const hasPagination = req.query.limit || req.query.page || req.query.search;
    if (!hasPagination) {
      const rows = await tagQ.listAll({ scope });
      res.json(rows);
      return;
    }

    const limit = Number(req.query.limit || 20);
    const page = Number(req.query.page || 1);
    const offset = (page - 1) * limit;
    const { rows, total } = await tagQ.listPaged({ limit, offset, search: req.query.search || '', scope });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}
