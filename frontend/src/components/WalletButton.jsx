import { useWeb3 } from "../contexts/Web3Context";
import { useMessage } from "../contexts/MessageContext";
import styles from "./WalletButton.module.css";

export default function WalletButton({ cardCount }) {
  const { userAddress, connectWallet } = useWeb3();
  const { showMessage } = useMessage();

  const handleConnect = async () => {
    try {
      await connectWallet();
      showMessage("Wallet connecte avec succes!");
    } catch (err) {
      showMessage("Erreur de connexion: " + err.message, "error");
    }
  };

  if (userAddress) {
    return (
      <div className={styles.walletInfo}>
        <span className={styles.address}>
          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </span>
        {cardCount != null && (
          <span className={styles.cardCount}>{cardCount}/4 cartes</span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.walletSection}>
      <button className={styles.connectBtn} onClick={handleConnect}>
        Connecter MetaMask
      </button>
    </div>
  );
}
