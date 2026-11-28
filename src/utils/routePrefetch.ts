import { startTransition } from 'react';
import type { NavigateFunction } from 'react-router-dom';

const prefetchedRoutes = new Set<string>();

/**
 * Dynamically preloads route chunks on pointerDown or idle time
 * so React.lazy routes commit synchronously with zero loading flash.
 */
export function prefetchRoute(routePath: string): void {
  if (!routePath) return;
  const clean = routePath.split('?')[0].toLowerCase();
  const bucket =
    clean.startsWith('/gym/workout') ? '/gym/workout'
    : clean.startsWith('/gym/split') ? '/gym/split'
    : clean.startsWith('/gym/onboarding') ? '/gym/onboarding'
    : clean.startsWith('/gym/history') ? '/gym/history'
    : clean.startsWith('/gym') ? '/gym'
    : clean.startsWith('/spending') ? '/spending'
    : clean.startsWith('/shopping/') ? '/shopping/:id'
    : clean.startsWith('/shopping') ? '/shopping'
    : clean.startsWith('/outings/') ? '/outings/:id'
    : clean.startsWith('/outings') ? '/outings'
    : clean.startsWith('/calendar') ? '/calendar'
    : clean.startsWith('/ai') || clean.startsWith('/chat') ? '/ai'
    : clean.startsWith('/timetable') ? '/timetable'
    : clean.startsWith('/tasks') ? '/tasks'
    : clean.startsWith('/laundry') ? '/laundry'
    : clean.startsWith('/history') ? '/history'
    : clean.startsWith('/settings/appearance') || clean.startsWith('/settings/interface-colors') ? '/settings/appearance'
    : clean.startsWith('/settings') ? '/settings'
    : clean.startsWith('/notes') ? '/notes'
    : clean.startsWith('/focus') ? '/focus'
    : clean.startsWith('/journal') ? '/journal'
    : clean.startsWith('/circle') ? '/circle'
    : clean.startsWith('/projects') ? '/projects'
    : clean.startsWith('/trips') ? '/trips'
    : clean.startsWith('/decisions') ? '/decisions'
    : clean.startsWith('/drive') ? '/drive'
    : clean;

  if (prefetchedRoutes.has(bucket)) return;
  prefetchedRoutes.add(bucket);

  switch (bucket) {
    case '/nutrition':
      import('../data/messMenu').catch(() => {});
      break;
    case '/spending':
      import('../pages/Spending').catch(() => {});
      break;
    case '/calendar':
      import('../pages/CalendarPage').catch(() => {});
      break;
    case '/ai':
      import('../pages/LunaChatPage').catch(() => {});
      break;
    case '/tasks':
      import('../pages/Tasks').catch(() => {});
      break;
    case '/timetable':
      import('../pages/Timetable').catch(() => {});
      break;
    case '/notes':
      import('../pages/Notes').catch(() => {});
      break;
    case '/settings':
      import('../pages/Settings').catch(() => {});
      break;
    case '/settings/appearance':
      import('../pages/ThemeSettings').catch(() => {});
      break;
    case '/shopping':
      import('../pages/ShoppingLists').catch(() => {});
      break;
    case '/shopping/:id':
      import('../pages/ShoppingListDetail').catch(() => {});
      break;
    case '/outings':
      import('../features/outings/pages/OutingsListPage').catch(() => {});
      break;
    case '/outings/:id':
      import('../features/outings/pages/OutingDetailPage').catch(() => {});
      break;
    case '/laundry':
      import('../pages/Laundry').catch(() => {});
      break;
    case '/history':
      import('../pages/WorkHistory').catch(() => {});
      break;
    case '/focus':
      import('../pages/Focus').catch(() => {});
      break;
    case '/journal':
      import('../pages/Journal').catch(() => {});
      break;
    case '/circle':
      import('../pages/Circle').catch(() => {});
      break;
    case '/projects':
      import('../pages/Projects').catch(() => {});
      break;
    case '/trips':
      import('../pages/Trips').catch(() => {});
      break;
    case '/decisions':
      import('../pages/Decisions').catch(() => {});
      break;
    case '/drive':
      import('../pages/Drive').catch(() => {});
      break;
    case '/gym/workout':
      import('../pages/GymWorkout').catch(() => {});
      break;
    case '/gym/split':
      import('../pages/GymSplit').catch(() => {});
      break;
    case '/gym/onboarding':
      import('../pages/GymOnboarding').catch(() => {});
      break;
    case '/gym/history':
      import('../pages/GymExerciseHistory').catch(() => {});
      break;
  }
}

/**
 * Pre-warms primary secondary modules after initial paint settles.
 */
export function scheduleIdleRoutePrefetch(): () => void {
  const routes = ['/nutrition', '/spending', '/tasks', '/calendar', '/ai', '/notes', '/settings', '/timetable'];
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    routes.forEach((r, idx) => {
      setTimeout(() => {
        if (!cancelled) prefetchRoute(r);
      }, idx * 140);
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = (window as any).requestIdleCallback(run, { timeout: 2200 });
    return () => {
      cancelled = true;
      (window as any).cancelIdleCallback?.(id);
    };
  }
  const timer = setTimeout(run, 1600);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

/**
 * Non-blocking route switch wrapper keeping tap feedback & sheet close animations at 120 FPS.
 */
export function navigateSmooth(navigate: NavigateFunction, to: string): void {
  prefetchRoute(to);
  startTransition(() => {
    navigate(to);
  });
}

