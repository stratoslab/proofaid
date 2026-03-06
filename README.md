# ProofAid MVP

ProofAid is an open-source MVP for transparent humanitarian aid distribution on Celo-compatible infrastructure.

## What is implemented

- `backend/`: Node.js API for programs, beneficiaries, vouchers, redemption, offline queue sync, and donor metrics.
- `dashboard/`: wallet-enabled web frontend for Celo network switch + on-chain contract actions.
- `smart-contracts/`: Solidity contracts plus Hardhat compile/deploy/export scripts.
- `mobile-app/`: offline queue module reusable in a React Native app.

## Backend quickstart

```bash
cd backend
npm install
npm start
```

Open `http://localhost:4000`.

## Smart contract quickstart

```bash
cd smart-contracts
npm install
cp .env.example .env
# set CELO_PRIVATE_KEY and RPC values in .env
npm run compile
npm run deploy:alfajores
npm run export:frontend
```

Deployment writes:

- `smart-contracts/deployments/<network>.json`
- `dashboard/contracts/deployments.json` (addresses)
- `dashboard/contracts/abis.json` (ABIs)

## Frontend wallet demo

The dashboard supports:

- wallet connect (MetaMask/Celo-compatible)
- network switching: Alfajores, Celo Mainnet, custom devnet
- create program on-chain (`AidProgram`)
- register beneficiary hash (`BeneficiaryRegistry`)
- issue/redeem vouchers (`AidVoucher`)

If no deployment exists for the connected chain, dashboard shows a missing deployment message.

## Core backend API

- `POST /program`
- `POST /beneficiary`
- `POST /voucher`
- `POST /redeem`
- `POST /offline/queue`
- `POST /offline/sync`
- `GET /dashboard/metrics`
- `GET /transactions`

See `docs/api.md` for payload examples.

---

## Demo vs Deployment

**Demo = believable prototype**  
**Deployment = operational system**

### Demo scope (current MVP)

The demo shows one complete flow:

1. NGO admin creates an aid program
2. Field worker registers a beneficiary
3. System issues a voucher
4. Field worker redeems the voucher when aid is delivered
5. Transaction is recorded on Celo
6. Donor dashboard updates

**Three views:**

- **Admin dashboard** - Create program, view budget, issue vouchers, see redemption stats
- **Field worker app** - Search/select beneficiary, scan QR or enter code, redeem voucher
- **Donor dashboard** - Total beneficiaries, vouchers issued/redeemed, recent on-chain transactions

**Demo features:**

- Program creation (name, location, aid type, budget, dates)
- Beneficiary registration (name/ID, region, unique ID, QR code)
- Voucher issuance (assign to beneficiary, show status)
- Voucher redemption (scan QR or type code, mark redeemed, write to testnet)
- Dashboard (live counts, transaction list, program overview)

**Acceptable shortcuts:**

- Celo Alfajores testnet
- Mock beneficiaries
- Manual sync instead of full offline engine
- Single voucher type
- Simple admin-controlled wallet
- Mock maps and partner names

### Real deployment requirements

**Core capabilities needed:**

**A. Program management**
- Multiple aid programs
- Budget tracking by program
- Multiple aid types
- Role-based access

**B. Beneficiary management**
- Safe registration
- Duplicate prevention
- Off-chain PII storage
- Updates and deactivation

**C. Voucher lifecycle**
- Issue, redeem, expire, revoke
- Prevent double redemption

**D. Field operations**
- Offline mode
- Local transaction queue
- Auto-sync when connected
- Clear sync status

**E. Auditability**
- Link redemptions to: program, beneficiary, field worker, timestamp, location
- Immutable on-chain records
- Exportable reports

**F. Reporting**
- Dashboard by program
- Aggregated metrics
- CSV/PDF exports
- Public and private views

**G. Security**
- Role permissions
- Secure login
- Device/session management
- Encrypted local storage
- Smart contract safeguards

### User flows

**Admin:**
1. Login → 2. Create program → 3. Add field workers → 4. Register beneficiaries → 5. Issue vouchers → 6. Monitor redemption

**Field worker:**
1. Login on mobile → 2. Select program → 3. Find/register beneficiary → 4. Scan QR → 5. Deliver aid → 6. Tap redeem → 7. See confirmation (or "queued for sync" if offline)

**Donor:**
1. Open dashboard → 2. View allocated/redeemed totals → 3. View beneficiary counts → 4. View verified transactions → 5. Export report

### Smart contracts

**Demo contracts:**
- Program registry (create program)
- Beneficiary registry (register beneficiary hash)
- Voucher contract (issue, redeem, prevent double redemption)
- Event logging (emit events for dashboard)

**Deployment additions:**
- Role controls
- Expiration and revocation
- Pausing and upgrade strategy
- Audit-ready event design

### Database design

**Required tables:**
- users, organizations, programs
- beneficiaries, vouchers, redemptions
- sync jobs, audit logs

**Critical rule:** PII stays in database, not on-chain. On-chain only stores hashes/IDs/statuses.
