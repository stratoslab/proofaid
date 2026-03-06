Below is a **spec-driven architecture document** you can use for:

* UNICEF application supporting material
* GitHub README
* internal engineering plan
* architecture diagram reference

It is written as a **real engineering spec**, not a pitch deck.

---

# ProofAid — System Architecture Specification

Version: 1.0
Date: March 2026
Status: Draft

Platform: **Celo (Ethereum-compatible mobile-first blockchain)**

---

# 1. Overview

ProofAid is an **open-source blockchain infrastructure for transparent humanitarian aid distribution**.

The system enables NGOs and development organizations to:

* issue digital aid vouchers
* register beneficiaries
* record aid delivery events
* provide transparent reporting to donors
* operate in low-resource environments

The system is designed for:

* **offline-first environments**
* **low-cost transactions**
* **mobile field deployments**
* **transparent auditing**

ProofAid is deployed on **Celo**, an Ethereum-compatible blockchain optimized for mobile-first financial inclusion and low-cost transactions.

---

# 2. Design Goals

## Primary Goals

1. Transparent aid distribution tracking
2. Open infrastructure for humanitarian organizations
3. Low-cost transaction model
4. Offline-capable distribution workflows
5. Verifiable donor reporting

## Secondary Goals

1. Beneficiary identity portability
2. Reusable digital public goods infrastructure
3. Cross-NGO interoperability
4. Smart-contract based voucher management

---

# 3. System Architecture

ProofAid is composed of five primary layers:

```
Aid Funding Layer
↓
Voucher Issuance Layer
↓
Beneficiary Identity Layer
↓
Distribution Recording Layer
↓
Transparency Dashboard Layer
```

---

# 4. Core System Components

## 4.1 Aid Funding Layer

Funding sources include:

* UNICEF
* NGOs
* philanthropic donors
* development organizations

Funds are deposited into:

**Aid Program Smart Contracts**

These contracts manage:

* funding pools
* program budgets
* voucher allocation

Example contract:

```
AidProgram.sol
```

Key functions:

```
createProgram()
depositFunds()
allocateVouchers()
releaseFunds()
```

---

## 4.2 Voucher Issuance Layer

Aid is distributed via **digital vouchers**.

Each voucher represents:

* a specific aid benefit
* allocated to a beneficiary
* redeemable once

Example:

```
Voucher Type: Nutrition Support
Value: 5 meal credits
Expiry: 30 days
```

Voucher data stored on-chain:

```
voucherID
programID
beneficiaryID
status
timestamp
```

Voucher states:

```
Issued
Redeemed
Expired
Cancelled
```

Smart contract:

```
AidVoucher.sol
```

---

## 4.3 Beneficiary Identity Layer

ProofAid supports **offline-capable identity issuance**.

Beneficiaries can be identified using:

* QR code card
* SMS identity
* NFC card (optional)

Each identity maps to a **decentralized identifier (DID)**.

Example identity record:

```
beneficiaryID
hash(identityData)
createdAt
status
```

Sensitive data remains **off-chain**.

Only identity hashes are stored on-chain.

---

# 5. Distribution Workflow

Field staff distribute aid using a **mobile application**.

Example flow:

```
1 Register beneficiary
2 Issue voucher
3 Deliver aid
4 Record redemption
5 Sync transaction on-chain
```

Detailed flow:

```
NGO Worker scans QR code
↓
Voucher retrieved
↓
Aid delivered
↓
Mobile app records redemption
↓
Transaction broadcast to Celo
↓
Smart contract updates voucher state
```

---

# 6. Offline Operation

ProofAid must function in **low-connectivity environments**.

Offline mode supports:

* identity scanning
* voucher validation
* distribution recording

Transactions are stored locally until connectivity returns.

Sync process:

```
Offline device queue
↓
Network reconnect
↓
Batch transaction submission
↓
On-chain confirmation
```

---

# 7. Blockchain Layer

ProofAid is deployed on **Celo**.

Reasons:

* mobile-first blockchain design
* low transaction fees
* stablecoin ecosystem
* EVM compatibility

Network options:

```
Celo Mainnet
Celo Alfajores Testnet
```

Transactions include:

```
voucher issuance
voucher redemption
aid program creation
fund allocation
```

---

# 8. Smart Contract Architecture

Core contracts:

```
AidProgram.sol
AidVoucher.sol
BeneficiaryRegistry.sol
DistributionEvent.sol
```

Relationships:

```
AidProgram
  └─ manages vouchers

BeneficiaryRegistry
  └─ stores beneficiary hashes

AidVoucher
  └─ references beneficiary + program

DistributionEvent
  └─ records redemption
```

---

# 9. Data Storage

## On-chain data

Stored on Celo:

* voucher issuance
* voucher redemption
* aid program creation
* distribution events

## Off-chain data

Stored in distributed storage:

* beneficiary metadata
* distribution reports
* NGO documents

Recommended storage:

```
IPFS
Arweave (optional)
```

---

# 10. Transparency Dashboard

The dashboard provides real-time insights for:

* donors
* NGOs
* auditors

Key metrics:

```
Total aid distributed
Active beneficiaries
Voucher redemption rate
Program budget utilization
```

Dashboard components:

```
Program overview
Distribution maps
Transaction history
Impact metrics
```

---

# 11. Security Model

Security considerations:

### Identity protection

Sensitive data remains off-chain.

Only hashed identifiers are stored.

---

### Voucher fraud prevention

Each voucher is:

* single-use
* bound to beneficiaryID
* timestamped

---

### Smart contract audits

Before production deployment:

```
security audit required
```

---

# 12. Scalability

Expected system load:

```
10k–100k beneficiaries per program
```

Celo supports:

* low-cost transactions
* scalable smart contract deployments

Future scaling options:

```
L2 integrations
off-chain batching
rollup submission
```

---

# 13. Open Source Strategy

ProofAid will be released under:

```
Apache 2.0 license
```

Repository structure:

```
proofaid/
 ├ smart-contracts/
 ├ mobile-app/
 ├ backend/
 ├ dashboard/
 └ docs/
```

Goal:

ProofAid becomes **digital public goods infrastructure** reusable by NGOs globally.

---

# 14. Deployment Plan

## Phase 1 — MVP

Components:

* beneficiary registry
* voucher contracts
* mobile distribution app
* basic dashboard

---

## Phase 2 — Pilot

Pilot location:

```
Vietnam
```

Pilot use case:

```
child nutrition distribution
school meal support
```

---

## Phase 3 — Expansion

Future programs:

```
vaccine distribution
education stipends
nutrition programs
```

---

# 15. Future Extensions

Possible modules:

### Impact tracking

record outcome metrics

### Stablecoin payments

direct aid transfers

### DAO governance

community oversight

### Oracle integrations

external verification

---

# 16. Example Transaction

Aid distribution event:

```
ProgramID: 0xA12
VoucherID: 0xV34
BeneficiaryID: hash(12345)
Timestamp: 2026-03-10
Status: redeemed
```

Transaction recorded on Celo.

---

# 17. Summary

ProofAid provides an **open, transparent infrastructure for humanitarian aid distribution**.

Key features:

* blockchain transparency
* offline-capable distribution
* low-cost transactions
* reusable open-source architecture

By deploying on **Celo**, ProofAid enables NGOs and development organizations to improve transparency and accountability in programs supporting children and vulnerable communities.

---

