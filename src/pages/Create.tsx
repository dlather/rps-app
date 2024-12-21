import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { LOCAL_STORAGE_KEYS, moves } from "../utils/constants";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { toast } from "react-toastify";
import { getHashConfigForMove, storeCreateGameCreds } from "../utils";
import { useDeployContract } from "wagmi";
import { RPSAbi, RPSByteCode } from "../utils/contracts/RPS"; // Adjust the import path as needed
import TransactionStatus from "../components/TransactionStatus";
import { useNavigate } from "react-router-dom";
import { ConnectWalletDialog } from "../components/Dialogs";
import Loader from "../components/Loader";
import { GameCreationFormData } from "../utils/types";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";

const Create = () => {
  const { address: p1Address } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const navigate = useNavigate();

  const [txnHash, setTxnHash, removeTxn] = useLocalStorage<
    `0x${string}` | null
  >(LOCAL_STORAGE_KEYS.CREATE_TXN_HASH, null);
  const [currentGameAddress, setCurrentGameAddress] = useLocalStorage<
    `0x${string}` | null
  >(LOCAL_STORAGE_KEYS.CREATED_RPS_ADDRESS, null);

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: GameCreationFormData) => {
    if (!p1Address) return;
    setIsLoading(true);

    try {
      const { p2Address, stake, password, move } = data;
      const { hasherMoveHash, signature, encryptedSalt, iv, saltForKDF } =
        await getHashConfigForMove({
          password,
          move,
        });
      const tx = await deployContractAsync({
        abi: RPSAbi,
        bytecode: RPSByteCode.object as `0x${string}`,
        args: [hasherMoveHash, p2Address],
        value: parseUnits(stake.toString(), 0),
      });
      setTxnHash(tx);
      storeCreateGameCreds({
        signature,
        iv,
        encryptedSalt,
        saltForKDF,
        p1Address,
        p2Address,
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to create game");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentGameAddress) navigate(`/play/${currentGameAddress}`);
  }, [currentGameAddress, navigate]);

  if (isLoading) return <Loader />;

  return (
    <div>
      <ConnectWalletDialog />
      {txnHash ? (
        <TransactionStatus
          txnHash={txnHash}
          label="Creating Game"
          onSuccess={(receipt) => {
            console.log("receipt", receipt);
            const gameAddress = receipt?.contractAddress;
            if (gameAddress) {
              removeTxn();
              setCurrentGameAddress(gameAddress);
              navigate(`/play/${gameAddress}`);
            }
          }}
          className="flex flex-col items-center justify-center gap-4"
        />
      ) : (
        <CreateGameForm onSubmit={onSubmit} />
      )}
    </div>
  );
};

const CreateGameForm = ({
  onSubmit,
}: {
  onSubmit: (data: GameCreationFormData) => void;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<GameCreationFormData>({
    defaultValues: { move: 0, stake: 0, p2Address: "", password: "" },
  });
  const selectedMove = watch("move");

  return (
    <form
      className="flex flex-col items-center justify-center my-20"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h1 className="text-4xl font-bold text-white mb-8">Create a new game</h1>
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
            {...register("p2Address", {
              required: true,
              minLength: 42,
              maxLength: 42,
              pattern: /^0x[a-fA-F0-9]{40}$/,
            })}
            className="grow"
            placeholder="Player 2 Address"
          />
          <div className="label">
            {errors.p2Address && (
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
            {...register("password", { required: true })}
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
  );
};

export default Create;
