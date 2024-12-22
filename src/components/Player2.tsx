import { useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import { useWriteContract } from "wagmi";
import { LOCAL_STORAGE_KEYS, moves } from "../utils/constants";
import { RPSAbi } from "../utils/contracts/RPS";
import { PlayerGameProps } from "../utils/types";
import TransactionStatus from "./TransactionStatus";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import { InLineLoader } from "./Loader";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
const Player2Game = ({
  gameAddress,
  c2,
  stake,
  TIMEOUT,
  lastAction,
}: PlayerGameProps) => {
  const [t1TimeoutTxn, setT1TimeoutTxn, removeT1TimeoutTxn] = useLocalStorage<
    `0x${string}` | undefined
  >(LOCAL_STORAGE_KEYS.T1_TIMEOUT_TXN_HASH, undefined);
  const [playTxn, setPlayTxn, removePlayTxn] = useLocalStorage<
    `0x${string}` | undefined
  >(LOCAL_STORAGE_KEYS.PLAY_TXN_HASH, undefined);
  // TODO: remaining time usehook
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { writeContractAsync } = useWriteContract();
  const { handleSubmit, watch, setValue } = useForm();
  const navigate = useNavigate();

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
    try {
      setIsLoading(true);
      const mHash = await writeContractAsync({
        ...gameContract,
        functionName: "play",
        args: [data.move + 1],
        value: stake,
      });
      setPlayTxn(mHash);
    } catch (error) {
      console.error(error);
      toast.error("Error playing");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMove = watch("move");

  const handleJ1Timeout = async () => {
    try {
      setIsLoading(true);
      const t1TimeoutTxn = await writeContractAsync({
        ...gameContract,
        functionName: "j1Timeout",
      });
      setT1TimeoutTxn(t1TimeoutTxn);
    } catch (error) {
      console.error(error);
      toast.error("Error in j1Timeout");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <InLineLoader />;

  if (playTxn) {
    return (
      <TransactionStatus
        label="Playing..."
        onSuccess={() => {
          toast.success("Played successfully");
          removePlayTxn();
        }}
        setTxnHash={(hash) =>
          hash === null ? removePlayTxn() : setPlayTxn(hash)
        }
        txnHash={playTxn}
      />
    );
  }

  if (t1TimeoutTxn) {
    return (
      <TransactionStatus
        label="Player 1 Timeout..."
        onSuccess={() => {
          toast.success("Player 1 Timeout successful");
          removeT1TimeoutTxn();
          navigate("/");
        }}
        setTxnHash={(hash) =>
          hash === null ? removeT1TimeoutTxn() : setT1TimeoutTxn(hash)
        }
        txnHash={t1TimeoutTxn}
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
      <div className="text-red-500">
        {remainingTime > 0 && (
          <div className="text-red-500">
            Time remaining: {remainingTime} seconds
          </div>
        )}
        {c2 === 0 && (
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
        {remainingTime < 0 && c2 !== 0 && (
          <button
            onClick={handleJ1Timeout}
            className="btn btn-outline btn-primary w-96 mt-4"
          >
            Player 1 Timeout
          </button>
        )}
      </div>
    </div>
  );
};

export default Player2Game;
