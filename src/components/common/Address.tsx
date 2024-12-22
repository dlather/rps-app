import { FaCopy } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";

const Address = ({
  address,
  asLink = true,
}: {
  address: `0x${string}` | undefined;
  asLink?: boolean;
}) => {
  const { chain } = useAccount();
  if (!address) return "N/A";

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const CopyButton = () => (
    <button
      className="p-1 hover:bg-gray-100 rounded-full tooltip text-gray-700"
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(address);
        toast.success("Address copied to clipboard");
      }}
      title="Copy address"
      data-tip="Copy address"
    >
      <FaCopy className="w-3 h-3" />
    </button>
  );

  const AddressContent = () => (
    <span className="flex items-center gap-2">
      <span className="truncate" title={address}>
        {truncatedAddress}
      </span>
      <CopyButton />
    </span>
  );

  if (asLink) {
    return (
      <a
        href={`https://${chain?.name}.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center gap-2"
        title={address}
      >
        <AddressContent />
      </a>
    );
  }

  return <AddressContent />;
};

export default Address;
