import * as contentQ from '../queries/content.queries.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

// =============================================================================
// SECTION READS / GENERIC SINGLETON WRITES
// =============================================================================

/**
 * GET /api/admin/content/:section
 * Returns full admin-visible data for a section. List sections return arrays
 * (including hidden/inactive rows); singleton sections return a single object
 * or null if no row exists yet.
 */
export async function getSection(req, res, next) {
  try {
    const data = await contentQ.getSectionNoFilter(req.params.section);
    if (typeof data === 'undefined') {
      return errorResponse(res, 'NOT_FOUND', 'Sección no encontrada', 404);
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/admin/content/:section
 * Generic singleton update path. Used for dlab_identity.
 * home_hero is intentionally NOT routed here — it has a dedicated upsert path.
 */
export async function updateSection(req, res, next) {
  try {
    const section = req.params.section;
    const ALLOWED = ['dlab_identity'];
    if (section === 'home_hero') {
      // Defensive guard — should be unreachable because the dedicated
      // PUT /content/home_hero route is declared before this one.
      return errorResponse(res, 'ERR_VALIDATION', 'home_hero must use its dedicated upsert path', 400);
    }
    if (!ALLOWED.includes(section)) {
      return errorResponse(res, 'NOT_FOUND', `Sección "${section}" no soporta actualización singleton`, 404);
    }
    await contentQ.updateSection(section, req.validated, req.user.sub);
    res.json({ message: 'Sección actualizada' });
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/admin/content/home_hero
 * Dedicated home hero upsert path. Calls sp_content_upsert_home_hero which
 * deactivates prior rows and writes an audit record atomically.
 */
export async function upsertHomeHero(req, res, next) {
  try {
    await contentQ.upsertHomeHero(req.validated, req.user.sub);
    res.json({ message: 'Sección actualizada' });
  } catch (e) {
    next(e);
  }
}

// =============================================================================
// VALUE PROPOSITIONS
// =============================================================================

export async function createValueProposition(req, res, next) {
  try {
    const id = await contentQ.createValueProposition(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}
export async function updateValueProposition(req, res, next) {
  try {
    await contentQ.updateValueProposition(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Actualizado' });
  } catch (e) {
    next(e);
  }
}
export async function deleteValueProposition(req, res, next) {
  try {
    await contentQ.deleteValueProposition(req.params.id, req.user.sub);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function reorderValuePropositions(req, res, next) {
  try {
    await contentQ.reorderValuePropositions(req.validated.ordered_ids, req.user.sub);
    res.json({ message: 'Reordenado' });
  } catch (e) {
    next(e);
  }
}
export async function setValuePropositionVisibility(req, res, next) {
  try {
    await contentQ.setValuePropositionVisibility(req.params.id, req.validated.is_visible, req.user.sub);
    res.json({ message: 'Visibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}

// =============================================================================
// PARTICIPATION STEPS
// =============================================================================

export async function createParticipationStep(req, res, next) {
  try {
    const id = await contentQ.createParticipationStep(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}
export async function updateParticipationStep(req, res, next) {
  try {
    await contentQ.updateParticipationStep(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Actualizado' });
  } catch (e) {
    next(e);
  }
}
export async function deleteParticipationStep(req, res, next) {
  try {
    await contentQ.deleteParticipationStep(req.params.id, req.user.sub);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function reorderParticipationSteps(req, res, next) {
  try {
    await contentQ.reorderParticipationSteps(req.validated.ordered_ids, req.user.sub);
    res.json({ message: 'Reordenado' });
  } catch (e) {
    next(e);
  }
}
export async function setParticipationStepVisibility(req, res, next) {
  try {
    await contentQ.setParticipationStepVisibility(req.params.id, req.validated.is_visible, req.user.sub);
    res.json({ message: 'Visibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}

// =============================================================================
// SOCIAL LINKS
// =============================================================================

export async function createSocialLink(req, res, next) {
  try {
    const id = await contentQ.createSocialLink(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}
export async function updateSocialLink(req, res, next) {
  try {
    await contentQ.updateSocialLink(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Actualizado' });
  } catch (e) {
    next(e);
  }
}
export async function deleteSocialLink(req, res, next) {
  try {
    await contentQ.deleteSocialLink(req.params.id, req.user.sub);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
export async function setSocialLinkVisibility(req, res, next) {
  try {
    await contentQ.setSocialLinkVisibility(req.params.id, req.validated.is_visible, req.user.sub);
    res.json({ message: 'Visibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}

// =============================================================================
// CONTACT INFO
// =============================================================================

export async function createContactInfo(req, res, next) {
  try {
    const id = await contentQ.createContactInfo(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function updateContactInfo(req, res, next) {
  try {
    await contentQ.updateContactInfo(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function setContactInfoActive(req, res, next) {
  try {
    await contentQ.setContactInfoActive(req.params.id, req.validated.is_active, req.user.sub);
    res.json({ message: 'Estado actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function deleteContactInfo(req, res, next) {
  try {
    await contentQ.deleteContactInfo(req.params.id, req.user.sub);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
