// Configuration
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI du contrat (fonctions utilisees)
const CONTRACT_ABI = [
    // Lecture
    "function getCarte(uint256 tokenId) view returns (string nom, uint8 rarete, uint256 valeur, string ipfsHash)",
    "function getCarteHistorique(uint256 tokenId) view returns (address[] anciensProprios, uint256 creeA, uint256 dernierTransfertA, address proprietaireActuel)",
    "function getNombreCartes(address utilisateur) view returns (uint256)",
    "function getRarete(uint256 tokenId) view returns (uint8)",
    "function getValeur(uint256 tokenId) view returns (uint256)",
    "function peutRecevoirCarte(address utilisateur) view returns (bool)",
    "function getProchainTokenId() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function owner() view returns (address)",
    "function MAX_CARTES_PAR_UTILISATEUR() view returns (uint256)",

    // Ecriture
    "function creerCarte(address destinataire, string nom, uint8 rarete, uint256 valeur, string ipfsHash) returns (uint256)",

    // Events
    "event CarteCree(uint256 indexed tokenId, address indexed proprietaire, string nom, uint8 rarete, uint256 valeur)",
    "event CarteTransferee(uint256 indexed tokenId, address indexed ancienProprio, address indexed nouveauProprio, uint256 timestamp)"
];

// Variables globales
let provider = null;
let signer = null;
let contract = null;
let userAddress = null;

// Mapping des raretes
const RARETES = ["Commune", "Rare", "Epique", "Legendaire"];
const RARETES_CLASS = ["commune", "rare", "epique", "legendaire"];

// Elements DOM
const connectBtn = document.getElementById("connect-btn");
const walletInfo = document.getElementById("wallet-info");
const walletAddress = document.getElementById("wallet-address");
const cardCount = document.getElementById("card-count");
const messageDiv = document.getElementById("message");
const myCardsDiv = document.getElementById("my-cards");
const createCardSection = document.getElementById("create-card-section");
const createCardForm = document.getElementById("create-card-form");
const searchBtn = document.getElementById("search-btn");
const searchTokenId = document.getElementById("search-token-id");
const cardDetails = document.getElementById("card-details");

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
    connectBtn.addEventListener("click", connectWallet);
    createCardForm.addEventListener("submit", creerCarte);
    searchBtn.addEventListener("click", rechercherCarte);

    // Verifier si deja connecte
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

// Afficher un message
function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
        messageDiv.classList.add("hidden");
    }, 5000);
}

// Connexion MetaMask
async function connectWallet() {
    if (!window.ethereum) {
        showMessage("MetaMask n'est pas installe!", "error");
        return;
    }

    try {
        // Demander la connexion
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        userAddress = accounts[0];

        // Creer le provider et signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();

        // Verifier si le contrat est configure
        if (!CONTRACT_ADDRESS) {
            showMessage("Adresse du contrat non configuree. Deployez d'abord le contrat.", "error");
            updateUIConnected();
            return;
        }

        // Creer l'instance du contrat
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Mettre a jour l'interface
        updateUIConnected();

        // Charger les cartes
        await chargerMesCartes();

        // Verifier si admin
        await verifierAdmin();

        showMessage("Wallet connecte avec succes!");

    } catch (error) {
        console.error(error);
        showMessage("Erreur de connexion: " + error.message, "error");
    }
}

// Mettre a jour l'interface apres connexion
function updateUIConnected() {
    connectBtn.classList.add("hidden");
    walletInfo.classList.remove("hidden");
    walletAddress.textContent = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
}

// Verifier si l'utilisateur est admin (owner du contrat)
async function verifierAdmin() {
    if (!contract) return;

    try {
        const owner = await contract.owner();
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
            createCardSection.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Erreur verification admin:", error);
    }
}

// Charger les cartes de l'utilisateur
async function chargerMesCartes() {
    if (!contract) {
        myCardsDiv.innerHTML = '<p class="placeholder">Contrat non configure</p>';
        return;
    }

    try {
        console.log("Chargement des cartes pour:", userAddress);

        const nombreCartes = await contract.getNombreCartes(userAddress);
        console.log("Nombre de cartes:", nombreCartes.toString());
        cardCount.textContent = `${nombreCartes}/4 cartes`;

        if (Number(nombreCartes) === 0) {
            myCardsDiv.innerHTML = '<p class="placeholder">Vous n\'avez aucune carte</p>';
            return;
        }

        // Recuperer toutes les cartes
        myCardsDiv.innerHTML = "";
        const prochainId = await contract.getProchainTokenId();
        console.log("Prochain token ID:", prochainId.toString());

        let cartesAffichees = 0;
        for (let i = 1; i < Number(prochainId); i++) {
            try {
                const owner = await contract.ownerOf(i);
                console.log(`Carte ${i} appartient a:`, owner);
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const carteHTML = await creerCarteHTML(i);
                    myCardsDiv.innerHTML += carteHTML;
                    cartesAffichees++;
                }
            } catch (e) {
                console.log(`Carte ${i} erreur:`, e.message);
                continue;
            }
        }

        if (cartesAffichees === 0) {
            myCardsDiv.innerHTML = '<p class="placeholder">Vous n\'avez aucune carte</p>';
        }

    } catch (error) {
        console.error("Erreur chargement cartes:", error);
        myCardsDiv.innerHTML = '<p class="placeholder">Erreur lors du chargement: ' + error.message + '</p>';
    }
}

// Creer le HTML d'une carte
async function creerCarteHTML(tokenId) {
    const carte = await contract.getCarte(tokenId);
    const rareteIndex = Number(carte.rarete);
    const rareteNom = RARETES[rareteIndex];
    const rareteClass = RARETES_CLASS[rareteIndex];

    return `
        <div class="card ${rareteClass}">
            <span class="rarete-badge ${rareteClass}">${rareteNom}</span>
            <h3>${carte.nom}</h3>
            <p>ID: #${tokenId}</p>
            <p class="valeur">${carte.valeur} pts</p>
        </div>
    `;
}

// Creer une nouvelle carte (admin)
async function creerCarte(e) {
    e.preventDefault();

    if (!contract) {
        showMessage("Contrat non configure", "error");
        return;
    }

    const destinataire = document.getElementById("destinataire").value;
    const nom = document.getElementById("nom").value;
    const rarete = document.getElementById("rarete").value;
    const valeur = document.getElementById("valeur").value;
    const ipfsHash = document.getElementById("ipfsHash").value;

    try {
        showMessage("Transaction en cours...");

        const tx = await contract.creerCarte(
            destinataire,
            nom,
            rarete,
            valeur,
            ipfsHash
        );

        showMessage("Transaction envoyee. Attente de confirmation...");
        await tx.wait();

        showMessage("Carte creee avec succes!");
        createCardForm.reset();

        // Recharger les cartes
        await chargerMesCartes();

    } catch (error) {
        console.error(error);
        showMessage("Erreur: " + (error.reason || error.message), "error");
    }
}

// Rechercher une carte par ID
async function rechercherCarte() {
    if (!contract) {
        showMessage("Contrat non configure", "error");
        return;
    }

    const tokenId = searchTokenId.value;
    if (!tokenId) {
        showMessage("Entrez un ID de carte", "error");
        return;
    }

    try {
        // Recuperer les infos de base
        const carte = await contract.getCarte(tokenId);
        const historique = await contract.getCarteHistorique(tokenId);

        // Afficher les details
        document.getElementById("detail-nom").textContent = carte.nom;
        document.getElementById("detail-rarete").textContent = RARETES[Number(carte.rarete)];
        document.getElementById("detail-valeur").textContent = carte.valeur.toString();
        document.getElementById("detail-ipfs").textContent = carte.ipfsHash;
        document.getElementById("detail-owner").textContent =
            historique.proprietaireActuel.slice(0, 6) + "..." + historique.proprietaireActuel.slice(-4);
        document.getElementById("detail-created").textContent =
            new Date(Number(historique.creeA) * 1000).toLocaleString("fr-FR");
        document.getElementById("detail-transfer").textContent =
            new Date(Number(historique.dernierTransfertA) * 1000).toLocaleString("fr-FR");

        const anciensProprios = historique.anciensProprios.length > 0
            ? historique.anciensProprios.map(a => a.slice(0, 6) + "...").join(", ")
            : "Aucun";
        document.getElementById("detail-previous").textContent = anciensProprios;

        cardDetails.classList.remove("hidden");

    } catch (error) {
        console.error(error);
        showMessage("Carte non trouvee ou erreur", "error");
        cardDetails.classList.add("hidden");
    }
}

// Ecouter les changements de compte
if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
            // Deconnecte
            location.reload();
        } else {
            userAddress = accounts[0];
            connectWallet();
        }
    });

    window.ethereum.on("chainChanged", () => {
        location.reload();
    });
}
