export type PlayerGameProps = {
  gameAddress: `0x${string}`;
  j1: `0x${string}`;
  j2: `0x${string}`;
  c1Hash: `0x${string}`;
  c2: number;
  stake: bigint;
  TIMEOUT: bigint;
  lastAction: bigint;
};

export type HashConfigForMove = {
  hasherMoveHash: `0x${string}`;
  signature: `0x${string}`;
  encryptedSalt: Uint8Array;
  iv: Uint8Array;
  saltForKDF: Uint8Array;
};

export type GameCreationFormData = {
  move: number;
  stake: number;
  p2Address: string;
  password: string;
};
