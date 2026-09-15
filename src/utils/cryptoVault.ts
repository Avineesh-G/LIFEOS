/**
 * LifeOS Secure Crypto Vault Engine
 * Zero-Knowledge Client-Side AES-256-GCM Encryption via Native Web Crypto API
 */

// ── ArrayBuffer / Base64 Helpers ─────────────────────────────────────────────

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Salt & Key Derivation (PBKDF2 + AES-GCM 256) ──────────────────────────────

export function generateRandomSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a Master PIN/Password and unique Salt
 */
export async function deriveVaultKey(masterPin: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pinBuffer = enc.encode(masterPin);
  const saltBuffer = base64ToBuffer(saltBase64);

  // Import raw master pin as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key using 100,000 PBKDF2 iterations
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a SHA-256 verification hash to quickly check if Master PIN is valid
 */
export async function hashPinForVerification(pin: string, saltBase64: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = base64ToBuffer(saltBase64);
  const pinBytes = enc.encode(pin);
  const combined = new Uint8Array(saltBytes.length + pinBytes.length);
  combined.set(saltBytes);
  combined.set(pinBytes, saltBytes.length);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
  return bufferToBase64(hashBuffer);
}

// ── AES-256-GCM Encryption / Decryption ──────────────────────────────────────

export interface EncryptedPayload {
  cipherText: string; // Base64
  iv: string;         // Base64
}

/**
 * Encrypts a plaintext password using AES-256-GCM with a unique 12-byte IV
 */
export async function encryptPassword(plainText: string, key: CryptoKey): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for GCM

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plainText)
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext
 */
export async function decryptPassword(cipherTextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const cipherBuffer = base64ToBuffer(cipherTextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as BufferSource,
    },
    key,
    cipherBuffer as BufferSource
  );

  return dec.decode(decryptedBuffer);
}

// ── Secure Password Generator ────────────────────────────────────────────────

export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export function generateSecurePassword(options: GeneratorOptions): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded confusing I, O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // excluded confusing l
  const numberChars = '23456789';                   // excluded confusing 0, 1
  const symbolChars = '!@#$%^&*()_+~|}{[]:;?><,.-=';

  let charPool = '';
  const mandatoryChars: string[] = [];

  if (options.includeUppercase) {
    charPool += uppercaseChars;
    mandatoryChars.push(uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]);
  }
  if (options.includeLowercase) {
    charPool += lowercaseChars;
    mandatoryChars.push(lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]);
  }
  if (options.includeNumbers) {
    charPool += numberChars;
    mandatoryChars.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
  }
  if (options.includeSymbols) {
    charPool += symbolChars;
    mandatoryChars.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
  }

  // Fallback if user unchecks everything
  if (!charPool) {
    charPool = uppercaseChars + lowercaseChars + numberChars;
  }

  const randomValues = new Uint32Array(options.length);
  window.crypto.getRandomValues(randomValues);

  const passwordChars: string[] = [...mandatoryChars];
  for (let i = mandatoryChars.length; i < options.length; i++) {
    passwordChars.push(charPool[randomValues[i] % charPool.length]);
  }

  // Shuffle using Fisher-Yates with crypto random
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

// ── Password Strength Evaluation ─────────────────────────────────────────────

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Bulletproof';
  color: string;
  percentage: number;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Very Weak', color: 'text-rose-500 bg-rose-500', percentage: 5 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: 'Weak', color: 'text-rose-500 bg-rose-500', percentage: 25 };
  }
  if (score === 2 || score === 3) {
    return { score: 2, label: 'Medium', color: 'text-amber-500 bg-amber-500', percentage: 50 };
  }
  if (score === 4) {
    return { score: 3, label: 'Strong', color: 'text-emerald-500 bg-emerald-500', percentage: 75 };
  }
  return { score: 4, label: 'Bulletproof', color: 'text-cyan-400 bg-cyan-400', percentage: 100 };
}
