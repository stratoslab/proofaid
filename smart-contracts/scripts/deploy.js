const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const CONTRACT_NAMES = ["AidProgram", "BeneficiaryRegistry", "AidVoucher", "DistributionEvent"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Set CELO_PRIVATE_KEY in smart-contracts/.env");
  }

  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;

  console.log(`Deploying to ${networkName} (chainId=${network.chainId}) with ${deployer.address}`);

  const deployed = {};

  for (const name of CONTRACT_NAMES) {
    const factory = await hre.ethers.getContractFactory(name);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    deployed[name] = address;
    console.log(`${name}: ${address}`);
  }

  const payload = {
    network: networkName,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: deployed
  };

  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  ensureDir(deploymentsDir);
  fs.writeFileSync(path.join(deploymentsDir, `${networkName}.json`), JSON.stringify(payload, null, 2));

  const dashboardContractsDir = path.resolve(__dirname, "..", "..", "dashboard", "contracts");
  ensureDir(dashboardContractsDir);

  const dashboardDeployFile = path.join(dashboardContractsDir, "deployments.json");
  let dashboardDeployments = {};
  if (fs.existsSync(dashboardDeployFile)) {
    dashboardDeployments = JSON.parse(fs.readFileSync(dashboardDeployFile, "utf8"));
  }

  dashboardDeployments[networkName] = payload;
  fs.writeFileSync(dashboardDeployFile, JSON.stringify(dashboardDeployments, null, 2));

  console.log(`Deployment metadata written to ${path.relative(process.cwd(), dashboardDeployFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
