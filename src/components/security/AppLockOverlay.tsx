import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import {
  getSecurityConfig,
  isAppLocked,
  subscribeToLockState,
  authenticateDeviceLock,
} from '../../utils/security';

export default function AppLockOverlay() {
  // Native phone lock is marked 'Coming Soon' while hardware integration is finalized
  return null;
}
