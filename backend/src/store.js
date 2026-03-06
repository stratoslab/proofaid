import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const defaultState = {
  programs: [],
  beneficiaries: [],
  vouchers: [],
  transactions: [],
  offlineTransactions: []
};

export function hashIdentity({ name, birthdate, region }) {
  return crypto
    .createHash("sha256")
    .update(`${name.trim().toLowerCase()}|${birthdate}|${region.trim().toLowerCase()}`)
    .digest("hex");
}

export class DataStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = this.#load();
  }

  #load() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(defaultState, null, 2));
        return structuredClone(defaultState);
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      return { ...structuredClone(defaultState), ...parsed };
    } catch {
      return structuredClone(defaultState);
    }
  }

  #save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  createProgram(input) {
    const id = `program_${crypto.randomUUID()}`;
    const program = {
      id,
      name: input.name,
      description: input.description,
      budget: input.budget,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };
    this.state.programs.push(program);
    this.#save();
    return program;
  }

  listPrograms() {
    return this.state.programs;
  }

  getProgramById(id) {
    return this.state.programs.find((item) => item.id === id);
  }

  registerBeneficiary(input) {
    const id = `beneficiary_${crypto.randomUUID()}`;
    const beneficiary = {
      id,
      identityHash: input.identityHash,
      programId: input.programId,
      createdAt: new Date().toISOString(),
      status: "ACTIVE"
    };
    this.state.beneficiaries.push(beneficiary);
    this.#save();
    return beneficiary;
  }

  listBeneficiaries(programId) {
    return this.state.beneficiaries.filter((item) => !programId || item.programId === programId);
  }

  issueVoucher(input) {
    const id = `voucher_${crypto.randomUUID()}`;
    const voucher = {
      id,
      programId: input.programId,
      beneficiaryId: input.beneficiaryId,
      value: input.value,
      aidType: input.aidType,
      expiryDays: input.expiryDays,
      status: "ISSUED",
      issuedAt: new Date().toISOString(),
      redeemedAt: null,
      expiresAt: new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000).toISOString()
    };
    this.state.vouchers.push(voucher);
    this.#save();
    return voucher;
  }

  listVouchers(programId) {
    return this.state.vouchers.filter((item) => !programId || item.programId === programId);
  }

  getVoucherById(id) {
    return this.state.vouchers.find((item) => item.id === id);
  }

  redeemVoucher(voucherId) {
    const voucher = this.getVoucherById(voucherId);
    if (!voucher) return null;
    if (voucher.status !== "ISSUED") return voucher;

    const now = new Date();
    if (new Date(voucher.expiresAt) < now) {
      voucher.status = "EXPIRED";
      this.#save();
      return voucher;
    }

    voucher.status = "REDEEMED";
    voucher.redeemedAt = now.toISOString();
    this.#save();
    return voucher;
  }

  recordTransaction(tx) {
    this.state.transactions.push(tx);
    this.#save();
    return tx;
  }

  listTransactions() {
    return this.state.transactions;
  }

  queueOfflineTransaction(tx) {
    this.state.offlineTransactions.push(tx);
    this.#save();
    return tx;
  }

  consumeOfflineTransactions() {
    const queued = [...this.state.offlineTransactions];
    this.state.offlineTransactions = [];
    this.#save();
    return queued;
  }

  getMetrics() {
    const totalPrograms = this.state.programs.length;
    const totalBeneficiaries = this.state.beneficiaries.length;
    const totalVouchers = this.state.vouchers.length;
    const redeemedVoucherItems = this.state.vouchers.filter((item) => item.status === "REDEEMED");
    const redeemedVouchers = redeemedVoucherItems.length;
    const redemptionRate = totalVouchers === 0 ? 0 : Number(((redeemedVouchers / totalVouchers) * 100).toFixed(2));
    const totalBudget = this.state.programs.reduce((sum, item) => sum + item.budget, 0);
    const utilizedBudget = redeemedVoucherItems.reduce((sum, item) => sum + item.value, 0);

    return {
      totalPrograms,
      totalBeneficiaries,
      totalVouchers,
      redeemedVouchers,
      redemptionRate,
      totalBudget,
      utilizedBudget,
      budgetUtilizationRate: totalBudget === 0 ? 0 : Number(((utilizedBudget / totalBudget) * 100).toFixed(2)),
      queuedOfflineTransactions: this.state.offlineTransactions.length
    };
  }
}
