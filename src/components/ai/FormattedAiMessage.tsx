import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface FormattedAiMessageProps {
  content: string;
  isUser?: boolean;
}

/**
 * Strips json_action blocks (both closed and open during streaming)
 * so raw JSON never leaks into the visual message bubbles.
 */
function stripJsonActions(text: string): string {
  if (!text) return '';
  // Remove closed ```json_action ... ```
  let cleaned = text.replace(/```json_action[\s\S]*?```/g, '');
  // Remove open trailing ```json_action during streaming
  cleaned = cleaned.replace(/```json_action[\s\S]*$/g, '');
  // Strip common emoji clutter from headers if any
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
  return cleaned.trim();
}

/**
 * Parses inline markdown: **bold**, __bold__, *italic*, _italic_, `code`
 */
function parseInlineContent(text: string, isUser: boolean): React.ReactNode[] {
  if (!text) return [];

  const regex = /(\*\*.*?\*\*|__.*?__|`.*?`|\*.*?\*|_.*?_)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className={
            isUser
              ? 'font-bold text-inherit'
              : 'font-semibold text-[var(--md-on-surface)]'
          }
        >
          {inner}
        </strong>
      );
    }

    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className={
            isUser
              ? 'font-bold text-inherit'
              : 'font-semibold text-[var(--md-on-surface)]'
          }
        >
          {inner}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className={
            isUser
              ? 'px-1 py-0.5 rounded bg-black/20 text-inherit font-mono text-[11px]'
              : 'px-1.5 py-0.5 rounded-md bg-[var(--md-surface-container-high)] text-[var(--md-primary)] font-mono text-[11px]'
          }
        >
          {inner}
        </code>
      );
    }

    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-inherit">
          {inner}
        </em>
      );
    }

    const cleanText = part.replace(/\*\*/g, '');
    return <span key={index}>{cleanText}</span>;
  });
}

const CodeBlockWithCopy: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWhatsAppFormat = code.includes('Trip') || code.includes('Plan') || code.includes('Meetup') || code.includes('Reply');

  return (
    <div className="my-2.5 rounded-2xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] overflow-hidden shadow-xs font-sans">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--md-surface-container-high)] border-b border-[var(--md-outline-variant)] text-[11px] font-medium text-[var(--md-on-surface-variant)]">
        <span>{isWhatsAppFormat ? 'WhatsApp Itinerary Format' : 'Formatted Text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] hover:opacity-90 font-bold transition-all active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-[var(--md-on-surface)] overflow-x-auto">
        {code}
      </pre>
    </div>
  );
};

const MarkdownTable: React.FC<{ rows: string[][]; isUser?: boolean }> = ({ rows, isUser = false }) => {
  if (rows.length === 0) return null;
  const headers = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="my-3 overflow-x-auto rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[var(--md-surface-container-high)] border-b border-[var(--md-outline-variant)]">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-3 font-bold text-[var(--md-on-surface)] whitespace-nowrap text-[11px]">
                {parseInlineContent(h.trim(), isUser)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--md-outline-variant)]/50">
          {dataRows.map((r, rIdx) => (
            <tr key={rIdx} className="hover:bg-[var(--md-surface-container-high)]/40 transition-colors">
              {r.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 text-[var(--md-on-surface-variant)] leading-relaxed text-xs">
                  {parseInlineContent(cell.trim(), isUser)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({ content, isUser = false }) => {
  const cleanContent = useMemo(() => stripJsonActions(content), [content]);

  const renderedBlocks = useMemo(() => {
    if (!cleanContent) return null;

    // Handle code blocks (e.g. ```text ... ```)
    const codeBlockRegex = /```(?:[a-zA-Z]*)\n([\s\S]*?)```/g;
    const segments: Array<{ type: 'code' | 'text'; text: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', text: cleanContent.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'code', text: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleanContent.length) {
      segments.push({ type: 'text', text: cleanContent.slice(lastIndex) });
    }

    const blocks: React.ReactNode[] = [];

    segments.forEach((seg, segIdx) => {
      if (seg.type === 'code') {
        blocks.push(<CodeBlockWithCopy key={`code-${segIdx}`} code={seg.text} />);
        return;
      }

      const lines = seg.text.split('\n');
      let currentBullets: string[] = [];
      let currentTableRows: string[][] = [];

      const flushBullets = (keyIdx: number) => {
        if (currentBullets.length > 0) {
          blocks.push(
            <ul key={`bullets-${segIdx}-${keyIdx}`} className="space-y-1.5 my-1.5 pl-0.5 font-sans">
              {currentBullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2 leading-relaxed text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] mt-1.5 shrink-0 opacity-85" />
                  <div className="flex-1 min-w-0">
                    {parseInlineContent(bullet, isUser)}
                  </div>
                </li>
              ))}
            </ul>
          );
          currentBullets = [];
        }
      };

      const flushTable = (keyIdx: number) => {
        if (currentTableRows.length > 0) {
          blocks.push(<MarkdownTable key={`table-${segIdx}-${keyIdx}`} rows={currentTableRows} isUser={isUser} />);
          currentTableRows = [];
        }
      };

      lines.forEach((rawLine, idx) => {
        const line = rawLine.trim();

        // Check for table row (starts and ends with |)
        if (line.startsWith('|') && line.endsWith('|')) {
          flushBullets(idx);
          const cols = line.split('|').slice(1, -1);
          // Check if delimiter row (|---|---|)
          const isDelimiter = cols.every(c => /^[\s\-:]+$/.test(c));
          if (!isDelimiter) {
            currentTableRows.push(cols);
          }
          return;
        } else {
          flushTable(idx);
        }

        // Empty line
        if (!line) {
          flushBullets(idx);
          return;
        }

        // Horizontal rule
        if (line === '---' || line === '***' || line === '___') {
          flushBullets(idx);
          blocks.push(
            <hr key={`hr-${segIdx}-${idx}`} className="my-2.5 border-t border-[var(--md-outline-variant)]/40" />
          );
          return;
        }

        // Check for numbered step: e.g. "1. Open the Spending screen"
        const stepMatch = line.match(/^(\d+)[\.\)](.*)$/);
        if (stepMatch) {
          flushBullets(idx);
          const stepNum = stepMatch[1];
          const stepText = stepMatch[2].trim();
          blocks.push(
            <div
              key={`step-${segIdx}-${idx}`}
              className="flex items-start gap-2.5 my-1.5 p-2.5 rounded-2xl bg-[var(--md-surface-container-high)]/70 border border-[var(--md-outline-variant)]/40 shadow-none font-sans"
            >
              <span className="w-5 h-5 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed">
                {parseInlineContent(stepText, isUser)}
              </div>
            </div>
          );
          return;
        }

        // Check for bullet line: e.g. "- Amount", "* Amount", "• Amount"
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          currentBullets.push(bulletMatch[1]);
          return;
        }

        // Headers: e.g. "### Title" or "## Title"
        const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headerMatch) {
          flushBullets(idx);
          const headerText = headerMatch[2];
          blocks.push(
            <h4
              key={`heading-${segIdx}-${idx}`}
              className="font-bold text-xs sm:text-sm text-[var(--md-on-surface)] mt-2.5 mb-1 tracking-tight font-sans"
            >
              {parseInlineContent(headerText, isUser)}
            </h4>
          );
          return;
        }

        // Normal paragraph line
        flushBullets(idx);
        blocks.push(
          <p key={`p-${segIdx}-${idx}`} className="my-1 leading-relaxed text-xs sm:text-sm font-sans text-[var(--md-on-surface)]">
            {parseInlineContent(line, isUser)}
          </p>
        );
      });

      flushBullets(lines.length);
      flushTable(lines.length);
    });

    return blocks;
  }, [cleanContent, isUser]);

  return (
    <div className="allow-select select-text space-y-0.5 break-words font-sans">
      {renderedBlocks}
    </div>
  );
};

export default FormattedAiMessage;
