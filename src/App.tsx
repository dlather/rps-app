import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";
import "@rainbow-me/rainbowkit/styles.css";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import Home from "./pages/Home";
import AppLayout from "./components/AppLayout";
import Join from "./pages/Join";
import Create from "./pages/Create";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: "#4B53E8",
              accentColorForeground: "#fff",
            })}
            modalSize="compact"
          >
            <AppLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<Join />} />
                <Route path="/create" element={<Create />} />
              </Routes>
            </AppLayout>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  );
}

export default App;
