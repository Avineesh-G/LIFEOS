import React, { useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { ProjectItem, ProjectMilestone, ProjectStatus, StudySession, DriveFile, Task } from '../../types';
import { Sheet } from '../../ui/feedback/Sheet';
import { Button } from '../../ui/controls/Button';
import { TextField } from '../../ui/controls/TextField';
import { GroupedList } from '../../ui/grouped/GroupedList';
import { ListRow } from '../../ui/grouped/ListRow';
import {
  CheckCircle,
  CircleIcon,
  Plus,
  Trash,
  Play,
  Flag,
  LinkSimple,
  FileText,
  PencilSimple,
  ArrowRight,
  Clock,
  Brain,
  SpinnerGap,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { getProjectMetrics, formatFocusHoursMinutes } from '../../utils/projectHelpers';
import { suggestProjectMilestones } from '../../services/newInterfaceAiService';

export interface ProjectDetailSheetProps {
  project: ProjectItem | null;
  studySessions: StudySession[];
  driveFiles: DriveFile[];
  tasks: Task[];
  onClose: () => void;
  onUpdateProject: (updated: ProjectItem) => Promise<void>;
  onEditProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onPushMilestoneToTask: (project: ProjectItem, milestone: ProjectMilestone) => Promise<void>;
  onLaunchFocus: (project: ProjectItem, milestoneTitle?: string) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function ProjectDetailSheet({
  project,
  studySessions,
  driveFiles,
  onClose,
  onUpdateProject,
  onEditProject,
  onDeleteProject,
  onPushMilestoneToTask,
  onLaunchFocus,
}: ProjectDetailSheetProps) {
  const navigate = useNavigate();
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ milestones: string[]; tip: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!project) return null;

  const accentText = 'var(--app-accent-text, #D29B7E)';
  const metrics = getProjectMetrics(project, studySessions);
  const linkedFiles = driveFiles.filter((f) => (project.linkedDriveFileIds || []).includes(f.id));

  const handleAddMilestone = async () => {
    const trimmed = newMilestoneTitle.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    setNewMilestoneTitle('');
    const ms: ProjectMilestone = {
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      completed: false,
    };
    await onUpdateProject({
      ...project,
      milestones: [...project.milestones, ms],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleMilestone = async (msId: string) => {
    triggerHaptic('selection');
    const nextMilestones = project.milestones.map((m) =>
      m.id === msId ? { ...m, completed: !m.completed } : m
    );
    await onUpdateProject({
      ...project,
      milestones: nextMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteMilestone = async (msId: string) => {
    triggerHaptic('light');
    await onUpdateProject({
      ...project,
      milestones: project.milestones.filter((m) => m.id !== msId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleDriveFile = async (fileId: string) => {
    triggerHaptic('selection');
    const current = project.linkedDriveFileIds || [];
    const next = current.includes(fileId)
      ? current.filter((id) => id !== fileId)
      : [...current, fileId];
    await onUpdateProject({
      ...project,
      linkedDriveFileIds: next,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Sheet
      isOpen={Boolean(project)}
      onClose={onClose}
      detent="full"
      title={project.title}
    >
      <div className="space-y-4 pb-8">
        {/* Progress & Focus Overview */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-badge capitalize px-2.5 py-0.5 rounded-full bg-white/[0.08]"
                  style={{ color: accentText }}
                >
                  {project.category}
                </span>
                {metrics.daysLeft !== null && (
                  <span className="text-sub tabular-nums">
                    {metrics.daysLeft === 0
                      ? 'Due today'
                      : metrics.daysLeft > 0
                      ? `${metrics.daysLeft}d left`
                      : `${Math.abs(metrics.daysLeft)}d overdue`}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sub mt-2 leading-relaxed">{project.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white hover:bg-white/[0.14] shrink-0"
              aria-label="Edit project"
            >
              <PencilSimple size={16} weight="duotone" />
            </button>
          </div>

          <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                transform: `scaleX(${Math.max(0.03, metrics.progressRatio)})`,
                transformOrigin: 'left',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-sub tabular-nums">
              {metrics.doneMilestones}/{metrics.totalMilestones} milestones
            </span>
            <span className="font-semibold text-white flex items-center gap-1 tabular-nums">
              <Clock size={13} weight="duotone" style={{ color: accentText }} />
              {formatFocusHoursMinutes(metrics.focusMinutes)} focused
            </span>
          </div>

          <Button
            variant="prominent"
            size="md"
            className="w-full"
            icon={<Play size={16} weight="fill" />}
            onClick={() => {
              onClose();
              onLaunchFocus(project, metrics.nextMilestoneTitle || undefined);
            }}
          >
            {metrics.nextMilestoneTitle ? `Focus: ${metrics.nextMilestoneTitle}` : 'Start Focus Block'}
          </Button>
        </section>

        {/* Status Selector */}
        <section className="p-3.5 rounded-[22px] glow-card space-y-2">
          <span className="text-section-header block">Status</span>
          <div className="grid grid-cols-4 gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const active = project.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    void onUpdateProject({
                      ...project,
                      status: opt.value,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                    active ? 'droplet-active' : 'bg-white/[0.04] text-[rgba(240,240,245,0.68)]'
                  }`}
                  style={active ? { color: accentText } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Ordered Milestones */}
        <section className="p-4 rounded-[24px] glow-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-section-header">Milestones</span>
            <button
              type="button"
              disabled={aiLoading}
              onClick={async () => {
                triggerHaptic('selection');
                setAiLoading(true);
                setAiError(null);
                try {
                  const res = await suggestProjectMilestones(
                    project,
                    project.blockerNote?.trim() ? 'unblock' : 'milestones'
                  );
                  setAiSuggestions(res);
                } catch (err: any) {
                  setAiError(err?.message || 'Could not reach Luna AI.');
                } finally {
                  setAiLoading(false);
                }
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
              style={{ color: accentText }}
            >
              {aiLoading ? <SpinnerGap size={12} className="animate-spin" /> : <Brain size={12} weight="duotone" />}
              <span>{project.blockerNote?.trim() ? 'Luna Unblock' : 'Luna Suggest'}</span>
            </button>
          </div>
          {aiError && <p className="text-xs text-[#FF453A]">{aiError}</p>}
          {aiSuggestions && (
            <div className="p-3 rounded-2xl bg-white/[0.04] space-y-2">
              {aiSuggestions.tip && <p className="text-xs text-[rgba(240,240,245,0.85)]">{aiSuggestions.tip}</p>}
              <div className="flex flex-wrap gap-1.5">
                {aiSuggestions.milestones.map((msTitle, i) => (
                  <button
                    key={`ai_ms_${i}`}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      void onUpdateProject({
                        ...project,
                        milestones: [
                          ...project.milestones,
                          { id: `ms_${Date.now()}_${i}`, title: msTitle, completed: false },
                        ],
                        updatedAt: new Date().toISOString(),
                      });
                      setAiSuggestions((prev) =>
                        prev ? { ...prev, milestones: prev.milestones.filter((_, idx) => idx !== i) } : null
                      );
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-semibold text-white text-left"
                  >
                    + {msTitle}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <TextField
              placeholder="Add next concrete milestone..."
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              onClear={() => setNewMilestoneTitle('')}
            />
            <Button variant="glass" icon={<Plus size={16} weight="bold" />} onClick={handleAddMilestone}>
              Add
            </Button>
          </div>

          {project.milestones.length === 0 ? (
            <p className="text-sub py-1">Break this project into smaller steps above.</p>
          ) : (
            <div className="space-y-1.5">
              {project.milestones.map((ms) => (
                <div
                  key={ms.id}
                  className="px-3 py-2.5 rounded-[16px] bg-white/[0.04] flex items-center gap-2.5"
                >
                  <button
                    type="button"
                    onClick={() => void handleToggleMilestone(ms.id)}
                    className="shrink-0"
                    style={{ color: ms.completed ? accentText : 'rgba(240,240,245,0.45)' }}
                    aria-label="Toggle milestone"
                  >
                    {ms.completed ? <CheckCircle size={19} weight="fill" /> : <CircleIcon size={19} />}
                  </button>
                  <span
                    className={`text-sm flex-1 min-w-0 truncate ${
                      ms.completed ? 'line-through text-[rgba(235,235,245,0.42)]' : 'text-white font-medium'
                    }`}
                  >
                    {ms.title}
                  </span>
                  {!ms.completed && !ms.pushedTaskId && (
                    <button
                      type="button"
                      onClick={() => void onPushMilestoneToTask(project, ms)}
                      className="px-2 py-1 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-[10px] font-bold shrink-0"
                      style={{ color: accentText }}
                      title="Add to Today's To-Do Tasks"
                    >
                      + Task
                    </button>
                  )}
                  {ms.pushedTaskId && (
                    <span className="text-[10px] font-semibold text-[rgba(235,235,245,0.45)] shrink-0">
                      In Tasks
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDeleteMilestone(ms.id)}
                    className="p-1 text-[rgba(235,235,245,0.38)] hover:text-[#FF453A] shrink-0"
                    aria-label="Delete milestone"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Blocker Note */}
        <section className="p-4 rounded-[24px] glow-card space-y-2">
          <div className="flex items-center gap-1.5">
            <Flag size={14} weight="duotone" style={{ color: accentText }} />
            <span className="text-section-header">Current Blocker / Notes</span>
          </div>
          <textarea
            value={project.blockerNote || ''}
            onChange={(e) => {
              void onUpdateProject({
                ...project,
                blockerNote: e.target.value,
                updatedAt: new Date().toISOString(),
              });
            }}
            rows={2}
            placeholder="Anything waiting on someone else, a bug, or next setup..."
            className="w-full rounded-[14px] bg-[#222228] px-3.5 py-2 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
          />
        </section>

        {/* Linked Drive Files */}
        <section className="p-4 rounded-[24px] glow-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-section-header flex items-center gap-1.5">
              <LinkSimple size={14} weight="duotone" style={{ color: accentText }} />
              Linked Drive Docs ({linkedFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setFilePickerOpen((v) => !v)}
              className="text-xs font-bold"
              style={{ color: accentText }}
            >
              {filePickerOpen ? 'Done' : 'Link Files'}
            </button>
          </div>

          {linkedFiles.length > 0 && (
            <div className="space-y-1.5">
              {linkedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    startTransition(() => {
                      navigate('/drive');
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between gap-2 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText size={15} weight="duotone" style={{ color: accentText }} />
                    <span className="text-xs font-medium text-white truncate">{file.name}</span>
                  </span>
                  <ArrowRight size={13} className="text-[rgba(235,235,245,0.45)] shrink-0" />
                </button>
              ))}
            </div>
          )}

          {filePickerOpen && (
            <div className="pt-2 space-y-1 max-h-40 overflow-y-auto">
              {driveFiles.length === 0 ? (
                <p className="text-sub">Upload specs or PDFs in Drive & Docs to link them here.</p>
              ) : (
                driveFiles.slice(0, 15).map((file) => {
                  const isLinked = (project.linkedDriveFileIds || []).includes(file.id);
                  return (
                    <button
                      key={`pick_${file.id}`}
                      type="button"
                      onClick={() => void handleToggleDriveFile(file.id)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] flex items-center justify-between text-left"
                    >
                      <span className="text-xs text-white truncate">{file.name}</span>
                      <span className="text-[11px] font-bold" style={{ color: isLinked ? accentText : 'rgba(235,235,245,0.4)' }}>
                        {isLinked ? 'Linked' : 'Link'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Delete */}
        <Button
          variant="glass"
          className="w-full text-[#FF453A]"
          icon={<Trash size={16} weight="duotone" />}
          onClick={async () => {
            await onDeleteProject(project.id);
            onClose();
          }}
        >
          Delete Project
        </Button>
      </div>
    </Sheet>
  );
}

