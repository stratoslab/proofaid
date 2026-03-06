# ProofAid MVP

ProofAid is an open-source MVP for transparent humanitarian aid distribution on Celo-compatible infrastructure.

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
