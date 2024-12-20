import { useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { toast } from "react-toastify";
import { useWriteContract } from "wagmi";
import { moves } from "../utils/constants";
import { RPSAbi } from "../utils/contracts/RPS";
import { PlayerGameProps } from "../utils/types";
import TransactionStatus from "./TransactionStatus";

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

export default Player2Game;
