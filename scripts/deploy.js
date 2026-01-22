const hre = require("hardhat");

async function main() {
    console.log("Deploiement du contrat TradingCards...\n");

    // Recuperer le deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploiement avec le compte:", deployer.address);

    // Recuperer le solde
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Solde du compte:", hre.ethers.formatEther(balance), "ETH\n");

    // Deployer le contrat
    const TradingCards = await hre.ethers.getContractFactory("TradingCards");
    const tradingCards = await TradingCards.deploy();

    await tradingCards.waitForDeployment();

    const contractAddress = await tradingCards.getAddress();

    console.log("=".repeat(50));
    console.log("TradingCards deploye a l'adresse:");
    console.log(contractAddress);
    console.log("=".repeat(50));
    console.log("\nCopiez cette adresse dans frontend/app.js");
    console.log('const CONTRACT_ADDRESS = "' + contractAddress + '";');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
