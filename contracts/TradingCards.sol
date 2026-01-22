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

    // ============ CONSTANTES ============

    uint256 public constant MAX_CARTES_PAR_UTILISATEUR = 4;

    // ============ VARIABLES D'ETAT ============

    uint256 private _prochainTokenId;

    // tokenId => Carte
    mapping(uint256 => Carte) private _cartes;

    // adresse => nombre de cartes possedees
    mapping(address => uint256) private _nombreCartes;

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
            // Verifier la limite du destinataire
            require(
                _nombreCartes[to] < MAX_CARTES_PAR_UTILISATEUR,
                "Destinataire a atteint la limite de 4 cartes"
            );

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
