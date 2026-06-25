import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function mapContentError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Content section not found')) {
    return new AppError('CONTENT_NOT_FOUND', 'Sección de contenido no encontrada', 404);
  }

  return error;
}

// =============================================================================
// SECTION CONFIGURATION
// =============================================================================

const SECTION_TABLES = {
  home_hero: 'home_hero',
  dlab_identity: 'dlab_identity',
  value_propositions: 'value_propositions',
  participation_steps: 'participation_steps',
  contact_info: 'contact_info',
  social_links: 'social_links',
};

const SINGLETON_SECTIONS = ['home_hero', 'dlab_identity'];
const LIST_SECTIONS = ['value_propositions', 'participation_steps', 'social_links'];

const LIST_SORT_FIELDS = {
  value_propositions: 'sort_order',
  participation_steps: 'step_number',
  social_links: 'sort_order',
};

// Singleton sections updated through the generic singleton path.
// (home_hero is intentionally NOT here — it goes through sp_content_upsert_home_hero.)
const GENERIC_SINGLETON_SECTIONS = ['dlab_identity'];

// Auditable column allow-list per section. Anything outside these lists is dropped
// before being passed to dynamic SQL — defends against unknown keys reaching SET clause.
const SINGLETON_COLUMNS = {
  dlab_identity: [
    'title',
    'body',
    'mission_title',
    'mission_body',
    'vision_title',
    'vision_body',
  ],
};

// =============================================================================
// SECTION READS
// =============================================================================

/**
 * Public read path: returns the active singleton row, or all visible/active list rows.
 * Used by the public site loaders.
 */
export async function getSection(section) {
  const table = SECTION_TABLES[section];
  if (!table) return undefined;

  if (LIST_SECTIONS.includes(section)) {
    const sortField = LIST_SORT_FIELDS[section];
    const [rows] = await pool.execute(`SELECT * FROM ${table} ORDER BY ${sortField}, id`);
    return rows;
  }
  if (section === 'contact_info') {
    const [rows] = await pool.execute('CALL sp_contact_info_list(TRUE)');
    return rows?.[0] || [];
  }
  // Singleton: prefer the active row, fall back to most recent.
  const [activeRows] = await pool.execute(
    `SELECT * FROM ${table} WHERE is_active = TRUE ORDER BY id DESC LIMIT 1`
  );
  if (activeRows.length) return activeRows[0];
  const [anyRows] = await pool.execute(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1`);
  return anyRows[0] || null;
}

/**
 * Admin read path: returns ALL rows for repeatable sections (including inactive),
 * the active singleton row for singletons (or null if no row exists).
 */
export async function getSectionNoFilter(section) {
  const table = SECTION_TABLES[section];
  if (!table) return undefined;

  if (LIST_SECTIONS.includes(section)) {
    const sortField = LIST_SORT_FIELDS[section];
    const [rows] = await pool.execute(`SELECT * FROM ${table} ORDER BY ${sortField}, id`);
    return rows;
  }
  if (section === 'contact_info') {
    // Admin sees ALL contacts, not only active ones.
    const [rows] = await pool.execute('CALL sp_contact_info_list(FALSE)');
    return rows?.[0] || [];
  }
  // Singleton: return the most-recent active row or fall back to most-recent overall.
  const [activeRows] = await pool.execute(
    `SELECT * FROM ${table} WHERE is_active = TRUE ORDER BY id DESC LIMIT 1`
  );
  if (activeRows.length) return activeRows[0];
  const [anyRows] = await pool.execute(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1`);
  return anyRows[0] || null;
}

// =============================================================================
// SINGLETON WRITES
// =============================================================================

/**
 * Generic singleton update path for singleton content rows.
 * Updates the most-recent active row, or inserts a fresh row if none exists.
 * Always writes an audit record via sp_content_audit_update.
 */
export async function updateSection(section, data, adminId) {
  try {
    if (!GENERIC_SINGLETON_SECTIONS.includes(section)) {
      throw new Error(`Section "${section}" is not a generic singleton section`);
    }
    const table = SECTION_TABLES[section];
    const allowed = SINGLETON_COLUMNS[section];
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k))
    );

    // Find the existing active row (if any) so we update in place rather than
    // accidentally targeting a non-existent id=1.
    const [existing] = await pool.execute(
      `SELECT id FROM ${table} WHERE is_active = TRUE ORDER BY id DESC LIMIT 1`
    );
    let entityId;

    if (existing.length) {
      entityId = existing[0].id;
      const setFragments = Object.keys(filtered).map((k) => `${k} = ?`);
      const values = Object.values(filtered);
      setFragments.push('updated_by_admin_id = ?');
      values.push(adminId);
      setFragments.push('updated_at = NOW()');
      await pool.execute(
        `UPDATE ${table} SET ${setFragments.join(', ')} WHERE id = ?`,
        [...values, entityId]
      );
    } else {
      // No active row — insert a fresh one.
      const insertCols = [...Object.keys(filtered), 'is_active', 'updated_by_admin_id', 'updated_at'];
      const placeholders = [...Object.keys(filtered).map(() => '?'), '?', '?', 'NOW()'];
      const values = [...Object.values(filtered), true, adminId];
      const [result] = await pool.execute(
        `INSERT INTO ${table} (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
      entityId = result.insertId;
    }

    await pool.execute('CALL sp_content_audit_update(?, ?, ?)', [table, entityId, adminId]);
    return entityId;
  } catch (error) {
    throw mapContentError(error);
  }
}

/**
 * Dedicated home_hero upsert path. Uses sp_content_upsert_home_hero which
 * guarantees a single active row, deactivating prior ones.
 *
 * Accepts snake_case fields matching homeHeroSchema. The id is looked up
 * automatically from the currently-active row, or null to insert a new row.
 */
export async function upsertHomeHero(data, adminId) {
  // Find the currently active hero (if any) so the SP updates it in place and
  // preserves the non-editable routing/media fields.
  const [active] = await pool.execute(
    `SELECT id, primary_cta_url, secondary_cta_url, background_image_url
       FROM home_hero
      WHERE is_active = TRUE
      ORDER BY id DESC
      LIMIT 1`
  );
  const currentHero = active.length ? active[0] : null;
  const targetId = currentHero?.id ?? null;

  await pool.execute(
    'CALL sp_content_upsert_home_hero(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      targetId,
      data.headline,
      data.subheadline ?? null,
      data.primary_cta_label,
      currentHero?.primary_cta_url ?? '/signup',
      data.secondary_cta_label ?? null,
      currentHero?.secondary_cta_url ?? '/projects',
      currentHero?.background_image_url ?? null,
      adminId,
    ]
  );
}

// =============================================================================
// AUDIT HELPER (used by list-CRUD paths that don't have a dedicated SP)
// =============================================================================

async function writeAudit({ adminId, action, entityType, entityId, description, newValue = null, prevValue = null }) {
  await pool.execute(
    'CALL sp_audit_write(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      'Administrador',
      adminId,
      action,
      entityType,
      entityId ?? null,
      prevValue ? JSON.stringify(prevValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      description,
      null,
    ]
  );
}

// =============================================================================
// VALUE PROPOSITIONS
// =============================================================================

export async function createValueProposition(data, adminId) {
  const {
    title,
    description,
    icon_identifier,
    image_url,
    target_audience,
    sort_order,
    is_visible,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO value_propositions
       (title, description, icon_identifier, image_url, target_audience,
        sort_order, is_visible, updated_by_admin_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      title,
      description,
      icon_identifier ?? null,
      image_url ?? null,
      target_audience ?? null,
      sort_order ?? 0,
      is_visible ?? true,
      adminId,
    ]
  );

  await writeAudit({
    adminId,
    action: 'Crear',
    entityType: 'value_propositions',
    entityId: result.insertId,
    description: 'Value proposition created',
    newValue: data,
  });

  return result.insertId;
}

export async function updateValueProposition(id, data, adminId) {
  const allowed = [
    'title',
    'description',
    'icon_identifier',
    'image_url',
    'target_audience',
    'sort_order',
    'is_visible',
  ];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(filtered).length === 0) return;

  const setFragments = Object.keys(filtered).map((k) => `${k} = ?`);
  const values = Object.values(filtered);
  setFragments.push('updated_by_admin_id = ?');
  values.push(adminId);
  setFragments.push('updated_at = NOW()');

  await pool.execute(
    `UPDATE value_propositions SET ${setFragments.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  await pool.execute('CALL sp_content_audit_update(?, ?, ?)', ['value_propositions', id, adminId]);
}

export async function deleteValueProposition(id, adminId) {
  await pool.execute('DELETE FROM value_propositions WHERE id = ?', [id]);
  await writeAudit({
    adminId,
    action: 'Eliminar',
    entityType: 'value_propositions',
    entityId: id,
    description: 'Value proposition deleted',
  });
}

export async function reorderValuePropositions(orderedIds, adminId) {
  // Convert [id1, id2, id3] -> [{id, sort_order}, ...] keyed off array position.
  const orderMap = orderedIds.map((id, idx) => ({ id, sort_order: idx }));
  await pool.execute('CALL sp_value_proposition_reorder(?, ?)', [JSON.stringify(orderMap), adminId]);
}

export async function setValuePropositionVisibility(id, isVisible, adminId) {
  await pool.execute(
    'UPDATE value_propositions SET is_visible = ?, updated_by_admin_id = ?, updated_at = NOW() WHERE id = ?',
    [isVisible, adminId, id]
  );
  await writeAudit({
    adminId,
    action: 'Cambio_De_Estado',
    entityType: 'value_propositions',
    entityId: id,
    description: `Value proposition visibility set to ${isVisible ? 'visible' : 'hidden'}`,
    newValue: { is_visible: isVisible },
  });
}

// =============================================================================
// PARTICIPATION STEPS
// =============================================================================

export async function createParticipationStep(data, adminId) {
  const { title, description, icon_identifier, step_number, is_visible } = data;

  const [result] = await pool.execute(
    `INSERT INTO participation_steps
       (step_number, title, description, icon_identifier, is_visible,
        updated_by_admin_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      step_number ?? 0,
      title,
      description,
      icon_identifier ?? null,
      is_visible ?? true,
      adminId,
    ]
  );

  await writeAudit({
    adminId,
    action: 'Crear',
    entityType: 'participation_steps',
    entityId: result.insertId,
    description: 'Participation step created',
    newValue: data,
  });

  return result.insertId;
}

export async function updateParticipationStep(id, data, adminId) {
  const allowed = ['step_number', 'title', 'description', 'icon_identifier', 'is_visible'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(filtered).length === 0) return;

  const setFragments = Object.keys(filtered).map((k) => `${k} = ?`);
  const values = Object.values(filtered);
  setFragments.push('updated_by_admin_id = ?');
  values.push(adminId);
  setFragments.push('updated_at = NOW()');

  await pool.execute(
    `UPDATE participation_steps SET ${setFragments.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  await pool.execute('CALL sp_content_audit_update(?, ?, ?)', ['participation_steps', id, adminId]);
}

export async function deleteParticipationStep(id, adminId) {
  await pool.execute('DELETE FROM participation_steps WHERE id = ?', [id]);
  await writeAudit({
    adminId,
    action: 'Eliminar',
    entityType: 'participation_steps',
    entityId: id,
    description: 'Participation step deleted',
  });
}

export async function reorderParticipationSteps(orderedIds, adminId) {
  // Convert [id1, id2, id3] -> [{id, step_number}, ...] keyed off array position.
  const orderMap = orderedIds.map((id, idx) => ({ id, step_number: idx + 1 }));
  await pool.execute('CALL sp_participation_step_reorder(?, ?)', [JSON.stringify(orderMap), adminId]);
}

export async function setParticipationStepVisibility(id, isVisible, adminId) {
  await pool.execute(
    'UPDATE participation_steps SET is_visible = ?, updated_by_admin_id = ?, updated_at = NOW() WHERE id = ?',
    [isVisible, adminId, id]
  );
  await writeAudit({
    adminId,
    action: 'Cambio_De_Estado',
    entityType: 'participation_steps',
    entityId: id,
    description: `Participation step visibility set to ${isVisible ? 'visible' : 'hidden'}`,
    newValue: { is_visible: isVisible },
  });
}

// =============================================================================
// SOCIAL LINKS
// =============================================================================

export async function createSocialLink(data, adminId) {
  const { platform, url, icon_identifier, sort_order, is_visible } = data;

  const [result] = await pool.execute(
    `INSERT INTO social_links
       (platform, url, icon_identifier, sort_order, is_visible,
        updated_by_admin_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      platform,
      url,
      icon_identifier ?? null,
      sort_order ?? 0,
      is_visible ?? true,
      adminId,
    ]
  );

  await writeAudit({
    adminId,
    action: 'Crear',
    entityType: 'social_links',
    entityId: result.insertId,
    description: 'Social link created',
    newValue: data,
  });

  return result.insertId;
}

export async function updateSocialLink(id, data, adminId) {
  const allowed = ['platform', 'url', 'icon_identifier', 'sort_order', 'is_visible'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(filtered).length === 0) return;

  const setFragments = Object.keys(filtered).map((k) => `${k} = ?`);
  const values = Object.values(filtered);
  setFragments.push('updated_by_admin_id = ?');
  values.push(adminId);
  setFragments.push('updated_at = NOW()');

  await pool.execute(
    `UPDATE social_links SET ${setFragments.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  await pool.execute('CALL sp_content_audit_update(?, ?, ?)', ['social_links', id, adminId]);
}

export async function deleteSocialLink(id, adminId) {
  await pool.execute('DELETE FROM social_links WHERE id = ?', [id]);
  await writeAudit({
    adminId,
    action: 'Eliminar',
    entityType: 'social_links',
    entityId: id,
    description: 'Social link deleted',
  });
}

export async function setSocialLinkVisibility(id, isVisible, adminId) {
  await pool.execute(
    'UPDATE social_links SET is_visible = ?, updated_by_admin_id = ?, updated_at = NOW() WHERE id = ?',
    [isVisible, adminId, id]
  );
  await writeAudit({
    adminId,
    action: 'Cambio_De_Estado',
    entityType: 'social_links',
    entityId: id,
    description: `Social link visibility set to ${isVisible ? 'visible' : 'hidden'}`,
    newValue: { is_visible: isVisible },
  });
}

// =============================================================================
// CONTACT INFO (uses dedicated SPs which write audit records internally)
// =============================================================================

export async function createContactInfo(data, adminId) {
  const {
    first_name,
    middle_name,
    last_name,
    title_description,
    contact_email,
    contact_phone,
    physical_location,
    maps_url,
    cta_headline,
    cta_description,
    is_active,
  } = data;

  await pool.execute(
    'CALL sp_contact_info_create(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @cid)',
    [
      first_name,
      middle_name ?? null,
      last_name,
      title_description ?? null,
      contact_email ?? null,
      contact_phone ?? null,
      physical_location ?? null,
      maps_url ?? null,
      cta_headline ?? null,
      cta_description ?? null,
      is_active ?? true,
      adminId,
    ]
  );
  const [[row]] = await pool.execute('SELECT @cid AS contactId');
  return row.contactId;
}

export async function updateContactInfo(id, data, adminId) {
  const [[currentRow]] = await pool.execute(
    'SELECT maps_url FROM contact_info WHERE id = ? LIMIT 1',
    [id]
  );
  const {
    first_name,
    middle_name,
    last_name,
    title_description,
    contact_email,
    contact_phone,
    physical_location,
    maps_url,
    cta_headline,
    cta_description,
    is_active,
  } = data;

  await pool.execute(
    'CALL sp_contact_info_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      first_name,
      middle_name ?? null,
      last_name,
      title_description ?? null,
      contact_email ?? null,
      contact_phone ?? null,
      physical_location ?? null,
      currentRow?.maps_url ?? null,
      cta_headline ?? null,
      cta_description ?? null,
      is_active ?? true,
      adminId,
    ]
  );
}

export async function setContactInfoActive(id, isActive, adminId) {
  await pool.execute('CALL sp_contact_info_set_active(?, ?, ?)', [id, isActive, adminId]);
}

export async function deleteContactInfo(id, adminId) {
  await pool.execute('CALL sp_contact_info_delete(?, ?)', [id, adminId]);
}
