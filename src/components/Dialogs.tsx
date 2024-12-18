import { DIALOG_IDS } from "../utils/constants";

export const NetworkStatusDialog = () => (
  <dialog id={DIALOG_IDS.NETWORK_STATUS} className="modal">
    <div className="modal-box">
      <h3 className="font-bold text-lg">You are offline</h3>
      <p className="py-4">Please connect to the network to play the game</p>
    </div>
  </dialog>
);

export const WrongChainDialog = ({ onSwitch }: { onSwitch: () => void }) => (
  <dialog id={DIALOG_IDS.WRONG_CHAIN} className="modal">
    <div className="modal-box">
      <h3 className="font-bold text-lg mb-4">
        Please switch to Sepolia to play
      </h3>
      <button className="btn btn-primary" onClick={onSwitch}>
        Switch to Sepolia
      </button>
    </div>
  </dialog>
);
