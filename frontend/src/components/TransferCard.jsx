import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { useCooldown } from "../hooks/useCooldown";
import { useMessage } from "../contexts/MessageContext";
import styles from "./TransferCard.module.css";

export default function TransferCard() {
  const { userAddress } = useWeb3();
  const { transferCard } = useContract();
  const { remaining, formatted, refresh } = useCooldown();
  const { showMessage } = useMessage();

  const [tokenId, setTokenId] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [loading, setLoading] = useState(false);

  if (!userAddress) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenId || !destinataire) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);
    try {
      await transferCard(parseInt(tokenId), destinataire);
      setTokenId("");
      setDestinataire("");
      await refresh();
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2>Transferer une carte</h2>

      {remaining > 0 && (
        <div className={styles.cooldown}>
          Cooldown actif : {formatted}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID de la carte</label>
          <input
            type="number"
            placeholder="1"
            min="1"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Adresse du destinataire</label>
          <input
            type="text"
            placeholder="0x..."
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || remaining > 0}>
          {loading ? "Transfert en cours..." : "Transferer"}
        </button>
      </form>
    </section>
  );
}
