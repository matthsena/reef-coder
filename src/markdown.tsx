import { Text } from 'ink';
import type { ReactNode } from 'react';

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/**
 * Parse inline markdown and return styled Ink Text elements.
 * Supports: **bold**, *italic*, `code`, headers, lists, blockquotes.
 */
export function renderMarkdown(input: string): ReactNode {
  const lines = input.split('\n');
  const result: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      result.push(
        <Text key={i} bold color={level === 1 ? 'cyan' : level === 2 ? 'blue' : 'white'}>
          {parseInline(content)}
        </Text>
      );
      if (i < lines.length - 1) result.push('\n');
      continue;
    }

    // Handle blockquotes
    if (line.startsWith('> ')) {
      result.push(
        <Text key={i} dimColor>
          {'│ '}{parseInline(line.slice(2))}
        </Text>
      );
      if (i < lines.length - 1) result.push('\n');
      continue;
    }

    // Handle unordered lists
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      const indent = ulMatch[1];
      const content = ulMatch[2];
      result.push(
        <Text key={i}>
          {indent}{'• '}{parseInline(content)}
        </Text>
      );
      if (i < lines.length - 1) result.push('\n');
      continue;
    }

    // Handle ordered lists
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const indent = olMatch[1];
      const num = olMatch[2];
      const content = olMatch[3];
      result.push(
        <Text key={i}>
          {indent}{num}. {parseInline(content)}
        </Text>
      );
      if (i < lines.length - 1) result.push('\n');
      continue;
    }

    // Handle horizontal rules
    if (/^[-*_]{3,}$/.test(line.trim())) {
      result.push(
        <Text key={i} dimColor>
          {'─'.repeat(40)}
        </Text>
      );
      if (i < lines.length - 1) result.push('\n');
      continue;
    }

    // Regular line with inline formatting
    result.push(<Text key={i}>{parseInline(line)}</Text>);
    if (i < lines.length - 1) result.push('\n');
  }

  return result;
}

/**
 * Parse inline markdown formatting (bold, italic, code)
 */
function parseInline(text: string): ReactNode[] {
  const segments: TextSegment[] = [];
  let remaining = text;
  let currentSegment: TextSegment = { text: '' };

  while (remaining.length > 0) {
    // Code (backticks) - highest priority
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      if (currentSegment.text) {
        segments.push(currentSegment);
        currentSegment = { text: '' };
      }
      segments.push({ text: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold with ** or __
    const boldMatch = remaining.match(/^(\*\*|__)([^*_]+)\1/);
    if (boldMatch) {
      if (currentSegment.text) {
        segments.push(currentSegment);
        currentSegment = { text: '' };
      }
      segments.push({ text: boldMatch[2], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic with * or _
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
    if (italicMatch) {
      if (currentSegment.text) {
        segments.push(currentSegment);
        currentSegment = { text: '' };
      }
      segments.push({ text: italicMatch[2], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Regular character
    currentSegment.text += remaining[0];
    remaining = remaining.slice(1);
  }

  if (currentSegment.text) {
    segments.push(currentSegment);
  }

  return segments.map((seg, i) => {
    if (seg.code) {
      return (
        <Text key={i} color="cyan">
          {seg.text}
        </Text>
      );
    }
    if (seg.bold) {
      return (
        <Text key={i} bold>
          {seg.text}
        </Text>
      );
    }
    if (seg.italic) {
      return (
        <Text key={i} italic>
          {seg.text}
        </Text>
      );
    }
    return <Text key={i}>{seg.text}</Text>;
  });
}
