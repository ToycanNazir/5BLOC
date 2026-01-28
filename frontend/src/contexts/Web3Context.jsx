import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask n'est pas installe!");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const addr = accounts[0];
    const browserProvider = new BrowserProvider(window.ethereum);
    const walletSigner = await browserProvider.getSigner();
    const instance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, walletSigner);

    setProvider(browserProvider);
    setSigner(walletSigner);
    setContract(instance);
    setUserAddress(addr);

    // Verifier si admin
    try {
      const owner = await instance.owner();
      setIsOwner(owner.toLowerCase() === addr.toLowerCase());
    } catch {
      setIsOwner(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setUserAddress(null);
        setContract(null);
        setSigner(null);
        setProvider(null);
        setIsOwner(false);
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet]);

  return (
    <Web3Context.Provider
      value={{ provider, signer, contract, userAddress, isOwner, connectWallet }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
