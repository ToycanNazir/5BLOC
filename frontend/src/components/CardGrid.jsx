import { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { useMessage } from "../contexts/MessageContext";
import { RARETES, RARETES_CLASS } from "../constants/contract";
import styles from "./CardGrid.module.css";

export default function CardGrid() {
  const { contract, userAddress } = useWeb3();
  const { fetchUserCards } = useContract();
  const { showMessage } = useMessage();
  const [cards, setCards] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCards = async () => {
    if (!contract || !userAddress) return;
    setLoading(true);
    try {
      const result = await fetchUserCards();
      setCards(result.cards);
      setCount(result.count);
    } catch (err) {
      showMessage("Erreur lors du chargement des cartes: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [contract, userAddress]);

  if (!userAddress) {
    return (
      <section className={styles.section}>
        <h2>Mes Cartes</h2>
        <p className={styles.empty}>Connectez votre wallet pour voir vos cartes.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Mes Cartes ({count}/4)</h2>
        <button className={styles.refreshBtn} onClick={loadCards} disabled={loading}>
          {loading ? "Chargement..." : "Rafraichir"}
        </button>
      </div>

      {cards.length === 0 && !loading && (
        <p className={styles.empty}>Vous ne possedez aucune carte.</p>
      )}

      {loading && <p className={styles.empty}>Chargement...</p>}

      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.tokenId} className={`${styles.card} ${styles[RARETES_CLASS[card.rarete]]}`}>
            <div className={styles.cardHeader}>
              <span className={styles.tokenId}>#{card.tokenId}</span>
              <span className={`${styles.badge} ${styles[RARETES_CLASS[card.rarete]]}`}>
                {RARETES[card.rarete]}
              </span>
            </div>
            <h3 className={styles.cardName}>{card.nom}</h3>
            <div className={styles.cardInfo}>
              <span>Valeur: {card.valeur}</span>
            </div>
            {card.ipfsHash && (
              <div className={styles.ipfs}>
                IPFS: {card.ipfsHash.substring(0, 12)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
