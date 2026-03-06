const { ethers } = window;

const statusNode = document.getElementById("walletStatus");
const deploymentNode = document.getElementById("deploymentInfo");
const txLog = document.getElementById("txLog");
const networkSelect = document.getElementById("networkSelect");

const createProgramForm = document.getElementById("createProgramForm");
const registerBeneficiaryForm = document.getElementById("registerBeneficiaryForm");
const issueVoucherForm = document.getElementById("issueVoucherForm");
const redeemVoucherForm = document.getElementById("redeemVoucherForm");

const BUILTIN_NETWORKS = {
  alfajores: {
    key: "alfajores",
    chainId: 44787,
    chainHex: "0xaef3",
    chainName: "Celo Alfajores",
    rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
    nativeCurrency: { name: "CELO", symbol: "A-CELO", decimals: 18 },
    blockExplorerUrls: ["https://alfajores.celoscan.io"]
  },
  celo: {
    key: "celo",
    chainId: 42220,
    chainHex: "0xa4ec",
    chainName: "Celo",
    rpcUrls: ["https://forno.celo.org"],
    nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
    blockExplorerUrls: ["https://celoscan.io"]
  }
};

let web3;
let signer;
let account;
let activeNetwork;
let deployments;
let abis;

function logTx(message) {
  const item = document.createElement("li");
  item.textContent = message;
  txLog.prepend(item);
}

function loadCustomDevnet() {
  const raw = localStorage.getItem("proofaid_devnet");
  if (!raw) return null;
  try {
    const devnet = JSON.parse(raw);
    if (!devnet.name || !devnet.rpcUrl || !devnet.chainId) return null;

    return {
      key: "devnet",
      chainId: Number(devnet.chainId),
      chainHex: `0x${Number(devnet.chainId).toString(16)}`,
      chainName: String(devnet.name),
      rpcUrls: [String(devnet.rpcUrl)],
      nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
      blockExplorerUrls: devnet.blockExplorerUrl ? [String(devnet.blockExplorerUrl)] : []
    };
  } catch {
    return null;
  }
}

function getNetworkConfig(key) {
  if (key === "devnet") return loadCustomDevnet();
  return BUILTIN_NETWORKS[key] || null;
}

function getDeploymentForChainId(chainId) {
  return Object.values(deployments || {}).find((entry) => Number(entry.chainId) === Number(chainId)) || null;
}

function ensureWallet() {
  if (!window.ethereum) {
    throw new Error("No EVM wallet found. Install MetaMask or Celo Extension Wallet.");
  }
}

async function loadConfigs() {
  const [deployRes, abiRes] = await Promise.all([
    fetch("./contracts/deployments.json"),
    fetch("./contracts/abis.json")
  ]);

  deployments = deployRes.ok ? await deployRes.json() : {};
  abis = abiRes.ok ? await abiRes.json() : { contracts: {} };
}

async function connectWallet() {
  ensureWallet();
  web3 = new ethers.BrowserProvider(window.ethereum);
  await web3.send("eth_requestAccounts", []);
  signer = await web3.getSigner();
  account = await signer.getAddress();
  const network = await web3.getNetwork();

  activeNetwork = getDeploymentForChainId(Number(network.chainId));
  statusNode.textContent = `Connected: ${account} | chainId=${network.chainId}`;
  renderDeploymentInfo();
}

function renderDeploymentInfo() {
  if (!activeNetwork) {
    deploymentNode.textContent = "No deployment found for connected network. Deploy contracts and export artifacts first.";
    return;
  }

  deploymentNode.textContent = JSON.stringify(activeNetwork, null, 2);
}

async function switchNetwork() {
  ensureWallet();
  const key = networkSelect.value;
  const target = getNetworkConfig(key);

  if (!target) {
    throw new Error("Missing network configuration. Save a devnet config first.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target.chainHex }]
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: target.chainHex,
          chainName: target.chainName,
          rpcUrls: target.rpcUrls,
          nativeCurrency: target.nativeCurrency,
          blockExplorerUrls: target.blockExplorerUrls
        }]
      });
    } else {
      throw error;
    }
  }

  await connectWallet();
}

function getContract(name) {
  if (!signer) throw new Error("Connect wallet first");
  if (!activeNetwork) throw new Error("No deployment configured for active chain");

  const address = activeNetwork.contracts[name];
  const abi = abis.contracts?.[name]?.abi;
  if (!address || !abi) throw new Error(`Missing address/ABI for ${name}`);

  return new ethers.Contract(address, abi, signer);
}

function toIdentityHash(input) {
  const normalized = String(input || "").trim().toLowerCase();
  if (!normalized) throw new Error("identity input required");
  return ethers.sha256(ethers.toUtf8Bytes(normalized));
}

async function submitCreateProgram(event) {
  event.preventDefault();
  const form = new FormData(createProgramForm);
  const contract = getContract("AidProgram");

  const tx = await contract.createProgram(
    String(form.get("name")),
    String(form.get("description")),
    BigInt(Number(form.get("budget"))),
    BigInt(Number(form.get("startDate"))),
    BigInt(Number(form.get("endDate")))
  );

  logTx(`createProgram tx submitted: ${tx.hash}`);
  await tx.wait();
  logTx("createProgram confirmed");
}

async function submitRegisterBeneficiary(event) {
  event.preventDefault();
  const form = new FormData(registerBeneficiaryForm);
  const identityHash = toIdentityHash(form.get("identityInput"));

  const contract = getContract("BeneficiaryRegistry");
  const tx = await contract.registerBeneficiary(identityHash, BigInt(Number(form.get("programId"))));
  logTx(`registerBeneficiary tx submitted: ${tx.hash}`);
  await tx.wait();
  logTx(`registerBeneficiary confirmed hash=${identityHash}`);
}

async function submitIssueVoucher(event) {
  event.preventDefault();
  const form = new FormData(issueVoucherForm);
  const identityHash = toIdentityHash(form.get("identityInput"));

  const contract = getContract("AidVoucher");
  const tx = await contract.issueVoucher(
    BigInt(Number(form.get("programId"))),
    identityHash,
    BigInt(Number(form.get("expiryDays")))
  );

  logTx(`issueVoucher tx submitted: ${tx.hash}`);
  await tx.wait();
  logTx("issueVoucher confirmed");
}

async function submitRedeemVoucher(event) {
  event.preventDefault();
  const form = new FormData(redeemVoucherForm);

  const contract = getContract("AidVoucher");
  const tx = await contract.redeemVoucher(BigInt(Number(form.get("voucherId"))));
  logTx(`redeemVoucher tx submitted: ${tx.hash}`);
  await tx.wait();
  logTx("redeemVoucher confirmed");
}

function saveDevnetConfig() {
  const name = document.getElementById("devnetName").value.trim();
  const rpcUrl = document.getElementById("devnetRpc").value.trim();
  const chainId = Number(document.getElementById("devnetChainId").value.trim());

  if (!name || !rpcUrl || !chainId) {
    throw new Error("Devnet requires name, RPC URL, and chain ID");
  }

  localStorage.setItem("proofaid_devnet", JSON.stringify({ name, rpcUrl, chainId }));
  logTx(`Saved devnet config ${name} (${chainId})`);
}

function setDefaultDates() {
  const now = Math.floor(Date.now() / 1000);
  createProgramForm.elements.startDate.value = String(now);
  createProgramForm.elements.endDate.value = String(now + 30 * 24 * 60 * 60);
}

function wrap(handler) {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      const message = error?.reason || error?.message || "Unknown error";
      logTx(`ERROR: ${message}`);
    }
  };
}

window.ethereum?.on?.("chainChanged", () => window.location.reload());
window.ethereum?.on?.("accountsChanged", () => window.location.reload());

document.getElementById("connectWallet").addEventListener("click", wrap(connectWallet));
document.getElementById("switchNetwork").addEventListener("click", wrap(switchNetwork));
document.getElementById("saveDevnet").addEventListener("click", wrap(saveDevnetConfig));
createProgramForm.addEventListener("submit", wrap(submitCreateProgram));
registerBeneficiaryForm.addEventListener("submit", wrap(submitRegisterBeneficiary));
issueVoucherForm.addEventListener("submit", wrap(submitIssueVoucher));
redeemVoucherForm.addEventListener("submit", wrap(submitRedeemVoucher));

await loadConfigs();
setDefaultDates();
renderDeploymentInfo();
