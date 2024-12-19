import { useAccount, useTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useForm } from "react-hook-form";
import { moves } from "../utils/constants";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { keccak256, parseUnits, encodePacked, toHex } from "viem";
import { config } from "../config";
import secureLocalStorage from "react-secure-storage";
import { encryptSalt, uint8ArrayToBigInt } from "../utils";
import { deriveKey } from "../utils";
import { useDeployContract } from "wagmi";
import { signMessage } from "@wagmi/core";
import { generateSalt } from "../utils";
import { RPSAbi, RPSByteCode } from "../utils/contracts/RPS"; // Adjust the import path as needed
import GameStatus from "../components/GameStatus";

type CreateGameForm = {
  move: number;
  stake: number;
  player2: string;
  pwd: string;
};

const Create = () => {
  const { isDisconnected, address: p1Address } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const [txnHash, setTxnHash] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGameAddress, setCurrentGameAddress] = useState<
    `0x${string}` | null
  >(null);

  useEffect(() => {
    const gameAddress = secureLocalStorage.getItem("RPSAddress");
    if (gameAddress) {
      setCurrentGameAddress(gameAddress as `0x${string}`);
    }
  }, [txnHash]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateGameForm>({
    defaultValues: { move: 0, stake: 0, player2: "" },
  });

  const onSubmit = async (data: CreateGameForm) => {
    if (!p1Address) return;

    try {
      setIsLoading(true);
      const p2Address = data.player2;
      const wei = data.stake;

      const salt = generateSalt(32);
      console.log("salt", salt);
      const saltForKDF = generateSalt(16); // Salt for key derivation
      console.log("saltForKDF", saltForKDF);
      const key = await deriveKey(data.pwd, saltForKDF);
      console.log("key", key);
      const { iv, encryptedSalt } = await encryptSalt(salt, key);
      console.log("iv", iv);
      console.log("encryptedSalt", encryptedSalt);
      const encryptedSaltArray = Array.from(encryptedSalt);
      console.log("encryptedSaltArray", encryptedSaltArray);

      // ----
      const messageToSign = toHex(new Uint8Array(encryptedSaltArray));
      console.log("messageToSign", messageToSign);
      const signature = await signMessage(config, {
        message: { raw: messageToSign },
      });

      const hasherMoveHash = keccak256(
        encodePacked(
          ["uint8", "uint256"],
          [selectedMove + 1, uint8ArrayToBigInt(salt)]
        )
      );
      const tx = await deployContractAsync(
        {
          abi: RPSAbi,
          bytecode: RPSByteCode.object as `0x${string}`,
          args: [hasherMoveHash, p2Address],
          value: parseUnits(wei.toString(), 0),
        },
        {
          onSuccess: (txn, { ...args }) => {
            console.log("txn", txn);
            console.log("args", args);
            setTxnHash(txn);
          },
        }
      );
      // tx is txn hash
      console.log(tx);
      setTxnHash(tx);

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
        "createGameConfig",
        JSON.stringify(createGameConfig)
      );
      // secureLocalStorage.setItem("RPSAddress", contract.address);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMove = watch("move");

  if (isDisconnected)
    return (
      <div className="flex flex-col items-center justify-center my-20">
        <div className="text-lg mb-4">Please connect your wallet</div>
        <ConnectButton />
      </div>
    );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto h-screen ">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  if (currentGameAddress) {
    return <GameStatus gameAddress={currentGameAddress} />;
  }

  return (
    <div>
      <form
        className="flex flex-col items-center justify-center my-20"
        onSubmit={handleSubmit(onSubmit)}
      >
        <p className="mt-6 mb-1 text-gray-500">Choose your move</p>
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
        <div className=" my-4">
          <label className="input input-bordered flex items-center w-96">
            <input
              type="number"
              {...register("stake", {
                valueAsNumber: true,
                required: true,
                min: 1,
              })}
              className="grow"
              placeholder="Enter Amount"
            />
            <kbd className="">wei</kbd>
          </label>
        </div>
        <div className="my-4">
          <label className="input input-bordered flex items-center w-96">
            <input
              type="text"
              {...register("player2", {
                required: true,
                minLength: 42,
                maxLength: 42,
                pattern: /^0x[a-fA-F0-9]{40}$/,
              })}
              className="grow"
              placeholder="Player 2 Address"
            />
            <div className="label">
              {errors.player2 && (
                <span className="label-text-alt text-red-600">
                  Invalid Address
                </span>
              )}
            </div>
          </label>
        </div>
        <div className=" my-4">
          <label className="input input-bordered flex items-center w-96">
            <input
              type="text"
              {...register("pwd", { required: true })}
              className="grow"
              placeholder="Password"
            />
            <kbd className="">🔑</kbd>
          </label>
        </div>
        <button
          disabled={!isValid}
          className="btn btn-primary mt-4 w-96"
          type="submit"
        >
          Create Game
        </button>
      </form>
      {txnHash ? (
        <TransactionStatus txn={txnHash} setTxnHash={setTxnHash} />
      ) : null}
    </div>
  );
};

const TransactionStatus = ({
  txn,
  setTxnHash,
}: {
  txn: `0x${string}`;
  setTxnHash: Dispatch<SetStateAction<`0x${string}` | null>>;
}) => {
  const { chain } = useAccount();
  const { data: receipt } = useTransactionReceipt({ hash: txn });

  useEffect(() => {
    if (receipt && receipt?.contractAddress) {
      secureLocalStorage.setItem("RPSAddress", receipt.contractAddress);
      setTxnHash(null);
    }
  }, [receipt, setTxnHash]);

  return (
    <div>
      <a
        className="mt-4 link link-primary"
        href={`https://${chain?.name}.etherscan.io/tx/${txn}`}
        target="_blank"
        rel="noreferrer"
      >
        Track Transaction
      </a>
    </div>
  );
};

export default Create;
