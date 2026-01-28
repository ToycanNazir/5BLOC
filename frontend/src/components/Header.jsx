import WalletButton from "./WalletButton";
import styles from "./Header.module.css";

export default function Header({ cardCount }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Trading Cards NFT</h1>
      <WalletButton cardCount={cardCount} />
    </header>
  );
}