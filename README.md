# Trading Cards NFT - DApp Web3

## Description
Application décentralisée (DApp) de trading cards numériques basée sur la blockchain Ethereum. Les utilisateurs peuvent collectionner, échanger et gérer des cartes NFT de différentes raretés.

## Cas d'Usage
Système de cartes à collectionner numériques avec :
- **4 types de cartes** : Common, Rare, Epic, Legendary
- **Échanges entre joueurs** avec système de conversion (ex: 3 Common = 1 Rare)
- **Limite de possession** : Maximum 4 cartes par joueur
- **Métadonnées stockées sur IPFS**
- **Contraintes temporelles** : Cooldown et locks de sécurité

## Contraintes Techniques
- ✅ Tokenisation des ressources (ERC721)
- ✅ Échanges de tokens avec règles de validation
- ✅ Limite de 4 ressources par utilisateur
- ✅ Cooldown de 5 minutes entre transactions
- ✅ Lock de 10 minutes après acquisition
- ✅ Métadonnées sur IPFS
- ✅ Tests unitaires avec Hardhat

## Stack Technique
- **Blockchain** : Ethereum
- **Smart Contracts** : Solidity 0.8.20
- **Framework** : Hardhat
- **Standards** : ERC721 (OpenZeppelin)
- **Stockage** : IPFS
- **Tests** : Hardhat + Chai

## Installation

```bash
npm install
```

## Commandes

```bash
# Compiler les smart contracts
npx hardhat compile

# Lancer les tests
npx hardhat test

# Lancer un nœud local
npx hardhat node

# Déployer les contracts
npx hardhat run scripts/deploy.js --network localhost
```

## Structure du Projet
```
├── contracts/          # Smart contracts Solidity
├── test/              # Tests unitaires
├── scripts/           # Scripts de déploiement
└── hardhat.config.js  # Configuration Hardhat
```

## Métadonnées des Tokens
```json
{
    "name": "Nom de la carte",
    "type": "Common|Rare|Epic|Legendary",
    "value": "Valeur en points",
    "hash": "Hash IPFS de l'image",
    "previousOwners": ["0x..."],
    "createdAt": "timestamp",
    "lastTransferAt": "timestamp"
}
```

## Auteurs
Projet réalisé dans le cadre du cours Web3 - Développement DApp.
