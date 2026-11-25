import { redactSensitiveInformation } from '../../utils/aiSecurity.ts';

export interface UserMemory {
  id: string;
  userId: string;
  category: 'preference' | 'study' | 'travel' | 'todo' | 'workout' | 'budget' | 'general';
  content: string;
  source: 'user_confirmed' | 'user_created';
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

const MEMORY_STORAGE_PREFIX = 'lifeos_ai_user_memory_';

function storageKeyForUser(userId: string): string {
  return `${MEMORY_STORAGE_PREFIX}${userId || 'guest'}`;
}

export function listUserMemories(userId: string): UserMemory[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalMemories(userId: string, memories: UserMemory[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(memories.slice(0, 50)));
  } catch {}
}

export async function syncMemoriesToFirestore(userId: string, memories: UserMemory[]): Promise<void> {
  if (!userId || userId === 'guest' || typeof window === 'undefined') return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../../firebase.ts');
    await setDoc(doc(db, 'users', userId, 'aiMeta', 'memory'), { memories: memories.slice(0, 50) }, { merge: true });
  } catch {}
}

export function createUserMemory(
  userId: string,
  category: UserMemory['category'],
  content: string,
  source: UserMemory['source'] = 'user_created'
): UserMemory[] {
  const sanitized = redactSensitiveInformation(content.trim()).slice(0, 280);
  if (!sanitized) return listUserMemories(userId);

  const now = new Date().toISOString();
  const next: UserMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    category,
    content: sanitized,
    source,
    createdAt: now,
    updatedAt: now,
    enabled: true,
  };

  const updated = [next, ...listUserMemories(userId)].slice(0, 50);
  saveLocalMemories(userId, updated);
  syncMemoriesToFirestore(userId, updated).catch(() => {});
  return updated;
}

export function toggleUserMemory(userId: string, memoryId: string, enabled: boolean): UserMemory[] {
  const now = new Date().toISOString();
  const updated = listUserMemories(userId).map((m) =>
    m.id === memoryId ? { ...m, enabled, updatedAt: now } : m
  );
  saveLocalMemories(userId, updated);
  syncMemoriesToFirestore(userId, updated).catch(() => {});
  return updated;
}

export function updateUserMemoryContent(userId: string, memoryId: string, content: string): UserMemory[] {
  const sanitized = redactSensitiveInformation(content.trim()).slice(0, 280);
  if (!sanitized) return listUserMemories(userId);
  const now = new Date().toISOString();
  const updated = listUserMemories(userId).map((m) =>
    m.id === memoryId ? { ...m, content: sanitized, updatedAt: now } : m
  );
  saveLocalMemories(userId, updated);
  syncMemoriesToFirestore(userId, updated).catch(() => {});
  return updated;
}

export function deleteUserMemory(userId: string, memoryId: string): UserMemory[] {
  const updated = listUserMemories(userId).filter((m) => m.id !== memoryId);
  saveLocalMemories(userId, updated);
  syncMemoriesToFirestore(userId, updated).catch(() => {});
  return updated;
}

export function formatEnabledMemoriesForPrompt(userId: string, maxItems = 8): string {
  const enabled = listUserMemories(userId).filter((m) => m.enabled).slice(0, maxItems);
  if (enabled.length === 0) return '';
  const lines = enabled.map((m) => `- [${m.category}] ${redactSensitiveInformation(m.content)}`);
  return `<user_memory>\nUser-approved preferences and facts:\n${lines.join('\n')}\n</user_memory>`;
}

