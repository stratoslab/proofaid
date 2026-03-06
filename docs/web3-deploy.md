# Web3 Deploy and Frontend Wiring

## 1. Configure deployer

Create `smart-contracts/.env` from `.env.example` and set:

- `CELO_PRIVATE_KEY`
- `CELO_ALFAJORES_RPC_URL`
- `CELO_MAINNET_RPC_URL`
- optional `CELO_DEVNET_RPC_URL` and `CELO_DEVNET_CHAIN_ID`

## 2. Compile and deploy

```bash
cd smart-contracts
npm install
npm run compile
npm run deploy:alfajores
```

Optional:

```bash
npm run deploy:mainnet
```

## 3. Export ABI for dashboard

```bash
npm run export:frontend
```

This updates `dashboard/contracts/abis.json`.

## 4. Dashboard usage

1. Run backend: `cd backend && npm install && npm start`
2. Open `http://localhost:4000`
3. Connect wallet
4. Switch network (Alfajores/Mainnet/devnet)
5. Use the on-chain forms to submit transactions

## 5. Devnet support

In dashboard:

- select `Custom Devnet`
- enter devnet name + RPC URL + chain ID
- click `Save Devnet`
- click `Switch Network`

Devnet config is saved in browser localStorage (`proofaid_devnet`).
