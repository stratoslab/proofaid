Below is a **full Product Requirements Document (PRD) + Engineering Spec** designed so an AI coding agent (like Claude Code) or a dev team can **build the ProofAid MVP**.
It includes: product goals, system architecture, data models, APIs, smart contracts, and build steps.

---

# ProofAid — Product Requirements & Engineering Specification

Version: 1.0
Date: March 2026
Product: ProofAid
Platform: **Celo (EVM compatible)**

---

# 1. Product Overview

ProofAid is an **open-source platform for transparent humanitarian aid distribution**.

It allows NGOs to:

* register beneficiaries
* issue digital aid vouchers
* record aid deliveries
* create tamper-proof audit trails
* provide transparency dashboards for donors

The system must function in **low-resource environments**, including areas with intermittent internet connectivity.

---

# 2. Target Users

## NGOs

Organizations distributing aid.

Needs:

* distribute aid efficiently
* track delivery
* prevent fraud

## Field Workers

Staff delivering aid in communities.

Needs:

* simple mobile interface
* offline functionality

## Donors

Funding organizations.

Needs:

* transparency
* impact reporting

## Beneficiaries

Recipients of aid.

Needs:

* simple identity method
* no smartphone required

---

# 3. Product Goals

Primary goals:

1. Transparent aid distribution
2. Fraud reduction
3. Offline-first operation
4. Open-source infrastructure
5. Donor transparency dashboards

Secondary goals:

1. Interoperability between NGOs
2. Low-cost blockchain infrastructure
3. Expandable identity layer

---

# 4. MVP Scope

The MVP must support:

1. Aid program creation
2. Beneficiary registration
3. Voucher issuance
4. Voucher redemption
5. Distribution logging
6. Transparency dashboard
7. Blockchain verification

---

# 5. System Architecture

```text
Frontend Dashboard
        │
Mobile Distribution App
        │
Backend API Layer
        │
Smart Contracts (Celo)
        │
Blockchain Ledger
```

---

# 6. Technology Stack

### Blockchain

Celo (EVM compatible)

### Smart Contracts

Solidity

### Backend

Node.js
Express

### Database

PostgreSQL

### Storage

IPFS

### Mobile App

React Native

### Dashboard

Next.js

### Wallet Integration

Celo Wallet / MetaMask

---

# 7. Core Modules

## 7.1 Aid Program Management

Allows NGOs to create aid programs.

Example:

School Nutrition Program
Location: Vietnam
Budget: $50,000

### Data model

Program

```
id
name
description
budget
startDate
endDate
status
createdAt
```

---

## 7.2 Beneficiary Registry

Stores beneficiary identity hashes.

Sensitive data remains off-chain.

### Data model

Beneficiary

```
id
identityHash
programId
createdAt
status
```

Identity hash created from:

```
name
birthdate
region
```

Hashed with SHA256.

---

## 7.3 Voucher System

Aid is distributed through vouchers.

Example voucher:

```
nutrition support
value: 5 meals
expiry: 30 days
```

### Data model

Voucher

```
id
programId
beneficiaryId
status
issuedAt
redeemedAt
```

Voucher states:

```
ISSUED
REDEEMED
EXPIRED
CANCELLED
```

---

# 8. Blockchain Smart Contracts

All aid distribution events must be recorded on-chain.

Contracts are deployed on **Celo**.

---

## 8.1 AidProgram.sol

Manages aid programs.

Functions:

```
createProgram()
depositFunds()
allocateVoucher()
closeProgram()
```

Example structure:

```
struct Program {
    uint256 id;
    string name;
    uint256 budget;
    uint256 createdAt;
}
```

---

## 8.2 BeneficiaryRegistry.sol

Stores beneficiary hashes.

```
registerBeneficiary(bytes32 identityHash)
```

Structure:

```
struct Beneficiary {
    bytes32 identityHash;
    uint256 createdAt;
}
```

---

## 8.3 AidVoucher.sol

Voucher issuance and redemption.

Functions:

```
issueVoucher()
redeemVoucher()
expireVoucher()
```

Structure:

```
struct Voucher {
    uint256 id;
    uint256 programId;
    bytes32 beneficiaryHash;
    bool redeemed;
}
```

---

# 9. Distribution Workflow

Step 1

NGO creates program

Step 2

Field worker registers beneficiary

Step 3

Voucher issued

Step 4

Aid delivered

Step 5

Voucher redeemed

Step 6

Redemption recorded on blockchain

---

# 10. Offline Mode

Mobile app must support offline usage.

When offline:

* transactions stored locally
* queued until connection returns

Queue format:

```
offlineTransactions[]
```

Sync process:

```
detect connection
submit queued transactions
confirm on-chain
```

---

# 11. API Specification

## POST /program

Create aid program

Request:

```
name
description
budget
```

Response:

```
programId
```

---

## POST /beneficiary

Register beneficiary

Request:

```
identityHash
programId
```

Response:

```
beneficiaryId
```

---

## POST /voucher

Issue voucher

Request:

```
programId
beneficiaryId
```

Response:

```
voucherId
```

---

## POST /redeem

Redeem voucher

Request:

```
voucherId
```

Response:

```
status
```

---

# 12. Transparency Dashboard

Donor dashboard must display:

* total aid distributed
* number of beneficiaries
* voucher redemption rate
* program budget utilization

Dashboard pages:

```
Programs
Beneficiaries
Transactions
Impact metrics
```

---

# 13. Security Requirements

### Identity protection

No personal data stored on-chain.

Only hashes stored.

---

### Fraud prevention

Voucher tied to beneficiary hash.

Single-use vouchers.

---

### Smart contract safety

Contracts must undergo security audit before production deployment.

---

# 14. Deployment

## Environment

Testnet: Celo Alfajores

Production: Celo Mainnet

---

## Infrastructure

```
Smart contracts → Celo
Backend → AWS / Cloudflare
Database → PostgreSQL
Storage → IPFS
```

---

# 15. GitHub Repository Structure

```
proofaid
│
├ smart-contracts
│
├ mobile-app
│
├ backend
│
├ dashboard
│
└ docs
```

---

# 16. MVP Milestones

Month 1

Smart contracts deployed
API built

Month 2

Mobile distribution app

Month 3

Transparency dashboard

Month 4

Pilot deployment

---

# 17. Pilot Deployment

Location:

Vietnam

Use case:

school nutrition programs

Target:

```
1000 beneficiaries
```

---

# 18. Metrics

Key success metrics:

```
voucher redemption rate
distribution verification speed
fraud reduction
```

---

# 19. Open Source License

License:

Apache 2.0

Goal:

Digital Public Good infrastructure.

---

# 20. Future Features

Future modules:

* biometric identity
* stablecoin payments
* DAO governance
* oracle verification

---

# 21. Definition of Done (MVP)

The MVP is complete when:

1. NGO can create aid program
2. Beneficiaries registered
3. Vouchers issued
4. Vouchers redeemed
5. Distribution recorded on Celo
6. Dashboard displays transactions

---

# 22. Example End-to-End Flow

1 NGO creates program
2 Field worker registers beneficiary
3 Voucher issued
4 Aid delivered
5 Voucher redeemed
6 Smart contract logs event
7 Donor dashboard updates

---

# 23. Summary

ProofAid provides:

* transparent aid distribution
* blockchain audit trail
* open-source infrastructure
* scalable humanitarian technology

Built on **Celo**, optimized for **mobile-first financial inclusion environments**.


