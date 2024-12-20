import { Navigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import { ConnectWalletDialog } from "../components/Dialogs";
import { isAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { RPSAbi } from "../utils/contracts/RPS";
import Loader from "../components/Loader";
import { useBalance } from "wagmi";
import GameDetails from "../components/GameDetails";
import Player1Game from "../components/Player1";
import Player2Game from "../components/Player2";

const Play = () => {
  const { gameAddress = "" } = useParams();
  const { address: playerAddress } = useAccount();

  const gameContract = {
    address: gameAddress as `0x${string}`,
    abi: RPSAbi,
  } as const;

  const {
    data,
    isLoading: gameDataLoading,
    error: gameDataError,
  } = useReadContracts({
    contracts: [
      { ...gameContract, functionName: "j1" },
      { ...gameContract, functionName: "j2" },
      { ...gameContract, functionName: "c1Hash" },
      { ...gameContract, functionName: "c2" },
      { ...gameContract, functionName: "stake" },
      { ...gameContract, functionName: "TIMEOUT" },
      { ...gameContract, functionName: "lastAction" },
    ],
    query: {
      enabled: isAddress(gameAddress),
      refetchInterval: 2000,
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });
  const {
    data: gameBalance,
    isLoading: gameBalanceLoading,
    error: gameBalanceError,
  } = useBalance({
    address: gameAddress as `0x${string}`,
  });

  if (!gameAddress || !isAddress(gameAddress)) {
    return <Navigate to="/" />;
  }

  const isLoading = gameDataLoading || gameBalanceLoading;
  const error = gameDataError || gameBalanceError;

  if (isLoading) return <Loader />;

  if (error) {
    return <div>Error : {error.message}</div>;
  }

  const [j1, j2, c1Hash, c2, stake, TIMEOUT, lastAction] = (data ?? []).map(
    ({ result }) => result
  ) as [
    `0x${string}`,
    `0x${string}`,
    `0x${string}`,
    number,
    bigint,
    bigint,
    bigint,
  ];

  if (j1 !== playerAddress && j2 !== playerAddress) {
    return <div className="text-white">You are not in this game</div>;
  }

  const isPlayer1 = j1 === playerAddress;

  const playerProps = {
    gameAddress,
    gameBalance,
    j1,
    j2,
    c1Hash,
    c2,
    stake,
    TIMEOUT,
    lastAction,
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-2xl font-bold text-white">
        Welcome to the game! You are Player {isPlayer1 ? "1" : "2"}
      </div>
      <GameDetails {...playerProps} />
      {isPlayer1 ? (
        <Player1Game {...playerProps} />
      ) : (
        <Player2Game {...playerProps} />
      )}
      <ConnectWalletDialog />
    </div>
  );
};

export default Play;
