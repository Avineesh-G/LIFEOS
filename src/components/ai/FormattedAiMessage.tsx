import React, { useMemo, useState } from 'react';
import { Copy, Check, Share2, CheckSquare, Square } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { shareContent } from '../../utils/shareUtils';

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
  // Strip emojis from headers and text (icons only per requirement)
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    await shareContent(code);
  };

  const isWhatsAppFormat = code.includes('Trip') || code.includes('Plan') || code.includes('Meetup') || code.includes('Reply');

  return (
    <div className="my-2.5 rounded-2xl bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] overflow-hidden shadow-xs font-sans">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--md-surface-container-high)] border-b border-[var(--md-outline-variant)] text-[11px] font-medium text-[var(--md-on-surface-variant)]">
        <span>{isWhatsAppFormat ? 'WhatsApp Itinerary Format' : 'Formatted Text'}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--md-surface-container-highest)] hover:bg-[var(--md-secondary-container)] text-[var(--md-on-surface)] text-[10.5px] font-semibold border border-[var(--md-outline-variant)] transition-all active:scale-95"
            title="Share to WhatsApp / Contacts"
          >
            <Share2 size={11} />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] hover:opacity-90 font-bold text-[10.5px] transition-all active:scale-95"
            title="Copy to clipboard"
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-[var(--md-on-surface)] overflow-x-auto">
        {code}
      </pre>
    </div>
  );
};

const InteractiveChecklist: React.FC<{ items: Array<{ id: string; text: string; initialChecked: boolean }>; isUser?: boolean }> = ({ items, isUser = false }) => {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      initial[item.id] = item.initialChecked;
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    triggerHaptic('light');
    setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-1 my-2 font-sans">
      {items.map((item) => {
        const isChecked = !!checkedMap[item.id];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
              isChecked
                ? 'bg-[var(--md-surface-container-high)]/30 opacity-60'
                : 'bg-[var(--md-surface-container-high)]/70 hover:bg-[var(--md-surface-container-high)]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isChecked ? (
                <CheckSquare size={15} className="text-[var(--md-primary)]" />
              ) : (
                <Square size={15} className="text-[var(--md-on-surface-variant)]" />
              )}
            </div>
            <span
              className={`flex-1 min-w-0 text-xs sm:text-sm leading-relaxed ${
                isChecked ? 'line-through text-[var(--md-on-surface-variant)]' : 'text-[var(--md-on-surface)]'
              }`}
            >
              {parseInlineContent(item.text, isUser)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const MarkdownTable: React.FC<{ rows: string[][]; isUser?: boolean }> = ({ rows, isUser = false }) => {
  if (rows.length === 0) return null;
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      setCanScroll(maxScroll > 6);
      if (maxScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
      } else {
        setScrollProgress(0);
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrollProgress(val);
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      scrollRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  const handleNudge = (direction: 'left' | 'right') => {
    triggerHaptic('light');
    if (scrollRef.current) {
      const offset = direction === 'left' ? -140 : 140;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [rows]);

  return (
    <div className="my-2.5 space-y-1.5 w-full">
      {/* Table Container with Smooth Native Touch Scroll & Edge Elevation */}
      <div className="relative rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] shadow-xs overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto custom-table-scrollbar"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          <table className="min-w-full w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-[var(--md-surface-container-high)] border-b border-[var(--md-outline-variant)]">
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="py-2.5 px-3 font-bold text-[var(--md-on-surface)] text-[11px] tracking-tight uppercase min-w-[95px] max-w-[180px] whitespace-normal break-words"
                  >
                    {parseInlineContent(h.trim(), isUser)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-outline-variant)]/50">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--md-surface-container-high)]/40 transition-colors">
                  {r.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2.5 px-3 text-[var(--md-on-surface-variant)] leading-relaxed text-xs min-w-[95px] max-w-[200px] whitespace-normal break-words align-top"
                    >
                      {parseInlineContent(cell.trim(), isUser)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Mobile Slider Controller for Wide Responses */}
      {canScroll && (
        <div className="flex items-center gap-2 px-1 py-1 rounded-xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-[10.5px] font-medium text-[var(--md-on-surface-variant)]">
          <button
            type="button"
            onClick={() => handleNudge('left')}
            disabled={scrollProgress <= 1}
            className="p-1 rounded-lg hover:bg-[var(--md-surface-container-highest)] disabled:opacity-30 transition-all active:scale-95 shrink-0"
            title="Scroll Left"
          >
            ←
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[9.5px] font-mono shrink-0 select-none opacity-80">
              Slide
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={scrollProgress}
              onChange={handleSliderChange}
              aria-label="Table horizontal scroll slider"
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--md-surface-container-highest)] accent-[var(--md-primary)] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleNudge('right')}
            disabled={scrollProgress >= 99}
            className="p-1 rounded-lg hover:bg-[var(--md-surface-container-highest)] disabled:opacity-30 transition-all active:scale-95 shrink-0"
            title="Scroll Right"
          >
            →
          </button>
        </div>
      )}
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
      let currentChecklist: Array<{ id: string; text: string; initialChecked: boolean }> = [];
      let currentTableRows: string[][] = [];

      const flushBullets = (keyIdx: number) => {
        if (currentBullets.length > 0) {
          blocks.push(
            <ul key={`bullets-${segIdx}-${keyIdx}`} className="space-y-1.5 my-1.5 pl-0.5 font-sans w-full min-w-0">
              {currentBullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2 leading-relaxed text-xs sm:text-sm w-full min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] mt-1.5 shrink-0 opacity-85" />
                  <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                    {parseInlineContent(bullet, isUser)}
                  </div>
                </li>
              ))}
            </ul>
          );
          currentBullets = [];
        }
      };

      const flushChecklist = (keyIdx: number) => {
        if (currentChecklist.length > 0) {
          blocks.push(
            <InteractiveChecklist
              key={`checklist-${segIdx}-${keyIdx}`}
              items={[...currentChecklist]}
              isUser={isUser}
            />
          );
          currentChecklist = [];
        }
      };

      const flushTable = (keyIdx: number) => {
        if (currentTableRows.length > 0) {
          blocks.push(<MarkdownTable key={`table-${segIdx}-${keyIdx}`} rows={currentTableRows} isUser={isUser} />);
          currentTableRows = [];
        }
      };

      const flushAll = (keyIdx: number) => {
        flushBullets(keyIdx);
        flushChecklist(keyIdx);
        flushTable(keyIdx);
      };

      lines.forEach((rawLine, idx) => {
        const line = rawLine.trim();

        // Check for table row (starts and ends with |)
        if (line.startsWith('|') && line.endsWith('|')) {
          flushBullets(idx);
          flushChecklist(idx);
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
          flushChecklist(idx);
          return;
        }

        // Horizontal rule
        if (line === '---' || line === '***' || line === '___') {
          flushAll(idx);
          blocks.push(
            <hr key={`hr-${segIdx}-${idx}`} className="my-2.5 border-t border-[var(--md-outline-variant)]/40" />
          );
          return;
        }

        // Check for interactive checkbox line: e.g. "- [ ] item" or "- [x] item"
        const taskCheckMatch = line.match(/^[-*•]?\s*\[([ xX])\]\s*(.*)$/);
        if (taskCheckMatch) {
          flushBullets(idx);
          const isChecked = taskCheckMatch[1].toLowerCase() === 'x';
          const taskText = taskCheckMatch[2].trim();
          currentChecklist.push({
            id: `chk-${segIdx}-${idx}`,
            text: taskText,
            initialChecked: isChecked,
          });
          return;
        } else {
          flushChecklist(idx);
        }

        // Check for numbered step: e.g. "1. Open the Spending screen"
        const stepMatch = line.match(/^(\d+)[\.\)](.*)$/);
        if (stepMatch) {
          flushAll(idx);
          const stepNum = stepMatch[1];
          const stepText = stepMatch[2].trim();
          blocks.push(
            <div
              key={`step-${segIdx}-${idx}`}
              className="flex items-start gap-2 my-1.5 p-2 rounded-xl bg-[var(--md-surface-container-high)]/60 border border-[var(--md-outline-variant)]/30 font-sans"
            >
              <span className="w-4 h-4 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] text-[9.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
                {parseInlineContent(stepText, isUser)}
              </div>
            </div>
          );
          return;
        }

        // Check for bullet line: e.g. "- Amount", "* Amount", "• Amount"
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          flushChecklist(idx);
          currentBullets.push(bulletMatch[1]);
          return;
        }

        // Headers: e.g. "### Title" or "## Title"
        const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headerMatch) {
          flushAll(idx);
          const headerText = headerMatch[2];
          blocks.push(
            <h4
              key={`heading-${segIdx}-${idx}`}
              className="font-bold text-xs sm:text-sm text-[var(--md-on-surface)] mt-2 mb-1 tracking-tight font-sans break-words [overflow-wrap:anywhere]"
            >
              {parseInlineContent(headerText, isUser)}
            </h4>
          );
          return;
        }

        // Normal paragraph line
        flushAll(idx);
        blocks.push(
          <p key={`p-${segIdx}-${idx}`} className="my-1 leading-relaxed text-xs sm:text-sm font-sans text-[var(--md-on-surface)] break-words [overflow-wrap:anywhere]">
            {parseInlineContent(line, isUser)}
          </p>
        );
      });

      flushAll(lines.length);
    });

    return blocks;
  }, [cleanContent, isUser]);

  return (
    <div className="allow-select select-text space-y-1 break-words [overflow-wrap:anywhere] max-w-full font-sans">
      {renderedBlocks}
    </div>
  );
};

export default FormattedAiMessage;
