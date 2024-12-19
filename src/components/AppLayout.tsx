import { ConnectButton } from "@rainbow-me/rainbowkit";
import useNetworkStatus from "../utils/hooks/useNetworkStatus";
import { useEffect } from "react";
import { DIALOG_IDS } from "../utils/constants";
import useDialogControl from "../utils/hooks/useDialogControl";
import useChainConnection from "../utils/hooks/useChainConnection";
import { WrongChainDialog } from "./Dialogs";
import { NetworkStatusDialog } from "./Dialogs";
import { holesky } from "viem/chains";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOnline } = useNetworkStatus();
  const { handleSwitchChain } = useChainConnection();
  const { showModal, closeModal } = useDialogControl(DIALOG_IDS.NETWORK_STATUS);

  useEffect(() => {
    if (!isOnline) {
      showModal();
    } else {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return (
    <div className="mx-auto">
      <div className="navbar">
        <div className="flex-1 mx-2">
          <div className="text-xl font-semibold">Let's Play</div>
        </div>
        <div className="flex-none">
          <ConnectButton />
        </div>
      </div>
      {children}
      <NetworkStatusDialog />
      <WrongChainDialog onSwitch={handleSwitchChain} network={holesky.name} />
    </div>
  );
};

export default AppLayout;
