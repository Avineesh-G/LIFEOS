import React, { useMemo, useState } from 'react';
import { Copy, Check, ShareNetwork, CheckSquare, Square } from '../../ui/tokens/icons';
import { CheckCircle, Circle, Clock, ChartBar, Lightning } from '@phosphor-icons/react';
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
              : 'px-1.5 py-0.5 rounded-md bg-white/10 text-[var(--app-accent-text)] font-mono text-[11px]'
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
    <div className="my-2.5 rounded-2xl bg-[#141416] overflow-hidden shadow-md font-sans w-full max-w-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1C1C1E] text-[11px] font-medium text-white/60">
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
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold text-[10.5px] transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
              color: 'var(--app-accent-text, #D29B7E)',
            }}
            title="Copy to clipboard"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-white/90 overflow-x-auto w-full max-w-full">
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
                <CheckSquare size={16} weight="fill" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />
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
  const colCount = headerCells.length;

  // Proportional mobile column distribution guaranteeing 100% full-width fit without horizontal scroll
  const getColWidth = (idx: number): string => {
    if (colCount === 2) return idx === 0 ? '58%' : '42%';
    if (colCount === 3) return idx === 0 ? '46%' : '27%';
    if (colCount === 4) return idx === 0 ? '38%' : idx === 1 ? '20%' : idx === 2 ? '24%' : '18%';
    return `${Math.floor(100 / colCount)}%`;
  };

  const isWideTable = colCount >= 5;

  return (
    <div className="my-2.5 w-full max-w-full rounded-[20px] bg-[#151518] overflow-hidden shadow-xl border-none font-sans">
      <div className={`w-full max-w-full ${isWideTable ? 'overflow-x-auto custom-table-scrollbar overscroll-x-contain' : 'overflow-hidden'}`}>
        <table className={`w-full ${isWideTable ? 'min-w-[420px]' : 'table-fixed'} border-collapse text-left`}>
          <thead>
            <tr className="bg-white/[0.05] border-b border-white/[0.08]">
              {headerCells.map((cell, idx) => {
                const isFirst = idx === 0;
                return (
                  <th
                    key={idx}
                    style={!isWideTable ? { width: getColWidth(idx) } : undefined}
                    className={`py-2 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider leading-tight ${
                      isFirst ? 'text-left pl-3 pr-1' : 'text-center px-1'
                    } break-words`}
                  >
                    {parseInlineContent(cell, isUser)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {dataRows.map((row, rIdx) => {
              const cells = parseRowCells(row);
              return (
                <tr
                  key={rIdx}
                  className={
                    rIdx % 2 === 0
                      ? 'bg-transparent hover:bg-white/[0.02]'
                      : 'bg-white/[0.02] hover:bg-white/[0.03]'
                  }
                >
                  {cells.map((cell, cIdx) => {
                    const isFirst = cIdx === 0;
                    return (
                      <td
                        key={cIdx}
                        style={!isWideTable ? { width: getColWidth(cIdx) } : undefined}
                        className={`py-2 text-[11px] sm:text-[11.5px] leading-snug align-middle ${
                          isFirst
                            ? 'text-left pl-3 pr-1 font-medium text-white break-words'
                            : 'text-center px-1 text-white/85 font-mono tracking-tight break-words'
                        }`}
                      >
                        {parseInlineContent(cell, isUser)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


interface WorkflowStep {
  step: number;
  title: string;
  desc?: string;
  duration?: string;
}

interface WorkflowData {
  title?: string;
  steps: WorkflowStep[];
}

const InteractiveWorkflowCard: React.FC<{ data: WorkflowData }> = ({ data }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNum: number) => {
    triggerHaptic('selection');
    setCompletedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const steps = Array.isArray(data.steps) ? data.steps : [];
  const totalSteps = steps.length;
  const completedCount = steps.filter(s => !!completedSteps[s.step]).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="my-3.5 w-full rounded-[24px] glass-card p-4 text-left font-sans select-none shadow-xl border-none">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl glass-tile flex items-center justify-center shrink-0 shadow-inner" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
            <Lightning size={17} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {data.title || 'Interactive Workflow'}
            </h4>
            <p className="text-[11px] text-white/50 font-mono mt-0.5">
              {completedCount} of {totalSteps} steps completed ({progressPercent}%)
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
            color: 'var(--app-accent-text, #D29B7E)',
          }}
        >
          Workflow
        </span>
      </div>

      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36 0%, #A46D52 100%))',
          }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((st, idx) => {
          const stepKey = st.step || (idx + 1);
          const isDone = !!completedSteps[stepKey];
          return (
            <div
              key={stepKey}
              onClick={() => toggleStep(stepKey)}
              className={`p-3 rounded-[16px] transition-all cursor-pointer flex items-start gap-3 border-none ${
                isDone ? 'bg-white/[0.025] opacity-60' : 'glass-tile hover:bg-white/[0.06]'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 transition-colors text-white/40 hover:text-white"
                style={isDone ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
              >
                {isDone ? <CheckCircle size={19} weight="fill" /> : <Circle size={19} weight="bold" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-xs font-bold leading-tight ${isDone ? 'line-through text-white/40' : 'text-white'}`}>
                    {stepKey}. {st.title}
                  </h5>
                  {st.duration && (
                    <span className="text-[10px] text-white/50 font-mono px-2 py-0.5 rounded-full bg-white/[0.06] flex items-center gap-1 shrink-0">
                      <Clock size={11} weight="bold" />
                      {st.duration}
                    </span>
                  )}
                </div>
                {st.desc && (
                  <p className="text-[11px] text-white/65 mt-1 leading-relaxed">
                    {st.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ChartItem {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

interface ChartData {
  title?: string;
  data: ChartItem[];
}

const InteractiveChartCard: React.FC<{ data: ChartData }> = ({ data }) => {
  const items = Array.isArray(data.data) ? data.data : [];
  const total = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0) || 1;

  return (
    <div className="my-3 w-full rounded-[22px] glass-card p-3.5 sm:p-4 text-left font-sans select-none shadow-xl">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg glass-tile flex items-center justify-center" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
            <ChartBar size={16} weight="duotone" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">{data.title || 'Data Breakdown'}</h4>
        </div>
      </div>

      <div className="space-y-2 pt-0.5">
        {items.map((item, idx) => {
          const val = Number(item.value) || 0;
          const percent = Math.min(100, Math.round((val / total) * 100));
          const color = item.color || (idx % 2 === 0 ? 'var(--app-accent, #7B4B36)' : 'var(--app-accent-end, #A46D52)');
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/90">{item.label}</span>
                <span className="font-mono text-white/60">{val}{item.unit || ''} ({percent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({ content, isUser = false }) => {
  const cleanContent = useMemo(() => stripJsonActions(content), [content]);

  const renderedBlocks = useMemo(() => {
    if (!cleanContent) return null;

    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
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
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--app-accent-text, #D29B7E)' }} />
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
              className="flex items-start gap-2 my-1.5 p-2 rounded-xl bg-white/5 font-sans-flex"
            >
              <span
                className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #D29B7E)',
                }}
              >
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere] font-sans-flex">
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
              className="font-bold text-xs sm:text-sm text-white mt-2 mb-1 tracking-tight font-sans-flex break-words"
            >
              {parseInlineContent(headerText, isUser)}
            </h4>
          );
          return;
        }

        flushBullets(idx);
        flushChecklist(idx);
        blocks.push(
          <p key={`p-${segIdx}-${idx}`} className="my-1 leading-relaxed text-xs sm:text-sm font-sans-flex text-white/90 break-words">
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
    <div className="allow-select select-text space-y-1 break-words max-w-full font-sans-flex">
      {renderedBlocks}
    </div>
  );
};

export default FormattedAiMessage;
