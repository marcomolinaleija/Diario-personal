import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { createAttachmentsRepository } from '../repositories/attachments-repository.js';
import { createEntriesRepository } from '../repositories/entries-repository.js';
import { parseId } from '../utils/validation.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'application/pdf'
]);

export function createAttachmentsService() {
  const attachments = createAttachmentsRepository();
  const entries = createEntriesRepository();

  return {
    listForEntry(entryId) {
      const parsedId = parseId(entryId);
      if (!parsedId) return [];
      return attachments.listByEntryId(parsedId);
    },

    getAttachment(id) {
      const parsedId = parseId(id);
      if (!parsedId) return null;
      return attachments.findById(parsedId);
    },

    async createAttachment(entryId, file) {
      const parsedEntryId = parseId(entryId);
      if (!parsedEntryId || !entries.findById(parsedEntryId)) {
        return { ok: false, error: 'La entrada no existe.' };
      }

      if (!file || !file.filename) {
        return { ok: false, error: 'Elige un archivo.' };
      }

      const mimeType = normalizeMimeType(file.mimetype, file.filename);
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return { ok: false, error: 'Ese tipo de archivo no está permitido.' };
      }

      const buffer = await file.toBuffer();
      if (buffer.length > MAX_FILE_SIZE) {
        return { ok: false, error: 'El archivo supera el límite de 5 MB.' };
      }

      const now = new Date().toISOString();
      const extension = safeExtension(file.filename);
      const storedName = `${crypto.randomUUID()}${extension}`;
      const relativePath = path.join(String(parsedEntryId), storedName);
      const fullDir = path.join(env.attachmentsDir, String(parsedEntryId));
      const fullPath = path.join(env.attachmentsDir, relativePath);

      await fs.mkdir(fullDir, { recursive: true });
      await fs.writeFile(fullPath, buffer, { flag: 'wx' });

      const id = attachments.create({
        entryId: parsedEntryId,
        originalName: file.filename,
        storedName,
        relativePath,
        mimeType,
        sizeBytes: buffer.length,
        createdAt: now
      });

      return { ok: true, id };
    },

    async deleteAttachment(id) {
      const attachment = this.getAttachment(id);
      if (!attachment) return false;

      await fs.rm(path.join(env.attachmentsDir, attachment.relative_path), { force: true });
      attachments.delete(attachment.id);
      return true;
    },

    async deleteForEntry(entryId) {
      const parsedEntryId = parseId(entryId);
      if (!parsedEntryId) return;

      const currentAttachments = attachments.listByEntryId(parsedEntryId);
      await Promise.all(currentAttachments.map((attachment) => this.deleteAttachment(attachment.id)));
      await fs.rm(path.join(env.attachmentsDir, String(parsedEntryId)), { recursive: true, force: true });
    },

    pathForAttachment(attachment) {
      if (!attachment) return null;
      return path.join(env.attachmentsDir, attachment.relative_path);
    }
  };
}

export function isImageAttachment(attachment) {
  return attachment.mime_type.startsWith('image/');
}

export function isAudioAttachment(attachment) {
  return attachment.mime_type.startsWith('audio/');
}

export function isTextAttachment(attachment) {
  return attachment.mime_type.startsWith('text/') || attachment.mime_type === 'application/json';
}

function normalizeMimeType(mimeType, filename) {
  const extension = path.extname(filename || '').toLowerCase();
  if (mimeType === 'application/octet-stream') {
    if (extension === '.md') return 'text/markdown';
    if (extension === '.txt') return 'text/plain';
    if (extension === '.csv') return 'text/csv';
    if (extension === '.m4a') return 'audio/x-m4a';
  }

  if (mimeType === 'audio/m4a') return 'audio/x-m4a';
  return String(mimeType || 'application/octet-stream').toLowerCase();
}

function safeExtension(filename) {
  const extension = path.extname(filename || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  return extension.slice(0, 12);
}
