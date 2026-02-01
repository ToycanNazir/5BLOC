const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TradingCards", function () {
  let tradingCards;
  let owner, user1, user2, user3;

  const COOLDOWN = 5 * 60;
  const LOCK = 10 * 60;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const TradingCards = await ethers.getContractFactory("TradingCards");
    tradingCards = await TradingCards.deploy();
    await tradingCards.waitForDeployment();
  });

  // ============ CREATION DE CARTES ============

  describe("Creation de cartes", function () {
    it("devrait creer une carte avec les bonnes metadonnees", async function () {
      await tradingCards.creerCarte(user1.address, "Dragon", 2, 500, "QmHash123");

      const carte = await tradingCards.getCarte(1);
      expect(carte.nom).to.equal("Dragon");
      expect(carte.rarete).to.equal(2);
      expect(carte.valeur).to.equal(500);
      expect(carte.ipfsHash).to.equal("QmHash123");
      expect(await tradingCards.ownerOf(1)).to.equal(user1.address);
      expect(await tradingCards.getNombreCartes(user1.address)).to.equal(1);
    });

    it("devrait echouer si appelant n'est pas le owner", async function () {
      await expect(
        tradingCards.connect(user1).creerCarte(user1.address, "Dragon", 0, 100, "QmHash1")
      ).to.be.revertedWithCustomError(tradingCards, "OwnableUnauthorizedAccount");
    });

    it("devrait echouer avec des parametres invalides", async function () {
      await expect(
        tradingCards.creerCarte(ethers.ZeroAddress, "Dragon", 0, 100, "QmHash1")
      ).to.be.revertedWith("Adresse invalide");
      await expect(
        tradingCards.creerCarte(user1.address, "", 0, 100, "QmHash1")
      ).to.be.revertedWith("Nom requis");
      await expect(
        tradingCards.creerCarte(user1.address, "Dragon", 0, 100, "")
      ).to.be.revertedWith("Hash IPFS requis");
    });
  });

  // ============ LIMITE DE POSSESSION ============

  describe("Limite de possession (max 4)", function () {
    it("devrait permettre 4 cartes et bloquer la 5eme", async function () {
      await tradingCards.creerCarte(user1.address, "C1", 0, 100, "Qm1");
      await tradingCards.creerCarte(user1.address, "C2", 1, 200, "Qm2");
      await tradingCards.creerCarte(user1.address, "C3", 2, 300, "Qm3");
      await tradingCards.creerCarte(user1.address, "C4", 3, 400, "Qm4");

      expect(await tradingCards.getNombreCartes(user1.address)).to.equal(4);
      expect(await tradingCards.peutRecevoirCarte(user1.address)).to.be.false;

      await expect(
        tradingCards.creerCarte(user1.address, "C5", 0, 500, "Qm5")
      ).to.be.revertedWith("Limite de 4 cartes atteinte");
    });
  });

  // ============ TRANSFERT + COOLDOWN + LOCK ============

  describe("Transfert, cooldown et lock", function () {
    beforeEach(async function () {
      await tradingCards.creerCarte(user1.address, "Carte1", 0, 100, "QmHash1");
      await tradingCards.creerCarte(user1.address, "Carte2", 1, 200, "QmHash2");
    });

    it("devrait bloquer le transfert pendant le lock de 10 min", async function () {
      expect(await tradingCards.estVerrouillee(1)).to.be.true;
      await expect(
        tradingCards.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Carte verrouillee: attendez 10 minutes apres acquisition");
    });

    it("devrait transferer apres le lock et mettre a jour l'historique", async function () {
      await time.increase(LOCK + 1);

      await tradingCards.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await tradingCards.ownerOf(1)).to.equal(user2.address);
      expect(await tradingCards.getNombreCartes(user1.address)).to.equal(1);
      expect(await tradingCards.getNombreCartes(user2.address)).to.equal(1);

      const historique = await tradingCards.getCarteHistorique(1);
      expect(historique.anciensProprios).to.include(user1.address);
    });

    it("devrait bloquer un 2eme transfert avant le cooldown de 5 min", async function () {
      await time.increase(LOCK + 1);
      await tradingCards.connect(user1).transferFrom(user1.address, user2.address, 1);

      expect(await tradingCards.getCooldownRestant(user1.address)).to.be.greaterThan(0);

      await expect(
        tradingCards.connect(user1).transferFrom(user1.address, user2.address, 2)
      ).to.be.revertedWith("Cooldown actif: attendez 5 minutes entre deux transactions");
    });

    it("devrait permettre un transfert apres le cooldown", async function () {
      await time.increase(LOCK + 1);
      await tradingCards.connect(user1).transferFrom(user1.address, user2.address, 1);

      await time.increase(COOLDOWN + LOCK + 1);

      await tradingCards.connect(user1).transferFrom(user1.address, user2.address, 2);
      expect(await tradingCards.ownerOf(2)).to.equal(user2.address);
    });
  });

  // ============ ECHANGES ============

  describe("Echanges", function () {
    beforeEach(async function () {
      await tradingCards.creerCarte(user1.address, "Dragon", 1, 200, "QmHash1");
      await tradingCards.creerCarte(user2.address, "Sorcier", 1, 250, "QmHash2");
    });

    it("devrait proposer un echange entre raretes identiques ou adjacentes", async function () {
      await tradingCards.connect(user1).proposerEchange(1, 2);
      const echange = await tradingCards.getEchange(0);

      expect(echange.proposeur).to.equal(user1.address);
      expect(echange.tokenPropose).to.equal(1);
      expect(echange.tokenVoulu).to.equal(2);
      expect(echange.active).to.be.true;
    });

    it("devrait bloquer un echange entre raretes trop eloignees", async function () {
      await tradingCards.creerCarte(user1.address, "Legende", 3, 1000, "QmHash3");
      await expect(
        tradingCards.connect(user1).proposerEchange(3, 2)
      ).to.be.revertedWith("Echange interdit: raretes trop eloignees (max 1 niveau d'ecart)");
    });

    it("devrait effectuer l'echange apres les locks", async function () {
      await tradingCards.connect(user1).proposerEchange(1, 2);
      await time.increase(LOCK + 1);

      await tradingCards.connect(user2).accepterEchange(0);

      expect(await tradingCards.ownerOf(1)).to.equal(user2.address);
      expect(await tradingCards.ownerOf(2)).to.equal(user1.address);

      const echange = await tradingCards.getEchange(0);
      expect(echange.active).to.be.false;
    });

    it("devrait bloquer l'echange si lock ou cooldown actif", async function () {
      await tradingCards.connect(user1).proposerEchange(1, 2);

      // Lock encore actif
      await expect(
        tradingCards.connect(user2).accepterEchange(0)
      ).to.be.revertedWith("Carte proposee encore verrouillee");
    });

    it("devrait annuler un echange (proposeur uniquement)", async function () {
      await tradingCards.connect(user1).proposerEchange(1, 2);

      await expect(
        tradingCards.connect(user2).annulerEchange(0)
      ).to.be.revertedWith("Seul le proposeur peut annuler");

      await tradingCards.connect(user1).annulerEchange(0);
      const echange = await tradingCards.getEchange(0);
      expect(echange.active).to.be.false;
    });
  });
});
