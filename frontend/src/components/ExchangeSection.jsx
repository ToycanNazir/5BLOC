import { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { useCooldown } from "../hooks/useCooldown";
import { useMessage } from "../contexts/MessageContext";
import { RARETES, RARETES_CLASS } from "../constants/contract";
import styles from "./ExchangeSection.module.css";

export default function ExchangeSection() {
  const { userAddress } = useWeb3();
  const { proposeExchange, fetchExchange, acceptExchange, cancelExchange, fetchCardDetails } = useContract();
  const { remaining, formatted, refresh } = useCooldown();
  const { showMessage } = useMessage();

  // Proposer un echange
  const [monTokenId, setMonTokenId] = useState("");
  const [tokenVouluId, setTokenVouluId] = useState("");
  const [proposeLoading, setProposeLoading] = useState(false);

  // Consulter un echange
  const [echangeId, setEchangeId] = useState("");
  const [echangeInfo, setEchangeInfo] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!userAddress) return null;

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!monTokenId || !tokenVouluId) {
      showMessage("Veuillez remplir les deux champs.", "error");
      return;
    }
    setProposeLoading(true);
    try {
      await proposeExchange(parseInt(monTokenId), parseInt(tokenVouluId));
      setMonTokenId("");
      setTokenVouluId("");
      await refresh();
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
    } finally {
      setProposeLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!echangeId) {
      showMessage("Veuillez entrer un ID d'echange.", "error");
      return;
    }
    setSearchLoading(true);
    setEchangeInfo(null);
    try {
      const info = await fetchExchange(parseInt(echangeId));

      // Recuperer les details des deux cartes
      let carteProposee = null;
      let carteVoulue = null;
      try {
        carteProposee = await fetchCardDetails(info.tokenPropose);
      } catch { /* carte peut ne plus exister */ }
      try {
        carteVoulue = await fetchCardDetails(info.tokenVoulu);
      } catch { /* carte peut ne plus exister */ }

      setEchangeInfo({ ...info, carteProposee, carteVoulue });
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await acceptExchange(parseInt(echangeId));
      setEchangeInfo(null);
      setEchangeId("");
      await refresh();
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelExchange(parseInt(echangeId));
      setEchangeInfo(null);
      setEchangeId("");
    } catch (err) {
      showMessage("Erreur: " + (err.reason || err.message), "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2>Echanges de cartes</h2>

      {remaining > 0 && (
        <div className={styles.cooldown}>
          Cooldown actif : {formatted}
        </div>
      )}

      {/* Proposer un echange */}
      <div className={styles.block}>
        <h3>Proposer un echange</h3>
        <form onSubmit={handlePropose}>
          <div className="form-group">
            <label>ID de votre carte</label>
            <input
              type="number"
              placeholder="1"
              min="1"
              value={monTokenId}
              onChange={(e) => setMonTokenId(e.target.value)}
              disabled={proposeLoading}
            />
          </div>
          <div className="form-group">
            <label>ID de la carte voulue</label>
            <input
              type="number"
              placeholder="2"
              min="1"
              value={tokenVouluId}
              onChange={(e) => setTokenVouluId(e.target.value)}
              disabled={proposeLoading}
            />
          </div>
          <button type="submit" disabled={proposeLoading}>
            {proposeLoading ? "Proposition en cours..." : "Proposer l'echange"}
          </button>
        </form>
      </div>

      {/* Consulter un echange */}
      <div className={styles.block}>
        <h3>Consulter un echange</h3>
        <div className="search-box">
          <input
            type="number"
            placeholder="ID de l'echange"
            min="0"
            value={echangeId}
            onChange={(e) => setEchangeId(e.target.value)}
            disabled={searchLoading}
          />
          <button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? "Recherche..." : "Rechercher"}
          </button>
        </div>

        {echangeInfo && (
          <div className={styles.result}>
            <div className={styles.status}>
              Statut : <span className={echangeInfo.active ? styles.active : styles.inactive}>
                {echangeInfo.active ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className={styles.cards}>
              <div className={styles.cardPreview}>
                <span className={styles.label}>Carte proposee #{echangeInfo.tokenPropose}</span>
                {echangeInfo.carteProposee && (
                  <>
                    <span>{echangeInfo.carteProposee.nom}</span>
                    <span className={`${styles.badge} ${styles[RARETES_CLASS[echangeInfo.carteProposee.rarete]]}`}>
                      {RARETES[echangeInfo.carteProposee.rarete]}
                    </span>
                  </>
                )}
              </div>
              <div className={styles.arrow}>&#8646;</div>
              <div className={styles.cardPreview}>
                <span className={styles.label}>Carte voulue #{echangeInfo.tokenVoulu}</span>
                {echangeInfo.carteVoulue && (
                  <>
                    <span>{echangeInfo.carteVoulue.nom}</span>
                    <span className={`${styles.badge} ${styles[RARETES_CLASS[echangeInfo.carteVoulue.rarete]]}`}>
                      {RARETES[echangeInfo.carteVoulue.rarete]}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.proposeur}>
              Proposeur : {echangeInfo.proposeur}
            </div>

            {echangeInfo.active && (
              <div className={styles.actions}>
                {echangeInfo.isAccepteur && (
                  <button
                    className={styles.acceptBtn}
                    onClick={handleAccept}
                    disabled={actionLoading || remaining > 0}
                  >
                    {actionLoading ? "En cours..." : "Accepter l'echange"}
                  </button>
                )}
                {echangeInfo.isProposeur && (
                  <button
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "En cours..." : "Annuler l'echange"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
