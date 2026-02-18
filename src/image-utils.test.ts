import { describe, expect, test } from 'bun:test';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractImageRefs, buildPromptBlocks } from './image-utils.ts';

describe('extractImageRefs', () => {
  test('returns original text and empty paths when no refs', () => {
    const result = extractImageRefs('hello world');
    expect(result.cleanText).toBe('hello world');
    expect(result.paths).toEqual([]);
  });

  test('extracts single image ref', () => {
    const result = extractImageRefs('describe this @image:./screenshot.png');
    expect(result.cleanText).toBe('describe this');
    expect(result.paths).toEqual(['./screenshot.png']);
  });

  test('extracts multiple image refs', () => {
    const result = extractImageRefs(
      'compare @image:/home/user/a.jpg and @image:../b.png',
    );
    expect(result.cleanText).toBe('compare and');
    expect(result.paths).toEqual(['/home/user/a.jpg', '../b.png']);
  });

  test('handles absolute and relative paths', () => {
    const result = extractImageRefs(
      '@image:/absolute/path.png @image:relative.jpg @image:./dot-relative.gif',
    );
    expect(result.paths).toEqual([
      '/absolute/path.png',
      'relative.jpg',
      './dot-relative.gif',
    ]);
  });

  test('handles ref at end of text without trailing space', () => {
    const result = extractImageRefs('look at @image:pic.png');
    expect(result.cleanText).toBe('look at');
    expect(result.paths).toEqual(['pic.png']);
  });

  test('handles ref adjacent to punctuation', () => {
    const result = extractImageRefs('see @image:pic.png, thanks');
    // The comma is part of the path since \S+ matches it — expected edge case
    expect(result.paths).toEqual(['pic.png,']);
  });

  test('extracts single-quoted path with spaces', () => {
    const result = extractImageRefs(
      "describe @image:'/home/user/Screenshot from 2026-01-23.png'",
    );
    expect(result.cleanText).toBe('describe');
    expect(result.paths).toEqual([
      '/home/user/Screenshot from 2026-01-23.png',
    ]);
  });

  test('extracts double-quoted path with spaces', () => {
    const result = extractImageRefs(
      'describe @image:"/home/user/my photo.jpg"',
    );
    expect(result.cleanText).toBe('describe');
    expect(result.paths).toEqual(['/home/user/my photo.jpg']);
  });

  test('mixes quoted and unquoted refs', () => {
    const result = extractImageRefs(
      "compare @image:'/path/with spaces/a.png' and @image:b.jpg",
    );
    expect(result.cleanText).toBe('compare and');
    expect(result.paths).toEqual(['/path/with spaces/a.png', 'b.jpg']);
  });
});

describe('buildPromptBlocks', () => {
  test('text-only returns single text block', async () => {
    const blocks = await buildPromptBlocks('hello world', '/tmp');
    expect(blocks).toEqual([{ type: 'text', text: 'hello world' }]);
  });

  test('with valid image file returns text + image blocks', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'img-test-'));
    const imgPath = join(dir, 'test.png');
    const fakeData = Buffer.from('fake-png-data');
    await writeFile(imgPath, fakeData);

    try {
      const blocks = await buildPromptBlocks(
        `describe @image:${imgPath}`,
        dir,
      );

      expect(blocks.length).toBe(2);
      expect(blocks[0]).toEqual({ type: 'text', text: 'describe' });
      expect(blocks[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/png',
      });
      // Verify base64 roundtrip
      const decoded = Buffer.from(
        (blocks[1] as { data: string }).data,
        'base64',
      );
      expect(decoded.toString()).toBe('fake-png-data');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('with missing file returns text block with error annotation', async () => {
    const blocks = await buildPromptBlocks(
      'look at @image:./nonexistent.jpg',
      '/tmp',
    );

    expect(blocks.length).toBe(1);
    expect(blocks[0]).toMatchObject({ type: 'text' });
    expect((blocks[0] as { text: string }).text).toContain(
      '[failed to read: ./nonexistent.jpg]',
    );
  });

  test('resolves relative paths against workdir', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'img-test-'));
    const imgPath = join(dir, 'photo.jpeg');
    await writeFile(imgPath, Buffer.from('jpeg-data'));

    try {
      const blocks = await buildPromptBlocks(
        'check @image:photo.jpeg',
        dir,
      );

      expect(blocks.length).toBe(2);
      expect(blocks[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/jpeg',
      });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('reads file with spaces in quoted path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'img-test-'));
    const imgPath = join(dir, 'Screenshot from 2026-01-23.png');
    await writeFile(imgPath, Buffer.from('png-data'));

    try {
      const blocks = await buildPromptBlocks(
        `describe @image:'${imgPath}'`,
        dir,
      );

      expect(blocks.length).toBe(2);
      expect(blocks[0]).toEqual({ type: 'text', text: 'describe' });
      expect(blocks[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/png',
      });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  test('maps MIME types correctly', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'img-test-'));
    const extensions = [
      ['.png', 'image/png'],
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.gif', 'image/gif'],
      ['.webp', 'image/webp'],
      ['.bmp', 'image/bmp'],
      ['.svg', 'image/svg+xml'],
    ] as const;

    try {
      for (const [ext, expectedMime] of extensions) {
        const filePath = join(dir, `test${ext}`);
        await writeFile(filePath, Buffer.from('data'));
        const blocks = await buildPromptBlocks(
          `img @image:test${ext}`,
          dir,
        );
        expect(blocks[1]).toMatchObject({
          type: 'image',
          mimeType: expectedMime,
        });
      }
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
