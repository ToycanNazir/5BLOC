import { useCallback } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useMessage } from "../contexts/MessageContext";

export function useContract() {
  const { contract, userAddress } = useWeb3();
  const { showMessage } = useMessage();

  const fetchUserCards = useCallback(async () => {
    if (!contract || !userAddress) return { cards: [], count: 0 };

    const nombreCartes = await contract.getNombreCartes(userAddress);
    const count = Number(nombreCartes);

    if (count === 0) return { cards: [], count: 0 };

    const prochainId = await contract.getProchainTokenId();
    const cards = [];

    for (let i = 1; i < Number(prochainId); i++) {
      try {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          const carte = await contract.getCarte(i);
          cards.push({
            tokenId: i,
            nom: carte.nom,
            rarete: Number(carte.rarete),
            valeur: Number(carte.valeur),
            ipfsHash: carte.ipfsHash,
          });
        }
      } catch {
        continue;
      }
    }

    return { cards, count };
  }, [contract, userAddress]);

  const fetchCardDetails = useCallback(
    async (tokenId) => {
      if (!contract) throw new Error("Contrat non configure");

      const carte = await contract.getCarte(tokenId);
      const historique = await contract.getCarteHistorique(tokenId);

      return {
        nom: carte.nom,
        rarete: Number(carte.rarete),
        valeur: Number(carte.valeur),
        ipfsHash: carte.ipfsHash,
        proprietaire: historique.proprietaireActuel,
        creeA: Number(historique.creeA),
        dernierTransfertA: Number(historique.dernierTransfertA),
        anciensProprios: historique.anciensProprios,
      };
    },
    [contract]
  );

  const createCard = useCallback(
    async (destinataire, nom, rarete, valeur, ipfsHash) => {
      if (!contract) throw new Error("Contrat non configure");

      showMessage("Transaction en cours...");
      const tx = await contract.creerCarte(destinataire, nom, rarete, valeur, ipfsHash);
      showMessage("Transaction envoyee. Attente de confirmation...");
      await tx.wait();
      showMessage("Carte creee avec succes!");
    },
    [contract, showMessage]
  );

  const transferCard = useCallback(
    async (tokenId, to) => {
      if (!contract) throw new Error("Contrat non configure");

      showMessage("Transfert en cours...");
      const tx = await contract.transferFrom(userAddress, to, tokenId);
      showMessage("Transaction envoyee. Attente de confirmation...");
      await tx.wait();
      showMessage("Carte transferee avec succes!");
    },
    [contract, userAddress, showMessage]
  );

  const proposeExchange = useCallback(
    async (monTokenId, tokenVouluId) => {
      if (!contract) throw new Error("Contrat non configure");

      showMessage("Proposition d'echange en cours...");
      const tx = await contract.proposerEchange(monTokenId, tokenVouluId);
      showMessage("Transaction envoyee. Attente de confirmation...");
      await tx.wait();
      showMessage("Echange propose avec succes!");
    },
    [contract, showMessage]
  );

  const fetchExchange = useCallback(
    async (echangeId) => {
      if (!contract) throw new Error("Contrat non configure");

      const echange = await contract.getEchange(echangeId);
      const isProposeur =
        userAddress && echange.proposeur.toLowerCase() === userAddress.toLowerCase();

      let isAccepteur = false;
      if (userAddress && echange.active) {
        try {
          const tokenVouluOwner = await contract.ownerOf(echange.tokenVoulu);
          isAccepteur = tokenVouluOwner.toLowerCase() === userAddress.toLowerCase();
        } catch {
          isAccepteur = false;
        }
      }

      return {
        proposeur: echange.proposeur,
        tokenPropose: Number(echange.tokenPropose),
        tokenVoulu: Number(echange.tokenVoulu),
        active: echange.active,
        isProposeur,
        isAccepteur,
      };
    },
    [contract, userAddress]
  );

  const acceptExchange = useCallback(
    async (echangeId) => {
      if (!contract) throw new Error("Contrat non configure");

      showMessage("Acceptation de l'echange en cours...");
      const tx = await contract.accepterEchange(echangeId);
      showMessage("Transaction envoyee. Attente de confirmation...");
      await tx.wait();
      showMessage("Echange effectue avec succes!");
    },
    [contract, showMessage]
  );

  const cancelExchange = useCallback(
    async (echangeId) => {
      if (!contract) throw new Error("Contrat non configure");

      showMessage("Annulation en cours...");
      const tx = await contract.annulerEchange(echangeId);
      showMessage("Transaction envoyee. Attente de confirmation...");
      await tx.wait();
      showMessage("Echange annule!");
    },
    [contract, showMessage]
  );

  const fetchCooldown = useCallback(async () => {
    if (!contract || !userAddress) return 0;

    const restant = await contract.getCooldownRestant(userAddress);
    return Number(restant);
  }, [contract, userAddress]);

  return {
    fetchUserCards,
    fetchCardDetails,
    createCard,
    transferCard,
    proposeExchange,
    fetchExchange,
    acceptExchange,
    cancelExchange,
    fetchCooldown,
  };
}
