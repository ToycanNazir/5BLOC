import { useState } from "react";
import { useContract } from "../hooks/useContract";
import { useMessage } from "../contexts/MessageContext";
import { RARETES, RARETES_CLASS } from "../constants/contract";
import styles from "./SearchCard.module.css";

export default function SearchCard() {
  const { fetchCardDetails } = useContract();
  const { showMessage } = useMessage();

  const [tokenId, setTokenId] = useState("");
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!tokenId) {
      showMessage("Veuillez entrer un ID de carte.", "error");
      return;
    }
    setLoading(true);
    setCard(null);
    try {
      const details = await fetchCardDetails(parseInt(tokenId));
      setCard(details);
    } catch (err) {
      showMessage("Carte introuvable: " + (err.reason || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const shortenAddress = (addr) => {
    return addr.substring(0, 6) + "..." + addr.substring(addr.length - 4);
  };

  return (
    <section className={styles.section}>
      <h2>Rechercher une carte</h2>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="number"
          placeholder="ID de la carte"
          min="1"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {card && (
        <div className={styles.result}>
          <div className={styles.header}>
            <h3>{card.nom}</h3>
            <span className={`${styles.badge} ${styles[RARETES_CLASS[card.rarete]]}`}>
              {RARETES[card.rarete]}
            </span>
          </div>

          <div className={styles.details}>
            <div className={styles.row}>
              <span className={styles.label}>Valeur</span>
              <span>{card.valeur}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Proprietaire</span>
              <span className={styles.address}>{shortenAddress(card.proprietaire)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Creee le</span>
              <span>{formatDate(card.creeA)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Dernier transfert</span>
              <span>{formatDate(card.dernierTransfertA)}</span>
            </div>
            {card.ipfsHash && (
              <div className={styles.row}>
                <span className={styles.label}>IPFS</span>
                <span className={styles.mono}>{card.ipfsHash}</span>
              </div>
            )}
          </div>

          {card.anciensProprios.length > 0 && (
            <div className={styles.history}>
              <h4>Historique des proprietaires</h4>
              <ul>
                {card.anciensProprios.map((addr, i) => (
                  <li key={i} className={styles.mono}>{shortenAddress(addr)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
