import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";
import { switchChain } from "@wagmi/core";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { DIALOG_IDS } from "../constants";
import { config } from "../../config";

const useChainConnection = () => {
  const { isDisconnected, chain, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    if (isDisconnected && openConnectModal) {
      openConnectModal();
    }
  }, [isDisconnected, openConnectModal]);

  useEffect(() => {
    if (isConnected) {
      const wrongChainDialog = document.getElementById(
        DIALOG_IDS.WRONG_CHAIN
      ) as HTMLDialogElement;
      if (chain?.id !== sepolia.id) {
        wrongChainDialog?.showModal();
      } else {
        wrongChainDialog?.close();
      }
    }
  }, [chain, isConnected]);

  const handleSwitchChain = () => {
    switchChain(config, { chainId: sepolia.id });
  };

  return { handleSwitchChain };
};

export default useChainConnection;
