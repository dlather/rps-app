import { useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { useWriteContract } from "wagmi";
import { uint8ArrayToBigInt, getGameMoveAndSalt } from "../utils";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";
import { simulateContract } from "@wagmi/core";
import { RPSAbi } from "../utils/contracts/RPS";
import { PlayerGameProps } from "../utils/types";
import TransactionStatus from "./common/TransactionStatus";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import { FaTrash } from "react-icons/fa";
import { InLineLoader } from "./common/Loader";
import { config } from "../config";

const Player1Game = ({
  gameAddress,
  c1Hash,
  c2,
  stake,
  TIMEOUT,
  lastAction,
}: PlayerGameProps) => {
  const [t2TimeoutTxn, setT2TimeoutTxn, removeT2TimeoutTxn] = useLocalStorage<
    `0x${string}` | undefined
  >(LOCAL_STORAGE_KEYS.T2_TIMEOUT_TXN_HASH, undefined);
  const [solveTxn, setSolveTxn, removeSolveTxn] = useLocalStorage<
    `0x${string}` | undefined
  >(LOCAL_STORAGE_KEYS.SOLVE_TXN_HASH, undefined);

  const [isLoading, setIsLoading] = useState(false);
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

  const getStakeBack = c2 === 0 && remainingTime < 0 && stake > 0n;

  const gameContract = {
    address: gameAddress as `0x${string}`,
    abi: RPSAbi,
  } as const;

  const { writeContractAsync } = useWriteContract();

  const handleGetStakeBack = async () => {
    setIsLoading(true);
    try {
      await simulateContract(config, {
        ...gameContract,
        functionName: "j2Timeout",
      });
      const tHash = await writeContractAsync({
        ...gameContract,
        functionName: "j2Timeout",
      });
      setT2TimeoutTxn(tHash);
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "Unknown Error";
      toast.error(`Failed to get stake back: ${errorName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { register, handleSubmit } = useForm();

  const handleSolve = async (data: FieldValues) => {
    setIsLoading(true);
    try {
      const { prevMove, decryptedSalt } = await getGameMoveAndSalt(
        data.password,
        c1Hash
      );
      await simulateContract(config, {
        ...gameContract,
        functionName: "solve",
        args: [prevMove, uint8ArrayToBigInt(decryptedSalt)],
      });
      const sHash = await writeContractAsync({
        ...gameContract,
        functionName: "solve",
        args: [prevMove, uint8ArrayToBigInt(decryptedSalt)],
      });
      setSolveTxn(sHash);
    } catch (err) {
      const errorName = err instanceof Error ? err.name : "Unknown Error";
      toast.error(`Failed to solve: ${errorName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    secureLocalStorage.clear();
    localStorage.clear();
    navigate("/");
  };

  if (isLoading) return <InLineLoader />;

  if (t2TimeoutTxn) {
    return (
      <TransactionStatus
        label="Getting stake back"
        onSuccess={() => {
          toast.success("Recieved stake back");
          removeT2TimeoutTxn();
          resetGame();
        }}
        setTxnHash={(hash) =>
          hash === null ? removeT2TimeoutTxn() : setT2TimeoutTxn(hash)
        }
        txnHash={t2TimeoutTxn}
      />
    );
  }

  if (solveTxn) {
    return (
      <TransactionStatus
        label="Solving"
        onSuccess={() => {
          toast.success("Solved successfully");
          removeSolveTxn();
          resetGame();
        }}
        setTxnHash={(hash) =>
          hash === null ? removeSolveTxn() : setSolveTxn(hash)
        }
        txnHash={solveTxn}
      />
    );
  }

  if (stake === 0n) {
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <h1 className="text-4xl font-bold text-white">Game Over</h1>
        <button
          className="btn btn-outline text-white w-96 mt-4"
          onClick={() => {
            secureLocalStorage.clear();
            localStorage.clear();
            navigate("/");
          }}
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Actions</h2>
        <DeleteGame onClick={resetGame} />
      </div>
      <div className="divider"></div>
      {remainingTime > 0 && (
        <div className="text-red-500">
          Time remaining: {remainingTime} seconds
        </div>
      )}
      {c2 !== 0 && (
        <form onSubmit={handleSubmit(handleSolve)}>
          <input
            type="text"
            placeholder="Enter Password"
            {...register("password", { required: "Password is required" })}
            className="input input-bordered w-full"
          />
          <button className="btn btn-outline mt-4 btn-primary w-96">
            Solve
          </button>
        </form>
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

const DeleteGame = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      className="btn tooltip bg-red-500"
      onClick={onClick}
      data-tip="Delete Game"
    >
      <FaTrash className="w-4 h-4 text-white" />
    </button>
  );
};

export default Player1Game;
