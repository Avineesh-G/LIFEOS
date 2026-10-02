import React, { useMemo } from 'react';

interface FormattedAiMessageProps {
  content: string;
  isUser?: boolean;
}

/**
 * Parses inline markdown: **bold**, __bold__, *italic*, _italic_, `code`
 * and strips stray unparsed asterisks/markdown artifacts cleanly.
 */
function parseInlineContent(text: string, isUser: boolean): React.ReactNode[] {
  if (!text) return [];

  // Match: **bold**, __bold__, `code`, *italic*, _italic_
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

    // Clean any stray literal double asterisks if any remain
    const cleanText = part.replace(/\*\*/g, '');
    return <span key={index}>{cleanText}</span>;
  });
}

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({ content, isUser = false }) => {
  const renderedBlocks = useMemo(() => {
    if (!content) return null;

    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    let currentBullets: string[] = [];

    const flushBullets = (keyIdx: number) => {
      if (currentBullets.length > 0) {
        blocks.push(
          <ul key={`bullets-${keyIdx}`} className="space-y-1.5 my-1.5 pl-0.5">
            {currentBullets.map((bullet, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2 leading-relaxed">
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

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();

      // Empty line
      if (!line) {
        flushBullets(idx);
        return;
      }

      // Check for numbered step: e.g. "1. Open the Spending screen" or "1) Open..."
      const stepMatch = line.match(/^(\d+)[\.\)](.*)$/);
      if (stepMatch) {
        flushBullets(idx);
        const stepNum = stepMatch[1];
        const stepText = stepMatch[2].trim();
        blocks.push(
          <div
            key={`step-${idx}`}
            className="flex items-start gap-2.5 my-2 p-2.5 rounded-2xl bg-[var(--md-surface-container-high)]/70 border border-[var(--md-outline-variant)]/40 shadow-none"
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
            key={`heading-${idx}`}
            className="font-bold text-xs sm:text-sm text-[var(--md-on-surface)] mt-2.5 mb-1 tracking-tight"
          >
            {parseInlineContent(headerText, isUser)}
          </h4>
        );
        return;
      }

      // Normal paragraph line
      flushBullets(idx);
      blocks.push(
        <p key={`p-${idx}`} className="my-1 leading-relaxed">
          {parseInlineContent(line, isUser)}
        </p>
      );
    });

    flushBullets(lines.length);
    return blocks;
  }, [content, isUser]);

  return (
    <div className="allow-select select-text space-y-0.5 break-words">
      {renderedBlocks}
    </div>
  );
};

export default FormattedAiMessage;
