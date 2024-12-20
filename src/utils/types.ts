export type PlayerGameProps = {
  gameBalance:
    | {
        decimals: number;
        formatted: string;
        symbol: string;
        value: bigint;
      }
    | undefined;
  gameAddress: `0x${string}`;
  j1: `0x${string}`;
  j2: `0x${string}`;
  c1Hash: `0x${string}`;
  c2: number;
  stake: bigint;
  TIMEOUT: bigint;
  lastAction: bigint;
};
