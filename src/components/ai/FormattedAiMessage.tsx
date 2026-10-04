import React, { useMemo, useState } from 'react';
import { Copy, Check, ShareNetwork, CheckSquare, Square } from '../../ui/tokens/icons';
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
  let cleaned = text.replace(/```json_action[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```json_action[\s\S]*$/g, '');
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
          className={isUser ? 'font-bold text-inherit' : 'font-bold text-white'}
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
          className={isUser ? 'font-bold text-inherit' : 'font-bold text-white'}
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
              ? 'px-1 py-0.5 rounded bg-black/30 text-inherit font-mono text-[11px]'
              : 'px-1.5 py-0.5 rounded-md bg-white/10 text-[#64D2FF] font-mono text-[11px]'
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

  return (
    <div className="my-2.5 rounded-2xl bg-[#000000]/60 border border-white/10 overflow-hidden shadow-sm font-sans">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1C1C1E] border-b border-white/10 text-[11px] font-medium text-white/60">
        <span>Code / Formatted Output</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10.5px] font-semibold transition-all active:scale-95"
            title="Share"
          >
            <ShareNetwork size={12} />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0A84FF]/20 text-[#0A84FF] hover:bg-[#0A84FF]/30 font-bold text-[10.5px] transition-all active:scale-95"
            title="Copy to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-white/90 overflow-x-auto">
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
                ? 'bg-white/5 opacity-50'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isChecked ? (
                <CheckSquare size={16} weight="fill" className="text-[#0A84FF]" />
              ) : (
                <Square size={16} className="text-white/40" />
              )}
            </div>
            <span
              className={`flex-1 min-w-0 text-xs sm:text-sm leading-relaxed ${
                isChecked ? 'line-through text-white/40' : 'text-white'
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

const MarkdownTable: React.FC<{ rows: string[]; isUser?: boolean }> = ({ rows, isUser = false }) => {
  if (rows.length === 0) return null;

  const cleanRows = rows.map((r) => r.trim()).filter(Boolean);
  if (cleanRows.length === 0) return null;

  const parseRowCells = (row: string): string[] => {
    let trimmed = row.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map((c) => c.trim());
  };

  const isDivider = (row: string): boolean => {
    return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(row.trim());
  };

  const headerCells = parseRowCells(cleanRows[0]);
  let dataRowsStartIndex = 1;
  if (cleanRows.length > 1 && isDivider(cleanRows[1])) {
    dataRowsStartIndex = 2;
  }

  const dataRows = cleanRows.slice(dataRowsStartIndex).filter((r) => !isDivider(r));

  return (
    <div className="my-3 w-full rounded-[18px] bg-[#1C1C1E] border border-white/12 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="overflow-x-auto custom-table-scrollbar">
        <table className="w-full text-left border-collapse font-sans min-w-[320px]">
          <thead>
            <tr className="bg-white/[0.08] border-b border-white/10">
              {headerCells.map((cell, idx) => (
                <th
                  key={idx}
                  className="px-3.5 py-2.5 text-[11.5px] font-bold text-white uppercase tracking-wider whitespace-nowrap"
                >
                  {parseInlineContent(cell, isUser)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {dataRows.map((row, rIdx) => {
              const cells = parseRowCells(row);
              return (
                <tr
                  key={rIdx}
                  className={
                    rIdx % 2 === 0
                      ? 'bg-transparent hover:bg-white/[0.03]'
                      : 'bg-white/[0.02] hover:bg-white/[0.04]'
                  }
                >
                  {cells.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/90 align-top"
                    >
                      {parseInlineContent(cell, isUser)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({ content, isUser = false }) => {
  const cleanContent = useMemo(() => stripJsonActions(content), [content]);

  const renderedBlocks = useMemo(() => {
    if (!cleanContent) return null;

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
      let currentTableRows: string[] = [];

      const flushBullets = (keyIdx: number) => {
        if (currentBullets.length > 0) {
          blocks.push(
            <ul key={`bullets-${segIdx}-${keyIdx}`} className="space-y-1.5 my-1.5 pl-0.5 font-sans w-full min-w-0">
              {currentBullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2 leading-relaxed text-xs sm:text-sm w-full min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] mt-1.5 shrink-0" />
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
          blocks.push(
            <MarkdownTable
              key={`table-${segIdx}-${keyIdx}`}
              rows={[...currentTableRows]}
              isUser={isUser}
            />
          );
          currentTableRows = [];
        }
      };

      lines.forEach((rawLine, idx) => {
        const line = rawLine.trim();

        if (!line) {
          flushBullets(idx);
          flushChecklist(idx);
          flushTable(idx);
          return;
        }

        // Detect table row: starts and ends with |, or has multiple |
        if (line.startsWith('|') && (line.endsWith('|') || line.split('|').length >= 3)) {
          flushBullets(idx);
          flushChecklist(idx);
          currentTableRows.push(line);
          return;
        } else {
          flushTable(idx);
        }

        if (line === '---' || line === '***' || line === '___') {
          flushBullets(idx);
          flushChecklist(idx);
          blocks.push(
            <hr key={`hr-${segIdx}-${idx}`} className="my-2.5 border-t border-white/10" />
          );
          return;
        }

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

        const stepMatch = line.match(/^(\d+)[\.\)](.*)$/);
        if (stepMatch) {
          flushBullets(idx);
          flushChecklist(idx);
          const stepNum = stepMatch[1];
          const stepText = stepMatch[2].trim();
          blocks.push(
            <div
              key={`step-${segIdx}-${idx}`}
              className="flex items-start gap-2 my-1.5 p-2 rounded-xl bg-white/5 border border-white/10 font-sans"
            >
              <span className="w-4 h-4 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
                {parseInlineContent(stepText, isUser)}
              </div>
            </div>
          );
          return;
        }

        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          flushChecklist(idx);
          currentBullets.push(bulletMatch[1]);
          return;
        }

        const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headerMatch) {
          flushBullets(idx);
          flushChecklist(idx);
          const headerText = headerMatch[2];
          blocks.push(
            <h4
              key={`heading-${segIdx}-${idx}`}
              className="font-bold text-xs sm:text-sm text-white mt-2 mb-1 tracking-tight font-sans break-words"
            >
              {parseInlineContent(headerText, isUser)}
            </h4>
          );
          return;
        }

        flushBullets(idx);
        flushChecklist(idx);
        blocks.push(
          <p key={`p-${segIdx}-${idx}`} className="my-1 leading-relaxed text-xs sm:text-sm font-sans text-white/90 break-words">
            {parseInlineContent(line, isUser)}
          </p>
        );
      });

      flushBullets(lines.length);
      flushChecklist(lines.length);
      flushTable(lines.length);
    });

    return blocks;
  }, [cleanContent, isUser]);

  return (
    <div className="allow-select select-text space-y-1 break-words max-w-full font-sans">
      {renderedBlocks}
    </div>
  );
};

export default FormattedAiMessage;
