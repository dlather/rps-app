import { useAccount } from "wagmi";
import { indexToMove } from "../utils";
import { PlayerGameProps } from "../utils/types";
import Address from "./Address";
import { toast } from "react-toastify";
import { FaShareAlt } from "react-icons/fa";

const GameDetails = (props: PlayerGameProps) => {
  const { gameAddress, j1, j2, c2, stake } = props;
  const { address, isDisconnected } = useAccount();
  if (isDisconnected || (j1 !== address && j2 !== address)) return null;

  const isPlayer1 = j1 === address;

  return (
    <div className="my-8 w-full max-w-xl mx-auto bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Game Details</h2>
        <CopyInviteLink gameAddress={gameAddress} />
      </div>
      <div className="divider"></div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Game Address:</span>
          <span className="text-gray-900">
            <Address address={gameAddress} />
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Contract Balance:</span>
          <span className="text-gray-900">{`${stake.toString()} wei`}</span>
        </div>

        {isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Address:</span>
            <span className="text-gray-900">
              <Address address={j2} />
            </span>
          </div>
        )}

        {isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 2 Move:</span>
            <span className="text-gray-900">{indexToMove(Number(c2))}</span>
          </div>
        )}

        {!isPlayer1 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Player 1 Address:</span>
            <span className="text-gray-900">
              <Address address={j1} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const CopyInviteLink = ({ gameAddress }: { gameAddress: `0x${string}` }) => {
  return (
    <button
      className="btn tooltip btn-primary"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/play/${gameAddress}`
        );
        toast.success("Invite link copied to clipboard");
      }}
      data-tip="Copy Invite Link"
    >
      <FaShareAlt className="w-4 h-4" />
    </button>
  );
};

export default GameDetails;
