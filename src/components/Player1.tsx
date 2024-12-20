import { useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { keccak256, encodePacked } from "viem";
import { useWriteContract } from "wagmi";
import { deriveKey, decryptSalt, uint8ArrayToBigInt } from "../utils";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";
import { RPSAbi } from "../utils/contracts/RPS";
import { PlayerGameProps } from "../utils/types";
import TransactionStatus from "./TransactionStatus";

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

export default Player1Game;
