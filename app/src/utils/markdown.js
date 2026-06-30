import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const markdown = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
  typographer: true
});

export function renderMarkdown(source, attachments = []) {
  return renderMarkdownWithAttachments(source, attachments);
}

export function renderMarkdownWithAttachments(source, attachments = []) {
  const attachmentsById = new Map(attachments.map((attachment) => [String(attachment.id), attachment]));
  const preparedSource = String(source || '').replace(/\[\[attachment:(\d+)]]/g, (_match, id) => {
    const attachment = attachmentsById.get(String(id));
    if (!attachment) return `Adjunto no encontrado: ${id}`;
    return attachmentPlaceholder(attachment);
  });

  const rendered = markdown.render(preparedSource);

  return sanitizeHtml(rendered, {
    allowedTags: [
      'a',
      'blockquote',
      'br',
      'code',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'hr',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'strong',
      'ul',
      'audio',
      'source'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      audio: ['controls'],
      img: ['src', 'alt', 'loading'],
      source: ['src', 'type']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      })
    }
  });
}

function attachmentPlaceholder(attachment) {
  const viewUrl = `/attachments/${attachment.id}/view`;
  const downloadUrl = `/attachments/${attachment.id}/download`;
  const label = escapeMarkdown(attachment.original_name);

  if (attachment.mime_type.startsWith('image/')) {
    return `![${label}](${viewUrl})`;
  }

  if (attachment.mime_type.startsWith('audio/')) {
    return `<audio controls><source src="${viewUrl}" type="${attachment.mime_type}"><a href="${downloadUrl}">${label}</a></audio>`;
  }

  return `[${label}](${downloadUrl})`;
}

function escapeMarkdown(value) {
  return String(value || 'adjunto').replace(/[[\]()]/g, '\\$&');
}
