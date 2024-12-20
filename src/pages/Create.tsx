import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { LOCAL_STORAGE_KEYS, moves } from "../utils/constants";
import { useEffect, useState } from "react";
import { keccak256, parseUnits, encodePacked, toHex } from "viem";
import { config } from "../config";
import { toast } from "react-toastify";
import secureLocalStorage from "react-secure-storage";
import { encryptSalt, uint8ArrayToBigInt } from "../utils";
import { deriveKey } from "../utils";
import { useDeployContract } from "wagmi";
import { signMessage } from "@wagmi/core";
import { generateSalt } from "../utils";
import { RPSAbi, RPSByteCode } from "../utils/contracts/RPS"; // Adjust the import path as needed
import TransactionStatus from "../components/TransactionStatus";
import { useNavigate } from "react-router-dom";
import { FaCopy, FaTrash } from "react-icons/fa";
import { ConnectWalletDialog } from "../components/Dialogs";
import Loader from "../components/Loader";

type CreateGameForm = {
  move: number;
  stake: number;
  player2: string;
  pwd: string;
};

const Create = () => {
  const { address: p1Address } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const navigate = useNavigate();

  const [txnHash, setTxnHash] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGameAddress, setCurrentGameAddress] = useState<
    `0x${string}` | null
  >(null);

  useEffect(() => {
    const gameAddress = secureLocalStorage.getItem(
      LOCAL_STORAGE_KEYS.CREATED_RPS_ADDRESS
    );
    if (gameAddress) {
      setCurrentGameAddress(gameAddress as `0x${string}`);
    }
    setIsLoading(false);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateGameForm>({
    defaultValues: { move: 0, stake: 0, player2: "" },
  });

  // TODO: Refractor
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
      console.log("signature", signature);

      const hasherMoveHash = keccak256(
        encodePacked(
          ["uint8", "uint256"],
          [selectedMove + 1, uint8ArrayToBigInt(salt)]
        )
      );
      console.log("hasherMoveHash", hasherMoveHash);
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
      console.log("create game txn hash", tx);
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
        LOCAL_STORAGE_KEYS.CREATE_GAME_CONFIG,
        JSON.stringify(createGameConfig)
      );
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMove = watch("move");

  if (isLoading) return <Loader />;

  return (
    <div>
      <ConnectWalletDialog />
      {currentGameAddress ? (
        <div className="flex flex-col items-center justify-center my-20">
          <h1 className="text-4xl font-bold text-white mb-8">
            Game created successfully
          </h1>
          <div className="flex items-center justify-center gap-4">
            <button
              className="btn tooltip"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/play/${currentGameAddress}`
                );
                toast.success("Invite link copied to clipboard");
              }}
              title="Copy Invite Link"
              data-tip="Copy Invite Link"
            >
              <FaCopy className="w-4 h-4" />
            </button>
            <button
              className="btn btn-primary w-72"
              onClick={() => navigate(`/play/${currentGameAddress}`)}
            >
              Go to game
            </button>
            <button
              className="btn tooltip btn-error"
              onClick={() => {
                secureLocalStorage.removeItem(
                  LOCAL_STORAGE_KEYS.CREATED_RPS_ADDRESS
                );
                setCurrentGameAddress(null);
                navigate("/");
              }}
              title="Delete Game"
              data-tip="Delete Game"
            >
              <FaTrash className="w-4 h-4 text-white" />
            </button>
          </div>
          <span className="text-white mt-4">
            Game Address: {currentGameAddress}
          </span>
        </div>
      ) : txnHash ? (
        <div className="flex flex-col items-center justify-center my-20">
          <span className="loading loading-spinner loading-lg text-white"></span>
          <TransactionStatus
            txnHash={txnHash}
            onSuccess={(receipt) => {
              console.log("receipt", receipt);
              if (receipt?.contractAddress) {
                const gameAddress = receipt.contractAddress;
                secureLocalStorage.setItem(
                  LOCAL_STORAGE_KEYS.CREATED_RPS_ADDRESS,
                  gameAddress
                );
                setTxnHash(null);
                setCurrentGameAddress(gameAddress);
              }
            }}
            className="mt-4"
          />
        </div>
      ) : (
        <form
          className="flex flex-col items-center justify-center my-20"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h1 className="text-4xl font-bold text-white mb-8">
            Create a new game
          </h1>
          <p className="mt-6 mb-1 text-white">Choose your move</p>
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
      )}
    </div>
  );
};

export default Create;
