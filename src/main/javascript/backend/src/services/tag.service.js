import { Profanity } from '@2toad/profanity';
import AppError from '../utils/AppError.js';
import { generateSlug } from '../utils/slug.utils.js';
import * as tagQ from '../queries/tag.queries.js';

const profanity = new Profanity();

export function toTitleCase(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase());
}

export function normalizeTagName(name) {
  return toTitleCase(name);
}

export function validateTagName(rawName) {
  const normalizedName = normalizeTagName(rawName);

  if (!normalizedName) {
    throw new AppError('ERR_VALIDATION', 'El tag requiere un nombre', 400);
  }

  
  if (normalizedName.length < 2 || normalizedName.length > 50) {
    throw new AppError('ERR_VALIDATION', 'El tag debe tener entre 2 y 50 caracteres', 400);
  }

  if (profanity.exists(normalizedName) || profanity.exists(normalizedName.replace(/[-_.]/g, ' '))) {
    throw new AppError('ERR_VALIDATION', 'El tag contiene contenido inapropiado', 400);
  }

  return normalizedName;
}

export async function ensureTagIdsForNames(tagNames, category = 'General') {
  const normalizedNames = [...new Set((tagNames || []).map(validateTagName))];
  const tagIds = [];

  for (const normalizedName of normalizedNames) {
    const slug = generateSlug(normalizedName);
    const existingTag = await tagQ.findBySlug(slug);

    if (existingTag) {
      tagIds.push(existingTag.id);
      continue;
    }

    const tagId = await tagQ.create({
      name: normalizedName,
      slug,
      category,
      adminId: null,
    });

    tagIds.push(tagId);
  }

  return tagIds;
}
