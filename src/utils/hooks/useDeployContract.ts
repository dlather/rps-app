import { usePublicClient, useWalletClient } from "wagmi";
import { signMessage, deployContract } from "wagmi/actions";
import { parseUnits, keccak256, toHex, bytesToHex, concat } from "viem";
import secureLocalStorage from "react-secure-storage";
import { config } from "../../config";

type DeployContractProps = {
  pwd: string;
  selectedMove: string;
  p2Address: `0x${string}`;
  wei: number;
  generateSalt: (length: number) => Uint8Array;
  deriveKey: (pwd: string, salt: Uint8Array) => Promise<CryptoKey>;
  encryptSalt: (
    salt: Uint8Array,
    key: CryptoKey
  ) => Promise<{ iv: Uint8Array; encryptedSalt: Uint8Array }>;
  RPSAbi: readonly unknown[];
  RPSByteCode: `0x${string}`;
  resetData: () => void;
  setisLoading: (val: boolean) => void;
  settxn: (txn: { hash: `0x${string}` }) => void;
  setContract: (contractInfo: { address: `0x${string}` }) => void;
};

export function useDeployContract({
  pwd,
  selectedMove,
  p2Address,
  wei,
  generateSalt,
  deriveKey,
  encryptSalt,
  RPSAbi,
  RPSByteCode,
  resetData,
  setisLoading,
  settxn,
  setContract,
}: DeployContractProps) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const deployContractFn = async () => {
    if (!walletClient) return;

    setisLoading(true);
    try {
      // Get current wallet address
      const accounts = await walletClient.getAddresses();
      if (accounts.length === 0) throw new Error("No accounts connected");
      const p1Address = accounts[0];

      // Generate and derive keys
      const salt = generateSalt(32);
      const saltForKDF = generateSalt(16);
      const key = await deriveKey(pwd, saltForKDF);

      // Encrypt salt
      const { iv, encryptedSalt } = await encryptSalt(salt, key);

      // Sign the encrypted salt with the connected wallet
      const signature = await signMessage(config, {
        message: { raw: encryptedSalt },
      });

      // Reproduce solidityPack("uint8", "uint256") and keccak256 hash
      // solidityPack(uint8) is one byte, uint256 is 32 bytes
      const moveValue = parseInt(selectedMove, 10) + 1;
      if (Number.isNaN(moveValue)) {
        throw new Error("selectedMove is not a number");
      }
      // Convert salt Uint8Array to BigInt
      const saltHex = "0x" + bytesToHex(salt);
      const saltBigInt = BigInt(saltHex);

      // solidityPack equivalent:
      // For uint8: a single byte
      // For uint256: 32 bytes
      const packed = concat([
        toHex(moveValue, { size: 1 }), // 1 byte for uint8
        toHex(saltBigInt, { size: 32 }), // 32 bytes for uint256
      ]);

      const hasherMoveHash = keccak256(packed);

      // Deploy the contract
      const hash = await deployContract(config, {
        abi: RPSAbi,
        bytecode: RPSByteCode,
        args: [hasherMoveHash, p2Address],
        value: parseUnits(`${wei}`, 0),
      });

      // Wait for the deployment transaction receipt
      await publicClient?.waitForTransactionReceipt({ hash });

      // Store data securely
      secureLocalStorage.setItem("signature", signature);
      secureLocalStorage.setItem(
        "encryptedSalt",
        JSON.stringify({
          iv: Array.from(iv),
          data: Array.from(encryptedSalt),
        })
      );
      secureLocalStorage.setItem(
        "saltForKDF",
        JSON.stringify(Array.from(saltForKDF))
      );
      //   secureLocalStorage.setItem("RPSAddress", address);
      secureLocalStorage.setItem("p1Address", p1Address);
      secureLocalStorage.setItem("p2Address", p2Address);

      settxn({ hash });
      //   setContract({ address });
      resetData();
    } catch (err) {
      console.error(err);
    } finally {
      setisLoading(false);
    }
  };

  return { deployContract: deployContractFn };
}
