import React, { useState, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { AppData, ProjectItem, ProjectMilestone, Task } from '../types';
import {
  LargeTitleHeader,
  Segmented,
  Button,
  Badge,
  Sheet,
  TextField,
  SearchPill,
  EmptyState,
  Plus,
  RocketLaunch,
  CheckCircle,
  Play,
  Clock,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import { getProjectMetrics, formatFocusHoursMinutes } from '../utils/projectHelpers';
import { ProjectDetailSheet } from '../components/projects/ProjectDetailSheet';

interface ProjectsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type ProjectFilter = 'active' | 'completed' | 'paused';

const CATEGORY_OPTIONS: { value: ProjectItem['category']; label: string }[] = [
  { value: 'build', label: 'Build' },
  { value: 'academic', label: 'Academic' },
  { value: 'career', label: 'Career' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

export default function Projects({ data, updateData }: ProjectsProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Add/Edit Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ProjectItem['category']>('build');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [firstMilestoneInput, setFirstMilestoneInput] = useState('');

  const projects = data.projects || [];
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects]
  );

  const filteredProjects = useMemo(() => {
    let list = projects.filter((p) => {
      if (filter === 'active') return p.status === 'active';
      if (filter === 'completed') return p.status === 'completed';
      return p.status === 'paused' || p.status === 'archived';
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          p.milestones.some((m) => m.title.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, filter, searchQuery]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const openAddModal = () => {
    setEditingId(null);
    setTitleInput('');
    setCategoryInput('build');
    setTargetDateInput('');
    setDescInput('');
    setFirstMilestoneInput('');
    setEditorOpen(true);
  };

  const openEditModal = (project: ProjectItem) => {
    setEditingId(project.id);
    setTitleInput(project.title);
    setCategoryInput(project.category);
    setTargetDateInput(project.targetDate || '');
    setDescInput(project.description || '');
    setFirstMilestoneInput('');
    setEditorOpen(true);
  };

  const handleSaveProject = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) return;
    triggerHaptic('success');
    const nowIso = new Date().toISOString();

    if (editingId) {
      const next = projects.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title: trimmed,
              category: categoryInput,
              targetDate: targetDateInput.trim() || undefined,
              description: descInput.trim() || '',
              updatedAt: nowIso,
            }
          : p
      );
      await updateData({ projects: next });
    } else {
      const initialMilestones: ProjectMilestone[] = firstMilestoneInput.trim()
        ? [{ id: `ms_${Date.now()}`, title: firstMilestoneInput.trim(), completed: false }]
        : [];
      const newProject: ProjectItem = {
        id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: trimmed,
        category: categoryInput,
        status: 'active',
        targetDate: targetDateInput.trim() || undefined,
        description: descInput.trim() || '',
        blockerNote: '',
        milestones: initialMilestones,
        linkedDriveFileIds: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await updateData({ projects: [newProject, ...projects] });
    }
    setEditorOpen(false);
  };

  const handleUpdateProject = async (updated: ProjectItem) => {
    await updateData({
      projects: projects.map((p) => (p.id === updated.id ? updated : p)),
    });
  };

  const handleDeleteProject = async (id: string) => {
    triggerHaptic('error');
    await updateData({ projects: projects.filter((p) => p.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const handleToggleMilestone = async (project: ProjectItem, msId: string) => {
    triggerHaptic('selection');
    await handleUpdateProject({
      ...project,
      milestones: project.milestones.map((m) =>
        m.id === msId ? { ...m, completed: !m.completed } : m
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePushMilestoneToTask = async (project: ProjectItem, ms: ProjectMilestone) => {
    triggerHaptic('success');
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: `${project.title}: ${ms.title}`,
      subtask: `Milestone from ${project.title}`,
      completed: false,
      date: format(new Date(), 'yyyy-MM-dd'),
    };
    const updatedProj: ProjectItem = {
      ...project,
      milestones: project.milestones.map((m) =>
        m.id === ms.id ? { ...m, pushedTaskId: newTask.id } : m
      ),
      updatedAt: new Date().toISOString(),
    };
    await updateData({
      tasks: [newTask, ...(data.tasks || [])],
      projects: projects.map((p) => (p.id === updatedProj.id ? updatedProj : p)),
    });
  };

  const handleLaunchFocus = (project: ProjectItem, milestoneTitle?: string) => {
    triggerHaptic('medium');
    const label = milestoneTitle ? `${project.title} — ${milestoneTitle}` : project.title;
    try {
      const raw = localStorage.getItem('lifeos_focus_timer_v1');
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        'lifeos_focus_timer_v1',
        JSON.stringify({
          ...parsed,
          targetLabel: label,
          linkedTaskId: undefined,
          linkedProjectId: project.id,
        })
      );
    } catch {}
    startTransition(() => {
      navigate('/focus');
    });
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Projects"
        subtitle="Multi-step goals, milestones & deep work"
        actions={
          <div className="flex items-center gap-2">
            <Badge count={activeCount} label="Active" />
            <Button
              variant="glass"
              size="sm"
              icon={<Plus size={15} weight="bold" />}
              onClick={openAddModal}
            >
              New
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        <SearchPill
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search projects or milestones..."
        />

        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'paused', label: 'Paused' },
          ]}
        />

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<RocketLaunch size={32} weight="duotone" />}
            title={projects.length === 0 ? 'No projects yet' : 'Nothing in this view'}
            description={
              projects.length === 0
                ? 'Break hackathons, builds, or coursework into clear milestones linked to Focus Studio.'
                : 'Switch filter tabs or create a new project.'
            }
            actionLabel={projects.length === 0 ? 'Create First Project' : undefined}
            onAction={projects.length === 0 ? openAddModal : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const metrics = getProjectMetrics(project, data.studySessions || []);
              const nextMs = project.milestones.find((m) => !m.completed);

              return (
                <article
                  key={project.id}
                  className="p-4 rounded-[24px] liquid-glass space-y-3"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(project.id);
                      }
                    }}
                    className="cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08]"
                            style={{ color: accentText }}
                          >
                            {project.category}
                          </span>
                          {metrics.daysLeft !== null && (
                            <span className="text-sub tabular-nums">
                              {metrics.daysLeft === 0
                                ? 'Due today'
                                : metrics.daysLeft > 0
                                ? `In ${metrics.daysLeft}d`
                                : `${Math.abs(metrics.daysLeft)}d overdue`}
                            </span>
                          )}
                        </div>
                        <h3 className="text-card-title text-white mt-1.5">{project.title}</h3>
                      </div>

                      <span className="text-xs font-bold tabular-nums text-[rgba(240,240,245,0.75)] shrink-0">
                        {Math.round(metrics.progressRatio * 100)}%
                      </span>
                    </div>

                    {/* GPU-composited progress bar */}
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: 'var(--preset-gradient, linear-gradient(90deg, #7B4B36, #A46D52))',
                          transform: `scaleX(${Math.max(0.03, metrics.progressRatio)})`,
                          transformOrigin: 'left',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[rgba(235,235,245,0.58)]">
                      <span className="tabular-nums">
                        {metrics.doneMilestones}/{metrics.totalMilestones} milestones
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock size={12} weight="duotone" style={{ color: accentText }} />
                        {formatFocusHoursMinutes(metrics.focusMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Next Milestone Quick Action Row */}
                  {nextMs && (
                    <div className="pt-2 flex items-center justify-between gap-2 bg-white/[0.03] px-3 py-2 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => void handleToggleMilestone(project, nextMs.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <CheckCircle size={16} weight="duotone" style={{ color: accentText }} className="shrink-0" />
                        <span className="text-xs font-medium text-white truncate">
                          Next: {nextMs.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLaunchFocus(project, nextMs.title)}
                        className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-bold flex items-center gap-1 shrink-0"
                        style={{ color: accentText }}
                      >
                        <Play size={11} weight="fill" />
                        <span>Focus</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Detail Sheet */}
      <ProjectDetailSheet
        project={selectedProject}
        studySessions={data.studySessions || []}
        driveFiles={data.driveFiles || []}
        tasks={data.tasks || []}
        onClose={() => setSelectedId(null)}
        onUpdateProject={handleUpdateProject}
        onEditProject={openEditModal}
        onDeleteProject={handleDeleteProject}
        onPushMilestoneToTask={handlePushMilestoneToTask}
        onLaunchFocus={handleLaunchFocus}
      />

      {/* Add / Edit Project Sheet */}
      <Sheet
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        detent="full"
        title={editingId ? 'Edit Project' : 'New Project'}
      >
        <div className="space-y-4 pb-8">
          <TextField
            label="Project Title"
            placeholder="e.g., LifeOS v3.5 Release, OS Semester Project"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onClear={() => setTitleInput('')}
          />

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = categoryInput === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCategoryInput(opt.value);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      active ? 'droplet-active' : 'bg-white/[0.06] text-[rgba(240,240,245,0.72)]'
                    }`}
                    style={active ? { color: accentText } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <TextField
            label="Target Date (YYYY-MM-DD, optional)"
            placeholder="e.g., 2026-12-15"
            value={targetDateInput}
            onChange={(e) => setTargetDateInput(e.target.value)}
            onClear={() => setTargetDateInput('')}
          />

          {!editingId && (
            <TextField
              label="First Milestone (optional)"
              placeholder="e.g., Draft system architecture & wire endpoints"
              value={firstMilestoneInput}
              onChange={(e) => setFirstMilestoneInput(e.target.value)}
              onClear={() => setFirstMilestoneInput('')}
            />
          )}

          <div className="space-y-1.5">
            <label className="text-label pl-1 block">Summary / Scope</label>
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={3}
              placeholder="Goal or definition of done..."
              className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
            />
          </div>

          <Button variant="prominent" size="lg" className="w-full" onClick={handleSaveProject}>
            {editingId ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

