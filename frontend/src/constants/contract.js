export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
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
  "function getCooldownRestant(address utilisateur) view returns (uint256)",
  "function getLockRestant(uint256 tokenId) view returns (uint256)",
  "function estVerrouillee(uint256 tokenId) view returns (bool)",
  "function getEchange(uint256 echangeId) view returns (address proposeur, uint256 tokenPropose, uint256 tokenVoulu, bool active)",
  "function getProchainEchangeId() view returns (uint256)",
  "function COOLDOWN_DUREE() view returns (uint256)",
  "function LOCK_DUREE() view returns (uint256)",

  // Ecriture
  "function creerCarte(address destinataire, string nom, uint8 rarete, uint256 valeur, string ipfsHash) returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function proposerEchange(uint256 monTokenId, uint256 tokenVouluId) returns (uint256)",
  "function accepterEchange(uint256 echangeId)",
  "function annulerEchange(uint256 echangeId)",

  // Events
  "event CarteCree(uint256 indexed tokenId, address indexed proprietaire, string nom, uint8 rarete, uint256 valeur)",
  "event CarteTransferee(uint256 indexed tokenId, address indexed ancienProprio, address indexed nouveauProprio, uint256 timestamp)",
  "event EchangePropose(uint256 indexed echangeId, address indexed proposeur, uint256 tokenPropose, uint256 tokenVoulu)",
  "event EchangeAccepte(uint256 indexed echangeId, address indexed proposeur, address indexed accepteur, uint256 tokenPropose, uint256 tokenVoulu)",
  "event EchangeAnnule(uint256 indexed echangeId)",
];

export const RARETES = ["Commune", "Rare", "Epique", "Legendaire"];
export const RARETES_CLASS = ["commune", "rare", "epique", "legendaire"];
