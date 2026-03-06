const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

function must(value, msg) {
  if (!value) throw new Error(msg);
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getAbi(contractName) {
  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${contractName}.sol`,
    `${contractName}.json`
  );
  return readJson(artifactPath).abi;
}

function parseEvent(receipt, iface, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === eventName) return parsed;
    } catch {
      // ignore non-matching logs
    }
  }
  return null;
}

async function sendAndWait(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return { tx, receipt, label };
}

async function main() {
  const deploymentsPath = path.resolve(__dirname, "..", "deployments", "celoSepolia.json");
  const deployment = readJson(deploymentsPath);

  const rpcUrl = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const privateKey = must(process.env.CELO_PRIVATE_KEY, "CELO_PRIVATE_KEY missing in smart-contracts/.env");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const aidProgramAbi = getAbi("AidProgram");
  const beneficiaryAbi = getAbi("BeneficiaryRegistry");
  const aidVoucherAbi = getAbi("AidVoucher");
  const distributionAbi = getAbi("DistributionEvent");

  const aidProgram = new ethers.Contract(deployment.contracts.AidProgram, aidProgramAbi, wallet);
  const beneficiaryRegistry = new ethers.Contract(deployment.contracts.BeneficiaryRegistry, beneficiaryAbi, wallet);
  const aidVoucher = new ethers.Contract(deployment.contracts.AidVoucher, aidVoucherAbi, wallet);
  const distribution = new ethers.Contract(deployment.contracts.DistributionEvent, distributionAbi, wallet);

  const salt = crypto.randomBytes(6).toString("hex");
  const identitySeed = `proofaid-e2e|${salt}|2020-01-01|region-a`;
  const identityHash = ethers.sha256(ethers.toUtf8Bytes(identitySeed));

  const start = BigInt(Math.floor(Date.now() / 1000));
  const end = start + 30n * 24n * 60n * 60n;

  const run = {
    network: deployment.network,
    chainId: deployment.chainId,
    wallet: wallet.address,
    identityHash,
    txs: {}
  };

  const create = await sendAndWait(
    "createProgram",
    aidProgram.createProgram(`E2E Program ${salt}`, "Sepolia end-to-end verification", 1000n, start, end)
  );
  run.txs.createProgram = create.tx.hash;

  const createEvent = parseEvent(create.receipt, aidProgram.interface, "ProgramCreated");
  let programId;
  if (createEvent) {
    programId = createEvent.args.programId;
  } else {
    const nextId = await aidProgram.nextProgramId();
    programId = nextId - 1n;
  }

  const reg = await sendAndWait(
    "registerBeneficiary",
    beneficiaryRegistry.registerBeneficiary(identityHash, programId)
  );
  run.txs.registerBeneficiary = reg.tx.hash;

  const issue = await sendAndWait(
    "issueVoucherTo",
    aidVoucher.issueVoucherTo(wallet.address, programId, identityHash, 30n)
  );
  run.txs.issueVoucher = issue.tx.hash;

  const issuedEvent = parseEvent(issue.receipt, aidVoucher.interface, "VoucherIssued");
  const voucherId = issuedEvent ? issuedEvent.args.voucherId : (await aidVoucher.nextVoucherId()) - 1n;

  const balanceBefore = await aidVoucher.balanceOf(wallet.address, voucherId);

  const redeem = await sendAndWait("redeemVoucher", aidVoucher.redeemVoucher(voucherId));
  run.txs.redeemVoucher = redeem.tx.hash;

  const balanceAfter = await aidVoucher.balanceOf(wallet.address, voucherId);
  const voucherState = await aidVoucher.vouchers(voucherId);

  const dist = await sendAndWait(
    "recordDistribution",
    distribution.recordDistribution(programId, voucherId, identityHash, "redeemed")
  );
  run.txs.recordDistribution = dist.tx.hash;

  const distributionEvent = parseEvent(dist.receipt, distribution.interface, "DistributionRecorded");
  const distributionEventId = distributionEvent ? distributionEvent.args.eventId : null;

  run.results = {
    programId: programId.toString(),
    voucherId: voucherId.toString(),
    balanceBeforeRedeem: balanceBefore.toString(),
    balanceAfterRedeem: balanceAfter.toString(),
    voucherStatus: Number(voucherState.status),
    redeemedAt: voucherState.redeemedAt.toString(),
    distributionEventId: distributionEventId ? distributionEventId.toString() : null
  };

  const explorerBase = "https://sepolia.celoscan.io/tx/";
  run.explorer = Object.fromEntries(
    Object.entries(run.txs).map(([k, v]) => [k, `${explorerBase}${v}`])
  );

  console.log(JSON.stringify(run, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
