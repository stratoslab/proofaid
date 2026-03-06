const fs = require("node:fs");
const path = require("node:path");

const CONTRACTS = ["AidProgram", "BeneficiaryRegistry", "AidVoucher", "DistributionEvent"];

function readAbi(contractName) {
  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact missing for ${contractName}. Run npm run compile first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return artifact.abi;
}

function main() {
  const output = {
    generatedAt: new Date().toISOString(),
    contracts: {}
  };

  for (const name of CONTRACTS) {
    output.contracts[name] = { abi: readAbi(name) };
  }

  const outPath = path.resolve(__dirname, "..", "..", "dashboard", "contracts", "abis.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${outPath}`);
}

main();
