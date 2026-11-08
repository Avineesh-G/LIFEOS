import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { AppData } from '../types';

interface CloudMigrationModalProps {
  user: User | null;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

/**
 * CloudMigrationModal (Decommissioned & Secured)
 * 
 * Previous implementations loaded un-scoped legacy device state ('lifeos_cached_app_data')
 * which could leak cross-account data if multiple users shared a device.
 * 
 * LifeOS now operates on strict tenant isolation where all user data is partitioned
 * by Firebase UID. This component ensures any leftover legacy cache is permanently purged
 * and returns null to prevent cross-account contamination.
 */
export default function CloudMigrationModal(_props: CloudMigrationModalProps) {
  useEffect(() => {
    try {
      localStorage.removeItem('lifeos_cached_app_data');
    } catch {}
  }, []);

  return null;
}
