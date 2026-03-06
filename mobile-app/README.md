# ProofAid Mobile App (MVP Stub)

This folder contains the offline queue logic used by field workers in low-connectivity regions.

## MVP behavior

- Queue voucher redemptions locally with `addOfflineRedemption(voucherId)`.
- Upload queued actions with `syncQueue()` when network returns.
- Backend finalizes on-chain event simulation and marks vouchers redeemed.

This file is framework-agnostic and can be imported into a React Native app.
