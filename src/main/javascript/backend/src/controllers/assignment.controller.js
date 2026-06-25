import * as assignmentQ from '../queries/assignment.queries.js';

export async function list(req, res, next) {
  try {
    const rows = await assignmentQ.listByCollaborator(req.user.sub, {
      status: req.query.status,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
