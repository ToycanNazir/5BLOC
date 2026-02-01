import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { useMessage } from "../contexts/MessageContext";
import { RARETES } from "../constants/contract";
import styles from "./AdminPanel.module.css";

export default function AdminPanel() {
  const { isOwner, userAddress } = useWeb3();
  const { createCard } = useContract();
  const { showMessage } = useMessage();

  const [destinataire, setDestinataire] = useState("");
  const [nom, setNom] = useState("");
  const [rarete, setRarete] = useState("0");
  const [valeur, setValeur] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOwner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destinataire || !nom || !valeur || !ipfsHash) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    setLoading(true);
    try {
      await createCard(destinataire, nom, parseInt(rarete), parseInt(valeur), ipfsHash);
      setDestinataire("");
      setNom("");
      setRarete("0");
      setValeur("");
      setIpfsHash("");
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2>Administration - Creer une carte</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Adresse destinataire</label>
          <input
            type="text"
            placeholder="0x..."
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Nom de la carte</label>
          <input
            type="text"
            placeholder="Dragon de feu"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Rarete</label>
          <select value={rarete} onChange={(e) => setRarete(e.target.value)} disabled={loading}>
            {RARETES.map((r, i) => (
              <option key={i} value={i}>{r}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Valeur</label>
          <input
            type="number"
            placeholder="100"
            min="1"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Hash IPFS</label>
          <input
            type="text"
            placeholder="QmXoypiz..."
            value={ipfsHash}
            onChange={(e) => setIpfsHash(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creation en cours..." : "Creer la carte"}
        </button>
      </form>
    </section>
  );
}
