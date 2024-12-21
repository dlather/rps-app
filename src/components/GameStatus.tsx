import React, { useState } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { RPSAbi } from "../utils/contracts/RPS";
import { formatUnits } from "viem";
import TransactionStatus from "./TransactionStatus";
import secureLocalStorage from "react-secure-storage";
const possibleMoves = [
  "Waiting...",
  "Rock",
  "Paper",
  "Scissors",
  "Spock",
  "Lizard",
];

type GameStatusProps = {
  gameAddress: `0x${string}`;
  setCurrentGameAddress: React.Dispatch<
    React.SetStateAction<`0x${string}` | null>
  >;
};
// TODO: Only refetch player 2 move
// TODO: Update time left properly
// TODO: Dont show get stake back when txn in progress

const GameStatus: React.FC<GameStatusProps> = ({
  gameAddress,
  setCurrentGameAddress,
}) => {
  const { chain } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [txnHash, setTxnHash] = useState<`0x${string}` | null>(null);
  const gameContract = {
    address: gameAddress,
    abi: RPSAbi,
  } as const;

  const {
    data: staticData,
    isRefetching: staticIsRefetching,
    isLoading: staticIsLoading,
    isFetching: staticIsFetching,
    error: staticError,
  } = useReadContracts({
    contracts: [
      { ...gameContract, functionName: "j2" },
      { ...gameContract, functionName: "TIMEOUT" },
      { ...gameContract, functionName: "stake" },
    ],
    query: {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const {
    data: dynamicData,
    isRefetching: dynamicIsRefetching,
    isLoading: dynamicIsLoading,
    isFetching: dynamicIsFetching,
    error: dynamicError,
  } = useReadContracts({
    contracts: [
      { ...gameContract, functionName: "lastAction" },
      { ...gameContract, functionName: "c2" },
    ],
    query: {
      refetchInterval: 2000,
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const isLoading =
    staticIsLoading ||
    dynamicIsLoading ||
    staticIsFetching ||
    dynamicIsFetching ||
    staticIsRefetching ||
    dynamicIsRefetching;

  const data = [...(staticData ?? []), ...(dynamicData ?? [])];
  const error = staticError || dynamicError;

  const currTime = (Date.now() / 1000).toFixed();
  const j2 = data?.[0]?.result as `0x${string}` | undefined;
  const TIMEOUT = data?.[1]?.result as bigint | undefined;
  const stake = data?.[2]?.result as bigint | undefined;
  const lastAction = data?.[3]?.result as bigint | undefined;
  const c2 = data?.[4]?.result as number | undefined;

  const getStakeBack =
    c2 === 0 && Number(lastAction) + Number(TIMEOUT) < Number(currTime);
  const remainingTime =
    Number(TIMEOUT) - (Number(currTime) - Number(lastAction));

  const formatDuration = (duration: bigint | number | undefined) => {
    if (duration === undefined) return "N/A";
    const totalSeconds = Number(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatStake = (wei: bigint | undefined) => {
    if (wei === undefined) return "N/A";
    return `${formatUnits(wei, 0)} wei`;
  };

  const formatAddress = (address: `0x${string}` | undefined) => {
    if (!address) return "N/A";
    return (
      <a
        href={`https://${chain?.name}.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
      >
        {address}
      </a>
    );
  };

  const handleGetStakeBack = async () => {
    const tx = await writeContractAsync({
      abi: RPSAbi,
      address: gameAddress,
      functionName: "j2Timeout",
    });
    console.log(tx);
    setTxnHash(tx);
  };

  return (
    <div className="max-w-2xl my-8 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Game Details</h2>
        {isLoading && (
          <div className="flex items-center">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {!error && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Game Address:</span>
            <span className="text-gray-900">{formatAddress(gameAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Contract Balance:</span>
            <span className="text-gray-900">{formatStake(stake)}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Address:</span>
            <span className="text-gray-900">{formatAddress(j2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Move:</span>
            <span className="text-gray-900">{possibleMoves[Number(c2)]}</span>
          </div>

          {/* <div className="flex justify-between">
            <span className="font-medium text-gray-700">Last Action:</span>
            <span className="text-gray-900">{formatTimestamp(lastAction)}</span>
          </div> */}

          {remainingTime > 0 && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Time left:</span>
              <span className="text-gray-900">
                {formatDuration(remainingTime)}
              </span>
            </div>
          )}

          {getStakeBack && (
            <div className="btn btn-primary" onClick={handleGetStakeBack}>
              Get Stake back
            </div>
          )}

          {txnHash && (
            <TransactionStatus
              txnHash={txnHash}
              onSuccess={() => {
                secureLocalStorage.removeItem("RPSAddress");
                secureLocalStorage.removeItem("createGameConfig");
                setTxnHash(null);
                setCurrentGameAddress(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GameStatus;
