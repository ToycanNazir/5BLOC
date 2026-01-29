// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TradingCards
 * @dev Contrat de cartes a collectionner NFT avec 4 niveaux de rarete
 * @notice Limite de 4 cartes par utilisateur
 */
contract TradingCards is ERC721, Ownable {

    // ============ ENUMS ============

    enum Rarete {
        Commune,      // 0
        Rare,         // 1
        Epique,       // 2
        Legendaire    // 3
    }

    // ============ STRUCTS ============

    struct Carte {
        string nom;
        Rarete rarete;
        uint256 valeur;
        string ipfsHash;
        address[] anciensProprios;
        uint256 creeA;
        uint256 dernierTransfertA;
    }

    struct PropositionEchange {
        address proposeur;
        uint256 tokenPropose;
        uint256 tokenVoulu;
        bool active;
    }

    // ============ CONSTANTES ============

    uint256 public constant MAX_CARTES_PAR_UTILISATEUR = 4;
    uint256 public constant COOLDOWN_DUREE = 5 minutes;
    uint256 public constant LOCK_DUREE = 10 minutes;

    // ============ VARIABLES D'ETAT ============

    uint256 private _prochainTokenId;

    // tokenId => Carte
    mapping(uint256 => Carte) private _cartes;

    // adresse => nombre de cartes possedees
    mapping(address => uint256) private _nombreCartes;

    // adresse => timestamp de la derniere transaction
    mapping(address => uint256) private _dernierTransaction;

    // id => proposition d'echange
    mapping(uint256 => PropositionEchange) private _echanges;
    uint256 private _prochainEchangeId;

    // Flag pour bypass les checks dans _update lors d'un echange
    bool private _echangeEnCours;

    // ============ EVENTS ============

    event CarteCree(
        uint256 indexed tokenId,
        address indexed proprietaire,
        string nom,
        Rarete rarete,
        uint256 valeur
    );

    event CarteTransferee(
        uint256 indexed tokenId,
        address indexed ancienProprio,
        address indexed nouveauProprio,
        uint256 timestamp
    );

    event EchangePropose(
        uint256 indexed echangeId,
        address indexed proposeur,
        uint256 tokenPropose,
        uint256 tokenVoulu
    );

    event EchangeAccepte(
        uint256 indexed echangeId,
        address indexed proposeur,
        address indexed accepteur,
        uint256 tokenPropose,
        uint256 tokenVoulu
    );

    event EchangeAnnule(uint256 indexed echangeId);

    // ============ CONSTRUCTEUR ============

    constructor() ERC721("TradingCards", "CARD") Ownable(msg.sender) {
        _prochainTokenId = 1;
    }

    // ============ FONCTIONS PRINCIPALES ============

    /**
     * @dev Creer une nouvelle carte NFT
     * @param destinataire Adresse qui recevra la carte
     * @param nom Nom de la carte
     * @param rarete Niveau de rarete de la carte
     * @param valeur Valeur associee a la carte
     * @param ipfsHash Hash IPFS des metadonnees/image
     */
    function creerCarte(
        address destinataire,
        string memory nom,
        Rarete rarete,
        uint256 valeur,
        string memory ipfsHash
    ) external onlyOwner returns (uint256) {
        require(destinataire != address(0), "Adresse invalide");
        require(bytes(nom).length > 0, "Nom requis");
        require(bytes(ipfsHash).length > 0, "Hash IPFS requis");
        require(
            _nombreCartes[destinataire] < MAX_CARTES_PAR_UTILISATEUR,
            "Limite de 4 cartes atteinte"
        );

        uint256 tokenId = _prochainTokenId;
        _prochainTokenId++;

        // Creer la carte avec ses metadonnees
        _cartes[tokenId] = Carte({
            nom: nom,
            rarete: rarete,
            valeur: valeur,
            ipfsHash: ipfsHash,
            anciensProprios: new address[](0),
            creeA: block.timestamp,
            dernierTransfertA: block.timestamp
        });

        // Mint le NFT
        _safeMint(destinataire, tokenId);
        _nombreCartes[destinataire]++;

        emit CarteCree(tokenId, destinataire, nom, rarete, valeur);

        return tokenId;
    }

    // ============ FONCTIONS D'ECHANGE ============

    /**
     * @dev Proposer un echange de carte avec un autre utilisateur
     * @param monTokenId ID de la carte que je propose
     * @param tokenVouluId ID de la carte que je veux en echange
     */
    function proposerEchange(
        uint256 monTokenId,
        uint256 tokenVouluId
    ) external returns (uint256) {
        require(_existeCarte(monTokenId), "Votre carte inexistante");
        require(_existeCarte(tokenVouluId), "Carte voulue inexistante");
        require(ownerOf(monTokenId) == msg.sender, "Vous ne possedez pas cette carte");
        require(ownerOf(tokenVouluId) != msg.sender, "Vous possedez deja la carte voulue");

        // Regle de validation: echange uniquement entre raretes identiques ou adjacentes
        uint8 rareteA = uint8(_cartes[monTokenId].rarete);
        uint8 rareteB = uint8(_cartes[tokenVouluId].rarete);
        uint8 diff = rareteA > rareteB ? rareteA - rareteB : rareteB - rareteA;
        require(diff <= 1, "Echange interdit: raretes trop eloignees (max 1 niveau d'ecart)");

        uint256 echangeId = _prochainEchangeId;
        _prochainEchangeId++;

        _echanges[echangeId] = PropositionEchange({
            proposeur: msg.sender,
            tokenPropose: monTokenId,
            tokenVoulu: tokenVouluId,
            active: true
        });

        emit EchangePropose(echangeId, msg.sender, monTokenId, tokenVouluId);

        return echangeId;
    }

    /**
     * @dev Accepter une proposition d'echange
     * @param echangeId ID de la proposition d'echange
     */
    function accepterEchange(uint256 echangeId) external {
        PropositionEchange storage echange = _echanges[echangeId];
        require(echange.active, "Echange inactif ou inexistant");

        address proposeur = echange.proposeur;
        address accepteur = msg.sender;
        uint256 tokenPropose = echange.tokenPropose;
        uint256 tokenVoulu = echange.tokenVoulu;

        require(ownerOf(tokenVoulu) == accepteur, "Vous ne possedez pas la carte demandee");
        require(ownerOf(tokenPropose) == proposeur, "Le proposeur ne possede plus sa carte");

        // Verifier les cooldowns des deux utilisateurs
        require(
            block.timestamp >= _dernierTransaction[proposeur] + COOLDOWN_DUREE,
            "Cooldown actif pour le proposeur"
        );
        require(
            block.timestamp >= _dernierTransaction[accepteur] + COOLDOWN_DUREE,
            "Cooldown actif pour l'accepteur"
        );

        // Verifier les locks des deux cartes
        require(
            block.timestamp >= _cartes[tokenPropose].dernierTransfertA + LOCK_DUREE,
            "Carte proposee encore verrouillee"
        );
        require(
            block.timestamp >= _cartes[tokenVoulu].dernierTransfertA + LOCK_DUREE,
            "Carte demandee encore verrouillee"
        );

        // Desactiver la proposition
        echange.active = false;

        // Activer le flag pour bypass les checks dans _update
        _echangeEnCours = true;

        // Effectuer les deux transferts
        _transfer(proposeur, accepteur, tokenPropose);
        _transfer(accepteur, proposeur, tokenVoulu);

        // Desactiver le flag
        _echangeEnCours = false;

        // Mettre a jour les cooldowns des deux utilisateurs
        _dernierTransaction[proposeur] = block.timestamp;
        _dernierTransaction[accepteur] = block.timestamp;

        emit EchangeAccepte(echangeId, proposeur, accepteur, tokenPropose, tokenVoulu);
    }

    /**
     * @dev Annuler une proposition d'echange
     * @param echangeId ID de la proposition
     */
    function annulerEchange(uint256 echangeId) external {
        PropositionEchange storage echange = _echanges[echangeId];
        require(echange.active, "Echange deja inactif");
        require(echange.proposeur == msg.sender, "Seul le proposeur peut annuler");

        echange.active = false;

        emit EchangeAnnule(echangeId);
    }

    // ============ FONCTIONS DE LECTURE ============

    /**
     * @dev Recuperer les informations de base d'une carte
     * @param tokenId ID de la carte
     */
    function getCarte(uint256 tokenId) external view returns (
        string memory nom,
        Rarete rarete,
        uint256 valeur,
        string memory ipfsHash
    ) {
        require(_existeCarte(tokenId), "Carte inexistante");

        Carte storage carte = _cartes[tokenId];
        return (
            carte.nom,
            carte.rarete,
            carte.valeur,
            carte.ipfsHash
        );
    }

    /**
     * @dev Recuperer l'historique d'une carte
     * @param tokenId ID de la carte
     */
    function getCarteHistorique(uint256 tokenId) external view returns (
        address[] memory anciensProprios,
        uint256 creeA,
        uint256 dernierTransfertA,
        address proprietaireActuel
    ) {
        require(_existeCarte(tokenId), "Carte inexistante");

        Carte storage carte = _cartes[tokenId];
        return (
            carte.anciensProprios,
            carte.creeA,
            carte.dernierTransfertA,
            ownerOf(tokenId)
        );
    }

    /**
     * @dev Recuperer le nombre de cartes d'un utilisateur
     * @param utilisateur Adresse de l'utilisateur
     */
    function getNombreCartes(address utilisateur) external view returns (uint256) {
        return _nombreCartes[utilisateur];
    }

    /**
     * @dev Recuperer la rarete d'une carte
     * @param tokenId ID de la carte
     */
    function getRarete(uint256 tokenId) external view returns (Rarete) {
        require(_existeCarte(tokenId), "Carte inexistante");
        return _cartes[tokenId].rarete;
    }

    /**
     * @dev Recuperer la valeur d'une carte
     * @param tokenId ID de la carte
     */
    function getValeur(uint256 tokenId) external view returns (uint256) {
        require(_existeCarte(tokenId), "Carte inexistante");
        return _cartes[tokenId].valeur;
    }

    /**
     * @dev Verifier si un utilisateur peut recevoir une carte
     * @param utilisateur Adresse de l'utilisateur
     */
    function peutRecevoirCarte(address utilisateur) external view returns (bool) {
        return _nombreCartes[utilisateur] < MAX_CARTES_PAR_UTILISATEUR;
    }

    /**
     * @dev Recuperer le prochain token ID
     */
    function getProchainTokenId() external view returns (uint256) {
        return _prochainTokenId;
    }

    /**
     * @dev Recuperer le temps restant du cooldown d'un utilisateur (en secondes)
     * @param utilisateur Adresse de l'utilisateur
     */
    function getCooldownRestant(address utilisateur) external view returns (uint256) {
        uint256 finCooldown = _dernierTransaction[utilisateur] + COOLDOWN_DUREE;
        if (block.timestamp >= finCooldown) {
            return 0;
        }
        return finCooldown - block.timestamp;
    }

    /**
     * @dev Recuperer le temps restant du lock d'une carte (en secondes)
     * @param tokenId ID de la carte
     */
    function getLockRestant(uint256 tokenId) external view returns (uint256) {
        require(_existeCarte(tokenId), "Carte inexistante");
        uint256 finLock = _cartes[tokenId].dernierTransfertA + LOCK_DUREE;
        if (block.timestamp >= finLock) {
            return 0;
        }
        return finLock - block.timestamp;
    }

    /**
     * @dev Verifier si une carte est actuellement verrouillee
     * @param tokenId ID de la carte
     */
    function estVerrouillee(uint256 tokenId) external view returns (bool) {
        require(_existeCarte(tokenId), "Carte inexistante");
        return block.timestamp < _cartes[tokenId].dernierTransfertA + LOCK_DUREE;
    }

    /**
     * @dev Recuperer les details d'une proposition d'echange
     * @param echangeId ID de la proposition
     */
    function getEchange(uint256 echangeId) external view returns (
        address proposeur,
        uint256 tokenPropose,
        uint256 tokenVoulu,
        bool active
    ) {
        PropositionEchange storage e = _echanges[echangeId];
        return (e.proposeur, e.tokenPropose, e.tokenVoulu, e.active);
    }

    /**
     * @dev Recuperer le prochain ID d'echange
     */
    function getProchainEchangeId() external view returns (uint256) {
        return _prochainEchangeId;
    }

    // ============ FONCTIONS INTERNES ============

    /**
     * @dev Verifier si une carte existe
     * @param tokenId ID de la carte
     */
    function _existeCarte(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _prochainTokenId;
    }

    /**
     * @dev Override du transfert pour mettre a jour les metadonnees
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Appel du parent
        address previousOwner = super._update(to, tokenId, auth);

        // Mise a jour des compteurs et metadonnees si c'est un transfert (pas un mint/burn)
        if (from != address(0) && to != address(0)) {
            if (!_echangeEnCours) {
                // Verifier le cooldown de l'expediteur (5 min entre deux transactions)
                require(
                    block.timestamp >= _dernierTransaction[from] + COOLDOWN_DUREE,
                    "Cooldown actif: attendez 5 minutes entre deux transactions"
                );

                // Verifier le lock temporaire de la carte (10 min apres acquisition)
                require(
                    block.timestamp >= _cartes[tokenId].dernierTransfertA + LOCK_DUREE,
                    "Carte verrouillee: attendez 10 minutes apres acquisition"
                );

                // Verifier la limite du destinataire
                require(
                    _nombreCartes[to] < MAX_CARTES_PAR_UTILISATEUR,
                    "Destinataire a atteint la limite de 4 cartes"
                );

                // Mettre a jour le cooldown de l'expediteur
                _dernierTransaction[from] = block.timestamp;
            }

            // Mettre a jour les compteurs
            _nombreCartes[from]--;
            _nombreCartes[to]++;

            // Mettre a jour les metadonnees de la carte
            _cartes[tokenId].anciensProprios.push(from);
            _cartes[tokenId].dernierTransfertA = block.timestamp;

            emit CarteTransferee(tokenId, from, to, block.timestamp);
        }

        return previousOwner;
    }
}
