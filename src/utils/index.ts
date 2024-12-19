export function generateSalt(length: number) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

export async function deriveKey(
  password: string | undefined,
  salt: BufferSource
) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSalt(salt: BufferSource, key: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    salt
  );

  return { iv, encryptedSalt: new Uint8Array(encrypted) };
}

export async function decryptSalt(
  encryptedSalt: BufferSource,
  key: CryptoKey,
  iv: BufferSource
) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedSalt
  );

  return new Uint8Array(decrypted);
}

export function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  let hex = "0x";
  for (const byte of arr) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return BigInt(hex);
}

export function setSecureCookie(name: string, value: string, mins: number) {
  const date = new Date();
  date.setTime(date.getTime() + mins * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/;Secure;HttpOnly;SameSite=Strict`;
}
