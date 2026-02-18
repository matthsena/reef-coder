import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import type { ContentBlock } from '@agentclientprotocol/sdk';

const IMAGE_REF_RE = /@image:'([^']+)'|@image:"([^"]+)"|@image:(\S+)/g;

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
};

export function extractImageRefs(text: string): {
  cleanText: string;
  paths: string[];
} {
  const paths: string[] = [];
  const cleanText = text
    .replace(IMAGE_REF_RE, (_match, single: string, double: string, bare: string) => {
      paths.push(single ?? double ?? bare);
      return '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { cleanText, paths };
}

export async function buildPromptBlocks(
  text: string,
  workdir: string,
): Promise<ContentBlock[]> {
  const { cleanText, paths } = extractImageRefs(text);

  if (paths.length === 0) {
    return [{ type: 'text', text }];
  }

  const textBlock: ContentBlock = { type: 'text', text: cleanText };
  const blocks: ContentBlock[] = [textBlock];
  const errors: string[] = [];

  for (const p of paths) {
    const absolute = resolve(workdir, p);
    try {
      const buf = await readFile(absolute);
      const data = buf.toString('base64');
      const ext = extname(absolute).toLowerCase();
      const mimeType = MIME_MAP[ext] ?? 'application/octet-stream';
      blocks.push({ type: 'image', data, mimeType });
    } catch {
      errors.push(`[failed to read: ${p}]`);
    }
  }

  if (errors.length > 0) {
    (textBlock as { type: 'text'; text: string }).text +=
      ' ' + errors.join(' ');
  }

  return blocks;
}
