# ProofAid Deployed Contract Addresses

## Celo Sepolia

- Network key: `celoSepolia`
- Chain ID: `11142220`
- RPC: `https://forno.celo-sepolia.celo-testnet.org`
- Deployed at (UTC): `2026-03-06T16:53:14.319Z`
- Deployer: `0x42024e6A3F44573CaAf4BEbd278f5C566Dbf407B`
- Voucher type: `AidVoucher` is now ERC-1155 (non-transferable, redeem burns token)

### Contracts

- `AidProgram`: `0x79A8F888607A5aeb77B7DC80a78E2202274AcAce`
- `BeneficiaryRegistry`: `0xF248728fD82E441b298c15C114C86d7ab458c35f`
- `AidVoucher` (ERC-1155): `0x52b08173aA985C2d46C4162b443656Fb7D8a8dB0`
- `DistributionEvent`: `0x8a41D038F929B25595e6B3Bc9ABf83E3CA682bD6`

## Frontend connection sources

- `dashboard/contracts/deployments.json` (network -> address mapping)
- `dashboard/contracts/abis.json` (contract ABIs)
- `dashboard/public/contracts/deployments.json` (network -> address mapping)
- `dashboard/public/contracts/abis.json` (contract ABIs)

Dashboard network selection should be set to **Celo Sepolia (11142220)**.
