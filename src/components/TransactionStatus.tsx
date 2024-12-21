import { useEffect } from "react";
import { TransactionReceipt } from "viem";
import { useAccount, useTransactionReceipt } from "wagmi";

type TransactionStatusProps = {
  txnHash: `0x${string}`;
  onSuccess: (receipt: TransactionReceipt) => void;
  className?: string;
  label?: string;
};

const TransactionStatus = ({
  txnHash,
  onSuccess,
  className,
  label,
}: TransactionStatusProps) => {
  const { chain } = useAccount();
  const { data: receipt } = useTransactionReceipt({
    hash: txnHash,
    query: {
      refetchInterval: 1000,
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  useEffect(() => {
    if (receipt) {
      onSuccess(receipt);
    }
  }, [receipt, onSuccess]);

  return (
    <div className={className}>
      <span className="loading loading-spinner loading-md text-white mb-4"></span>
      {label && <span className="text-white text-2xl">{label}</span>}
      <a
        className="link text-white text-sm"
        href={`https://${chain?.name}.etherscan.io/tx/${txnHash}`}
        target="_blank"
        rel="noreferrer"
      >
        Track Transaction
      </a>
    </div>
  );
};

export default TransactionStatus;
