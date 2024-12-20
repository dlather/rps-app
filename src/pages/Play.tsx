import { Navigate, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import { ConnectWalletDialog } from "../components/Dialogs";
import { encodePacked, isAddress, keccak256 } from "viem";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { RPSAbi } from "../utils/contracts/RPS";
import Loader from "../components/Loader";
import { FaCopy } from "react-icons/fa";
import {
  decryptSalt,
  deriveKey,
  indexToMove,
  uint8ArrayToBigInt,
} from "../utils";
import { toast } from "react-toastify";
import { useBalance } from "wagmi";
import { useEffect, useState } from "react";
import TransactionStatus from "../components/TransactionStatus";
import secureLocalStorage from "react-secure-storage";
import { LOCAL_STORAGE_KEYS, moves } from "../utils/constants";
import { FieldValues, useForm } from "react-hook-form";

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
      <CommonGameDetails {...playerProps} />
      {isPlayer1 ? (
        <Player1Game {...playerProps} />
      ) : (
        <Player2Game {...playerProps} />
      )}
      <ConnectWalletDialog />
    </div>
  );
};

type PlayerGameProps = {
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

const Player1Game = ({
  gameBalance,
  gameAddress,
  c1Hash,
  c2,
  TIMEOUT,
  lastAction,
}: PlayerGameProps) => {
  const [txn, setTxn] = useState<`0x${string}` | undefined>();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const currTime = Math.floor(Date.now() / 1000);
      setRemainingTime(Number(TIMEOUT) - (currTime - Number(lastAction)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [TIMEOUT, lastAction]);

  const getStakeBack =
    c2 === 0 && remainingTime < 0 && (gameBalance?.value ?? 0n) > 0n;

  const gameContract = {
    address: gameAddress as `0x${string}`,
    abi: RPSAbi,
  } as const;

  const { writeContractAsync } = useWriteContract();

  const handleGetStakeBack = async () => {
    const tHash = await writeContractAsync({
      ...gameContract,
      functionName: "j2Timeout",
    });
    setTxn(tHash);
  };

  const { register, handleSubmit } = useForm();

  const handleSolve = async (data: FieldValues) => {
    const createGameConfig = secureLocalStorage.getItem(
      LOCAL_STORAGE_KEYS.CREATE_GAME_CONFIG
    );
    if (!createGameConfig) return;

    const {
      p1Address,
      p2Address,
      signature,
      encryptedSalt: encryptedSaltString,
      saltForKDF: saltForKDFString,
    } = JSON.parse(createGameConfig as string);
    console.log(p1Address);
    console.log(p2Address);
    console.log(signature);
    console.log(encryptedSaltString);
    console.log(saltForKDFString);

    const encryptedSaltData = JSON.parse(encryptedSaltString);
    const encryptedSalt = new Uint8Array(encryptedSaltData.data);
    console.log(encryptedSalt);
    const iv = new Uint8Array(encryptedSaltData.iv);
    console.log(data.password);
    const saltForKDF = new Uint8Array(JSON.parse(saltForKDFString));
    console.log(saltForKDF);
    const key = await deriveKey(data.password, saltForKDF);
    const decryptedSalt = await decryptSalt(encryptedSalt, key, iv);
    let prevMove = 0;
    for (let i = 1; i <= 5; i++) {
      const hasherMoveHash = keccak256(
        encodePacked(
          ["uint8", "uint256"],
          [i, uint8ArrayToBigInt(decryptedSalt)]
        )
      );
      if (hasherMoveHash === c1Hash) {
        prevMove = i;
        break;
      }
    }
    const sHash = await writeContractAsync({
      ...gameContract,
      functionName: "solve",
      args: [prevMove, uint8ArrayToBigInt(decryptedSalt)],
    });
    setTxn(sHash);
    console.log("sHash", sHash);
  };

  const resetGame = () => {
    secureLocalStorage.removeItem(LOCAL_STORAGE_KEYS.CREATE_GAME_CONFIG);
    secureLocalStorage.removeItem(LOCAL_STORAGE_KEYS.CREATED_RPS_ADDRESS);
    navigate("/");
  };

  if (txn) {
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <span className="loading loading-spinner loading-lg text-white"></span>
        <TransactionStatus
          onSuccess={() => {
            toast.success("Solved successfully");
            setTxn(undefined);
            resetGame();
          }}
          txnHash={txn}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Actions</h2>
        <button className="btn btn-outline btn-primary" onClick={resetGame}>
          Reset Game
        </button>
      </div>
      {c2 !== 0 && remainingTime > 0 && (
        <form onSubmit={handleSubmit(handleSolve)}>
          <input
            type="text"
            placeholder="Enter Password"
            {...register("password", { required: "Password is required" })}
            className="input input-bordered w-full"
          />
          <button className="btn btn-outline btn-primary">Solve</button>
        </form>
      )}
      {remainingTime > 0 && (
        <div className="text-red-500">
          Time remaining: {remainingTime} seconds
        </div>
      )}
      {getStakeBack && (
        <button
          className="btn btn-outline btn-primary"
          onClick={handleGetStakeBack}
        >
          Get Stake Back
        </button>
      )}
    </div>
  );
};

const Player2Game = ({
  gameAddress,
  c2,
  stake,
  TIMEOUT,
  lastAction,
}: PlayerGameProps) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [txn, setTxn] = useState<`0x${string}` | undefined>();
  const { writeContractAsync } = useWriteContract();
  const { handleSubmit, watch, setValue } = useForm();

  const gameContract = {
    address: gameAddress as `0x${string}`,
    abi: RPSAbi,
  } as const;

  useEffect(() => {
    const updateTime = () => {
      const currTime = Math.floor(Date.now() / 1000);
      setRemainingTime(Number(TIMEOUT) - (currTime - Number(lastAction)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [TIMEOUT, lastAction]);

  const handleMove = async (data: FieldValues) => {
    const mHash = await writeContractAsync({
      ...gameContract,
      functionName: "play",
      args: [data.move],
      value: stake,
    });
    setTxn(mHash);
  };
  const selectedMove = watch("move");

  if (txn) {
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <span className="loading loading-spinner loading-lg text-white"></span>
        <TransactionStatus
          onSuccess={() => {
            toast.success("Played successfully");
            setTxn(undefined);
          }}
          txnHash={txn}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="text-red-500">
        {remainingTime > 0
          ? `Time remaining: ${remainingTime} seconds`
          : "Time's up!"}
        {remainingTime > 0 && c2 === 0 && (
          <form onSubmit={handleSubmit(handleMove)}>
            <div className="flex justify-center my-2 gap-4 w-full">
              {moves.map((m, i) => (
                <kbd
                  key={i}
                  onClick={() => {
                    setValue("move", i);
                  }}
                  className={`kbd cursor-pointer ${selectedMove === i ? "bg-primary text-white" : null}`}
                >
                  {m}
                </kbd>
              ))}
            </div>
            <button className="btn btn-outline btn-primary w-96 mt-4">
              Play
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const CommonGameDetails = (props: PlayerGameProps) => {
  const { gameAddress, j1, j2, c2, stake } = props;
  const { address, isDisconnected } = useAccount();
  if (isDisconnected || (j1 !== address && j2 !== address)) return null;

  const isPlayer1 = j1 === address;

  return (
    <div className="my-8 w-full max-w-xl mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Game Details</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Game Address:</span>
          <span className="text-gray-900">
            <Address address={gameAddress} />
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Amount Staked:</span>
          <span className="text-gray-900">{`${stake.toString()} wei`}</span>
        </div>

        {isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Address:</span>
            <span className="text-gray-900">
              <Address address={j2} />
            </span>
          </div>
        )}

        {isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Move:</span>
            <span className="text-gray-900">{indexToMove(Number(c2))}</span>
          </div>
        )}

        {!isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 1 Address:</span>
            <span className="text-gray-900">
              <Address address={j1} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const Address = ({
  address,
  asLink = true,
}: {
  address: `0x${string}` | undefined;
  asLink?: boolean;
}) => {
  const { chain } = useAccount();
  if (!address) return "N/A";

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const CopyButton = () => (
    <button
      className="p-1 hover:bg-gray-100 rounded-full tooltip text-gray-700"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(address);
        toast.success("Address copied to clipboard");
      }}
      title="Copy address"
      data-tip="Copy address"
    >
      <FaCopy className="w-3 h-3" />
    </button>
  );

  const AddressContent = () => (
    <span className="flex items-center gap-2">
      <span className="truncate" title={address}>
        {truncatedAddress}
      </span>
      <CopyButton />
    </span>
  );

  if (asLink) {
    return (
      <a
        href={`https://${chain?.name}.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center gap-2"
        title={address}
      >
        <AddressContent />
      </a>
    );
  }

  return <AddressContent />;
};

export default Play;
