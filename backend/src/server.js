import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { CeloLedgerAdapter } from "./blockchain.js";
import { DataStore, hashIdentity } from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
const dataPath = process.env.DATA_FILE || path.join(__dirname, "..", "data", "db.json");

const store = new DataStore(dataPath);
const ledger = new CeloLedgerAdapter();

app.use(cors());
app.use(express.json());
const dashboardRoot = path.join(__dirname, "..", "..", "dashboard");
const dashboardDist = path.join(dashboardRoot, "dist");
app.use("/", express.static(fs.existsSync(dashboardDist) ? dashboardDist : dashboardRoot));

const createProgramSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  budget: z.number().positive(),
  startDate: z.string().optional().default(new Date().toISOString()),
  endDate: z.string().optional().default(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
});

const registerBeneficiarySchema = z.object({
  programId: z.string(),
  name: z.string().min(1),
  birthdate: z.string().min(1),
  region: z.string().min(1)
});

const issueVoucherSchema = z.object({
  programId: z.string(),
  beneficiaryId: z.string(),
  aidType: z.string().min(2).default("nutrition"),
  value: z.number().int().positive().default(1),
  expiryDays: z.number().int().positive().max(365).default(30)
});

const redeemVoucherSchema = z.object({
  voucherId: z.string()
});

const queueSchema = z.object({
  transactions: z.array(z.object({
    action: z.enum(["REDEEM"]),
    payload: z.object({ voucherId: z.string() })
  }))
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "proofaid-backend", timestamp: new Date().toISOString() });
});

app.post("/program", (req, res) => {
  const parsed = createProgramSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const program = store.createProgram(parsed.data);
  const chainTx = ledger.recordEvent("ProgramCreated", { programId: program.id, budget: program.budget });
  store.recordTransaction(chainTx);

  res.status(201).json({ programId: program.id, program, chainTx });
});

app.get("/program", (_req, res) => {
  res.json({ programs: store.listPrograms() });
});

app.post("/beneficiary", (req, res) => {
  const parsed = registerBeneficiarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const program = store.getProgramById(parsed.data.programId);
  if (!program) return res.status(404).json({ error: "Program not found" });

  const identityHash = hashIdentity(parsed.data);
  const beneficiary = store.registerBeneficiary({
    identityHash,
    programId: parsed.data.programId
  });

  const chainTx = ledger.recordEvent("BeneficiaryRegistered", {
    beneficiaryId: beneficiary.id,
    identityHash,
    programId: beneficiary.programId
  });
  store.recordTransaction(chainTx);

  res.status(201).json({ beneficiaryId: beneficiary.id, beneficiary, chainTx });
});

app.get("/beneficiary", (req, res) => {
  res.json({ beneficiaries: store.listBeneficiaries(req.query.programId) });
});

app.post("/voucher", (req, res) => {
  const parsed = issueVoucherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const program = store.getProgramById(parsed.data.programId);
  if (!program) return res.status(404).json({ error: "Program not found" });

  const beneficiary = store.listBeneficiaries().find((item) => item.id === parsed.data.beneficiaryId);
  if (!beneficiary) return res.status(404).json({ error: "Beneficiary not found" });

  const voucher = store.issueVoucher(parsed.data);
  const chainTx = ledger.recordEvent("VoucherIssued", {
    voucherId: voucher.id,
    programId: voucher.programId,
    beneficiaryId: voucher.beneficiaryId,
    value: voucher.value
  });
  store.recordTransaction(chainTx);

  res.status(201).json({ voucherId: voucher.id, voucher, chainTx });
});

app.get("/voucher", (req, res) => {
  res.json({ vouchers: store.listVouchers(req.query.programId) });
});

app.post("/redeem", (req, res) => {
  const parsed = redeemVoucherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const voucher = store.redeemVoucher(parsed.data.voucherId);
  if (!voucher) return res.status(404).json({ error: "Voucher not found" });
  if (voucher.status !== "REDEEMED") return res.status(409).json({ error: `Voucher is ${voucher.status}` });

  const chainTx = ledger.recordEvent("VoucherRedeemed", { voucherId: voucher.id, redeemedAt: voucher.redeemedAt });
  store.recordTransaction(chainTx);

  res.json({ status: voucher.status, voucher, chainTx });
});

app.post("/offline/queue", (req, res) => {
  const parsed = queueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const accepted = parsed.data.transactions.map((tx) => store.queueOfflineTransaction({
    id: `offline_${crypto.randomUUID()}`,
    ...tx,
    queuedAt: new Date().toISOString()
  }));

  res.status(202).json({ accepted: accepted.length, queued: store.getMetrics().queuedOfflineTransactions });
});

app.post("/offline/sync", (_req, res) => {
  const queued = store.consumeOfflineTransactions();
  const results = [];

  for (const tx of queued) {
    if (tx.action === "REDEEM") {
      const voucher = store.redeemVoucher(tx.payload.voucherId);
      if (!voucher || voucher.status !== "REDEEMED") continue;

      const chainTx = ledger.recordEvent("VoucherRedeemed", {
        voucherId: voucher.id,
        redeemedAt: voucher.redeemedAt,
        source: "OFFLINE_SYNC"
      });
      store.recordTransaction(chainTx);
      results.push({ voucherId: voucher.id, txHash: chainTx.txHash, status: "CONFIRMED" });
    }
  }

  res.json({ synced: results.length, results });
});

app.get("/dashboard/metrics", (_req, res) => {
  res.json(store.getMetrics());
});

app.get("/transactions", (_req, res) => {
  res.json({ transactions: store.listTransactions().slice(-200).reverse() });
});

app.listen(port, () => {
  console.log(`ProofAid backend listening on http://localhost:${port}`);
});
