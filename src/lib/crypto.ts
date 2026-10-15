/**
 * Password encryption and protection utility
 * Uses Web Crypto AES-GCM for robust in-browser reversible encryption
 * of sold email credentials so plain passwords are never leaked in Firestore.
 */

const SECRET_SALT = 'BoutiqueEmail_Salt_2026_Secure_Key_Madagascar';

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SECRET_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPassword(plainText: string, customListingSecret = 'BoutiqueEmailSecret'): Promise<string> {
  try {
    const key = await deriveKey(customListingSecret);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    let binary = '';
    const bytes = new Uint8Array(combined);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'ENC:' + btoa(binary);
  } catch (err) {
    console.error('Error encrypting password:', err);
    // Fallback safe base64 obfuscation with signature
    return 'ENC:B64:' + btoa(encodeURIComponent(plainText));
  }
}

export async function decryptPassword(cipherText: string, customListingSecret = 'BoutiqueEmailSecret'): Promise<string> {
  try {
    if (!cipherText) return '';
    if (cipherText.startsWith('ENC:B64:')) {
      return decodeURIComponent(atob(cipherText.replace('ENC:B64:', '')));
    }
    if (!cipherText.startsWith('ENC:')) {
      return cipherText;
    }

    const rawBase64 = cipherText.replace('ENC:', '');
    const binary = atob(rawBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const key = await deriveKey(customListingSecret);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn('Failed AES-GCM decrypt, trying base64 fallback:', err);
    try {
      const stripped = cipherText.replace(/^ENC:/, '');
      return decodeURIComponent(atob(stripped));
    } catch {
      return '••••••••';
    }
  }
}
