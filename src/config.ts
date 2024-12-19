import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet, holesky } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "RPS App",
  projectId: import.meta.env.VITE_PROJECT_ID ?? "",
  chains: [sepolia, mainnet, holesky],
});
