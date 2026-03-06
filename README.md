# ProofAid MVP

ProofAid is an open-source MVP for transparent humanitarian aid distribution on Celo-compatible infrastructure.

## How It Works

ProofAid enables transparent, blockchain-verified aid distribution:

1. **Program Setup** - Aid organizations create distribution programs with budget allocations
2. **Beneficiary Registration** - Recipients are registered and verified in the system
3. **Voucher Distribution** - Digital vouchers are issued to beneficiaries for specific aid types
4. **Redemption** - Beneficiaries redeem vouchers at authorized vendors/distribution points
5. **Offline Queue** - All actions queue locally when internet is unavailable
6. **Blockchain Sync** - Transactions sync to Celo blockchain when connectivity returns
7. **Donor Dashboard** - Real-time transparency dashboard shows fund flow and impact metrics

All transactions are recorded on-chain, providing immutable audit trails for donors and stakeholders.

## What is implemented

- `backend/`: working Node.js API for programs, beneficiaries, vouchers, redemption, offline queue sync, and donor metrics.
- `dashboard/`: lightweight transparency dashboard UI served by backend static hosting.
- `smart-contracts/contracts/`: Solidity contracts for aid programs, beneficiary registry, voucher lifecycle, and distribution events.
- `mobile-app/`: offline queue module that can be reused in React Native.
- `docs/`: architecture and API references.

## Quickstart

```bash
cd backend
npm install
npm start
```

Open `http://localhost:4000`.

## Core API

- `POST /program`
- `POST /beneficiary`
- `POST /voucher`
- `POST /redeem`
- `POST /offline/queue`
- `POST /offline/sync`
- `GET /dashboard/metrics`
- `GET /transactions`

See [docs/api.md](./docs/api.md) for request/response examples.

## Notes

- Backend currently simulates Celo transaction hashes via `CeloLedgerAdapter`.
- Data is persisted in `backend/data/db.json`.
- Contracts are ready to deploy in a Hardhat/Foundry setup as next step.
