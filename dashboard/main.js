const api = {
  metrics: "/dashboard/metrics",
  tx: "/transactions",
  program: "/program"
};

const metricsNode = document.getElementById("metrics");
const txNode = document.getElementById("transactions");
const form = document.getElementById("programForm");

function metricCard(label, value) {
  return `<article class="card"><h3>${label}</h3><p>${value}</p></article>`;
}

async function loadMetrics() {
  const res = await fetch(api.metrics);
  const data = await res.json();

  metricsNode.innerHTML = [
    metricCard("Programs", data.totalPrograms),
    metricCard("Beneficiaries", data.totalBeneficiaries),
    metricCard("Vouchers", data.totalVouchers),
    metricCard("Redeemed", data.redeemedVouchers),
    metricCard("Redemption %", `${data.redemptionRate}%`),
    metricCard("Offline Queue", data.queuedOfflineTransactions)
  ].join("");
}

async function loadTransactions() {
  const res = await fetch(api.tx);
  const data = await res.json();
  txNode.innerHTML = data.transactions
    .slice(0, 10)
    .map((item) => `<li><strong>${item.eventName}</strong><br /><code>${item.txHash.slice(0, 16)}...</code></li>`)
    .join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name")),
    description: String(formData.get("description")),
    budget: Number(formData.get("budget"))
  };

  const res = await fetch(api.program, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Unable to create program. Check API logs.");
    return;
  }

  form.reset();
  await Promise.all([loadMetrics(), loadTransactions()]);
});

await Promise.all([loadMetrics(), loadTransactions()]);
setInterval(() => {
  loadMetrics();
  loadTransactions();
}, 10000);
