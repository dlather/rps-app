import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import useNetworkStatus from "../utils/hooks/useNetworkStatus";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import { switchChain } from "@wagmi/core";
import { config } from "../config";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOnline } = useNetworkStatus();
  const { isDisconnected, chain, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    if (!isOnline) {
      (
        document.getElementById("network-status") as HTMLDialogElement
      )?.showModal();
    } else {
      (document.getElementById("network-status") as HTMLDialogElement)?.close();
    }
  }, [isOnline]);

  useEffect(() => {
    if (isDisconnected && openConnectModal) {
      openConnectModal();
    }
  }, [isDisconnected, openConnectModal]);

  useEffect(() => {
    if (isConnected) {
      if (chain?.id !== sepolia.id) {
        (
          document.getElementById("wrong-chain") as HTMLDialogElement
        )?.showModal();
      } else {
        (document.getElementById("wrong-chain") as HTMLDialogElement)?.close();
      }
    }
  }, [chain, isConnected]);

  const handleSwitchChain = () => {
    switchChain(config, { chainId: sepolia.id });
  };

  return (
    <div className="mx-auto">
      <div className="navbar">
        <div className="flex-1 mx-2">
          <div className="text-xl font-semibold">RPS Game</div>
        </div>
        <div className="flex-none">
          <ConnectButton />
        </div>
      </div>
      {children}
      <dialog id="network-status" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">You are offline</h3>
          <p className="py-4">Please connect to the network to play the game</p>
        </div>
      </dialog>

      <dialog id="wrong-chain" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            Please switch to Sepolia to play
          </h3>
          <button className="btn btn-primary" onClick={handleSwitchChain}>
            Switch to Sepolia
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default AppLayout;
