import { encodePacked, keccak256, toHex } from "viem";
import { signMessage } from "@wagmi/core";
import { config } from "../config";
import { HashConfigForMove } from "./types";
import secureLocalStorage from "react-secure-storage";
import { LOCAL_STORAGE_KEYS } from "./constants";

export function generateSalt(length: number) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

export async function deriveKey(
  password: string | undefined,
  salt: BufferSource
) {
  if (!password) {
    throw new Error("Password is required");
  }

  try {
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
  } catch (error) {
    throw new Error("Failed to derive key: " + (error as Error).message);
  }
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
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedSalt
    );

    return new Uint8Array(decrypted);
  } catch (error) {
    throw new Error("Failed to decrypt salt: " + (error as Error).message);
  }
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

const movesMapping = ["N/A", "Rock", "Paper", "Scissors", "Spock", "Lizard"];
export const indexToMove = (index: number) => {
  return movesMapping[index];
};

export const getHashConfigForMove = async (data: {
  password: string;
  move: number;
}): Promise<HashConfigForMove> => {
  const { password, move } = data;

  const salt = generateSalt(32);
  const saltForKDF = generateSalt(16);
  const key = await deriveKey(password, saltForKDF);
  const { iv, encryptedSalt } = await encryptSalt(salt, key);
  const encryptedSaltArray = Array.from(encryptedSalt);
  const messageToSign = toHex(new Uint8Array(encryptedSaltArray));
  const signature = await signMessage(config, {
    message: { raw: messageToSign },
  });
  const hasherMoveHash = keccak256(
    encodePacked(["uint8", "uint256"], [move + 1, uint8ArrayToBigInt(salt)])
  );
  return {
    hasherMoveHash,
    signature,
    encryptedSalt,
    iv,
    saltForKDF,
  };
};

export const storeCreateGameCreds = (data: {
  signature: string;
  iv: Uint8Array;
  encryptedSalt: Uint8Array;
  saltForKDF: Uint8Array;
  p1Address: string;
  p2Address: string;
}) => {
  const { signature, iv, encryptedSalt, saltForKDF, p1Address, p2Address } =
    data;
  const createGameConfig: Record<string, string> = {
    signature,
    encryptedSalt: JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(encryptedSalt),
    }),
    saltForKDF: JSON.stringify(Array.from(saltForKDF)),
    p1Address,
    p2Address,
  };
  secureLocalStorage.setItem(
    LOCAL_STORAGE_KEYS.CREATE_GAME_CONFIG,
    JSON.stringify(createGameConfig)
  );
};

export const getGameMoveAndSalt = async (
  password: string,
  c1Hash: `0x${string}`
) => {
  const createGameConfig = secureLocalStorage.getItem(
    LOCAL_STORAGE_KEYS.CREATE_GAME_CONFIG
  );
  if (!createGameConfig) throw new Error("No create game config found");

  const { encryptedSalt: encryptedSaltString, saltForKDF: saltForKDFString } =
    JSON.parse(createGameConfig as string);

  const { data, iv } = JSON.parse(encryptedSaltString);
  const encryptedSalt = new Uint8Array(data);
  const saltForKDF = new Uint8Array(JSON.parse(saltForKDFString));

  const key = await deriveKey(password, saltForKDF);
  const decryptedSalt = await decryptSalt(
    encryptedSalt,
    key,
    new Uint8Array(iv)
  );

  const prevMove = findPreviousMove(decryptedSalt, c1Hash);
  if (!prevMove) throw new Error("Could not find matching move");

  return { prevMove, decryptedSalt };
};

export const findPreviousMove = (
  decryptedSalt: Uint8Array,
  c1Hash: `0x${string}`
): number => {
  for (let i = 1; i <= 5; i++) {
    const hasherMoveHash = keccak256(
      encodePacked(["uint8", "uint256"], [i, uint8ArrayToBigInt(decryptedSalt)])
    );
    if (hasherMoveHash === c1Hash) {
      return i;
    }
  }
  return 0;
};
