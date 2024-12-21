import { useAccount } from "wagmi";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { toast } from "react-toastify";
import { getHashConfigForMove, storeCreateGameCreds } from "../utils";
import { useDeployContract } from "wagmi";
import { RPSAbi, RPSByteCode } from "../utils/contracts/RPS";
import TransactionStatus from "../components/TransactionStatus";
import { useNavigate } from "react-router-dom";
import { ConnectWalletDialog } from "../components/Dialogs";
import Loader from "../components/Loader";
import { GameCreationFormData } from "../utils/types";
import { useLocalStorage } from "../utils/hooks/useLocalStorage";
import CreateGameForm from "../components/CreateGameForm";

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

export default Create;
