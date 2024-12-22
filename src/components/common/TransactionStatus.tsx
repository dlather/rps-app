import { useEffect } from "react";
import { toast } from "react-toastify";
import { TransactionReceipt, WaitForTransactionReceiptErrorType } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

type TransactionStatusProps = {
  txnHash: `0x${string}`;
  onSuccess: (receipt: TransactionReceipt) => void;
  className?: string;
  label?: string;
  setTxnHash: (hash: `0x${string}` | null) => void;
};

const TransactionStatus = ({
  txnHash,
  onSuccess,
  className = "flex flex-col items-center justify-center gap-4",
  label,
  setTxnHash,
}: TransactionStatusProps) => {
  const { chain } = useAccount();
  const {
    data: receipt,
    error: receiptError,
    failureReason: receiptFailureReason,
  } = useWaitForTransactionReceipt({
    hash: txnHash,
    onReplaced: (replaced) => {
      toast.info(`Transaction was replaced`);
      setTxnHash(replaced?.replacedTransaction?.hash);
    },
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

  const error: WaitForTransactionReceiptErrorType | null =
    receiptError || receiptFailureReason;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-800 font-medium">{error?.name}</div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn btn-sm btn-error hover:bg-red-700 transition-colors"
            onClick={() => setTxnHash(null)}
          >
            Reset Transaction
          </button>

          <a
            className="btn btn-sm btn-outline hover:bg-gray-100 transition-colors"
            href={`https://${chain?.name}.etherscan.io/tx/${txnHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Etherscan
          </a>
        </div>
      </div>
    );
  }

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
