// ==================================================================
//  DATE & TIME
// ==================================================================
function updateDateTime() {
  const el = document.getElementById("dateTime");
  if (el) el.textContent = new Date().toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ==================================================================
//  GLOBAL VARIABLES
// ==================================================================
const relayStates = { 1: false, 2: false, 3: false, 4: false };
const usageTimers = { 1: 0, 2: 0, 3: 0, 4: 0 };
const usageLimits = { 1: 12, 2: 12, 3: 12, 4: 12 };
const autoOffTimers = {};

// ==================================================================
//  RELAY CONTROL
// ==================================================================
for (let i = 1; i <= 4; i++) {
  const el = document.getElementById(`relay${i}`);
  if (el) el.addEventListener("change", (e) => toggleRelay(i, e.target.checked));
}

function toggleRelay(id, state) {
  relayStates[id] = state;
  const statusEl = document.getElementById(`s${id}`);
  if (statusEl) statusEl.textContent = state ? "ON" : "OFF";
  addNotification(`Load ${id} turned ${state ? "ON" : "OFF"}`);
}

// ==================================================================
//  AUTO-OFF TIMER
// ==================================================================
document.querySelectorAll(".preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById("customMin");
    if (input) input.value = btn.dataset.min;
  });
});

const applyTimerBtn = document.getElementById("applyTimer");
if (applyTimerBtn) {
  applyTimerBtn.addEventListener("click", () => {
    const load = document.getElementById("loadSelect").value;
    const mins = parseInt(document.getElementById("customMin").value, 10);
    if (!mins || mins <= 0) return alert("Enter valid minutes");

    if (autoOffTimers[load]) clearTimeout(autoOffTimers[load]);
    autoOffTimers[load] = setTimeout(() => {
      const chk = document.getElementById(`relay${load}`);
      if (chk) chk.checked = false;
      toggleRelay(load, false);
      addNotification(`Auto-OFF: Load ${load} OFF after ${mins} min`);
    }, mins * 60 * 1000);

    addNotification(`Timer set for Load ${load}: ${mins} min`);
  });
}

// ==================================================================
//  DAILY LIMIT LOGIC
// ==================================================================
const saveLimitsBtn = document.getElementById("saveLimits");
if (saveLimitsBtn) {
  saveLimitsBtn.addEventListener("click", () => {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`limit${i}`);
      if (!el) continue;
      const v = parseFloat(el.value);
      if (!isNaN(v) && v > 0) usageLimits[i] = v;
    }
    addNotification("Usage limits updated.");
  });
}

setInterval(() => {
  for (let i = 1; i <= 4; i++) {
    if (relayStates[i]) {
      usageTimers[i] += 2;
      const hoursUsed = usageTimers[i] / 3600;
      if (hoursUsed >= usageLimits[i]) {
        const chk = document.getElementById(`relay${i}`);
        if (chk) chk.checked = false;
        toggleRelay(i, false);
        addNotification(`Limit reached: Load ${i} OFF after ${usageLimits[i]} hrs`);
      }
    }
  }
}, 2000);

// ==================================================================
//  LIVE MONITORING (USING Wh)  --> UPDATED WITH REALISTIC RANGES
// ==================================================================
function updateLiveDemo() {
  let totalCurrent = 0,
    totalPower = 0;

  let v1, c1, v2, c2, v3, c3, v4, c4;
  if (relayStates[1]) {
    v1 = (12 + Math.random() * 0.3).toFixed(1);
    c1 = (0.12 + Math.random() * 0.02).toFixed(2);
  } else {
    v1 = "0.0";
    c1 = "0.00";
  }

  if (relayStates[2]) {
    v2 = (12 + Math.random() * 0.2).toFixed(1);
    c2 = (0.12 + Math.random() * 0.01).toFixed(2);
  } else {
    v2 = "0.0";
    c2 = "0.00";
  }

  if (relayStates[3]) {
    v3 = (12).toFixed(1);
    c3 = (0.12).toFixed(2);
  } else {
    v3 = "0.0";
    c3 = "0.00";
  }

  if (relayStates[4]) {
    v4 = (12 + Math.random() * 0.5).toFixed(1);
    c4 = (0.11 + Math.random() * 0.05).toFixed(2);
  } else {
    v4 = "0.0";
    c4 = "0.00";
  }

  const voltages = [v1, v2, v3, v4];
  const currents = [c1, c2, c3, c4];

  for (let i = 1; i <= 4; i++) {
    const voltage = parseFloat(voltages[i - 1]);
    const current = parseFloat(currents[i - 1]);
    const power = (voltage * current).toFixed(1);

    const vEl = document.getElementById(`v${i}`);
    const cEl = document.getElementById(`c${i}`);
    const pEl = document.getElementById(`p${i}`);
    const sEl = document.getElementById(`s${i}`);

    if (vEl) vEl.textContent = voltages[i - 1] + "V";
    if (cEl) cEl.textContent = currents[i - 1] + "A";
    if (pEl) pEl.textContent = power + "W";
    if (sEl) sEl.textContent = relayStates[i] ? "ON" : "OFF";

    totalCurrent += isNaN(current) ? 0 : current;
    totalPower += isNaN(parseFloat(power)) ? 0 : parseFloat(power);
  }

  const validVoltages = voltages.filter((v) => parseFloat(v) > 0);
  const avgVoltage =
    validVoltages.length > 0
      ? (validVoltages.reduce((a, b) => a + parseFloat(b), 0) / validVoltages.length).toFixed(1)
      : "0.0";

  const tv = document.getElementById("tv");
  const tc = document.getElementById("tc");
  const tp = document.getElementById("tp");
  if (tv) tv.textContent = avgVoltage + "V";
  if (tc) tc.textContent = totalCurrent.toFixed(2) + "A";
  if (tp) tp.textContent = totalPower.toFixed(1) + "W";
}
setInterval(updateLiveDemo, 2000);

// ==================================================================
//  CHARTS (IN Wh) - SUPABASE INTEGRATION
// ==================================================================
const filterSelect = document.getElementById("filterSelect");
const filterInputs = {
  day: document.getElementById("singleDay"),
  month: document.getElementById("singleMonth"),
  dayRange: document.getElementById("dayRangeInputs"),
  monthRange: document.getElementById("monthRangeInputs"),
};
if (filterSelect) {
  filterSelect.addEventListener("change", () => {
    Object.values(filterInputs).forEach((el) => el && el.classList.add("hidden"));
    const selected = filterSelect.value;
    if (filterInputs[selected]) filterInputs[selected].classList.remove("hidden");
  });
}

let chart = null;

// cost calculation
function calculateCost(totalWh) {
  if (totalWh <= 50) return totalWh * 4;
  else if (totalWh <= 100) return totalWh * 6;
  else return totalWh * 8;
}

// -----------------------------
// Supabase configuration (replace with your keys if needed)
// -----------------------------
const SUPABASE_URL = "https://rezbwyqsbgdppzzyvlwc.supabase.co";
const SUPABASE_ANON_KEY = "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJ3eXFzYmdkcHB6enl2bHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODUzMzUsImV4cCI6MjA4MDE2MTMzNX0.pBJ7e-E-TT5fioh3ZpOOBPcZEM0apqcxFyx_xfLDowwOKEYUR-ANON-";

// Helper: format Date to YYYY-MM-DD
function toISODateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Normalize Supabase row date to YYYY-MM-DD (handles timestamps)
function normalizeDateStr(raw) {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return toISODateStr(d);
}

// Parse a Supabase row into numeric loads
function parseRowToLoads(row) {
  return {
    load1: Number(row.load1_wh ?? 0) || 0,
    load2: Number(row.load2_wh ?? 0) || 0,
    load3: Number(row.load3_wh ?? 0) || 0,
    load4: Number(row.load4_wh ?? 0) || 0,
    total: Number(row.total_wh ?? 0) || 0,
  };
}

// Fetch a single day row from Supabase (returns null if not found)
async function fetchDayUsage(dateStr) {
  const url = `${SUPABASE_URL}/rest/v1/daily_load_usage?select=date,load1_wh,load2_wh,load3_wh,load4_wh,total_wh&date=eq.${encodeURIComponent(dateStr)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase day fetch failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return parseRowToLoads(data[0]);
}

// Fetch inclusive date range from Supabase and return map date->loads
async function fetchRangeUsage(fromStr, toStr) {
  const url = `${SUPABASE_URL}/rest/v1/daily_load_usage?select=date,load1_wh,load2_wh,load3_wh,load4_wh,total_wh&date=gte.${encodeURIComponent(fromStr)}&date=lte.${encodeURIComponent(toStr)}&order=date.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase range fetch failed: ${res.status} ${txt}`);
  }
  const rows = await res.json();
  const map = {};
  rows.forEach((r) => {
    const ds = normalizeDateStr(r.date);
    if (ds) map[ds] = parseRowToLoads(r);
  });
  return map;
}

// Optional helper: insert a sample row into Supabase (requires insert permission)
async function insertSampleRow(dateStr, loads) {
  const url = `${SUPABASE_URL}/rest/v1/daily_load_usage`;
  const body = {
    date: dateStr,
    device_id: "esp32-local",
    load1_wh: String(loads.load1),
    load2_wh: String(loads.load2),
    load3_wh: String(loads.load3),
    load4_wh: String(loads.load4),
    total_wh: String((loads.load1 + loads.load2 + loads.load3 + loads.load4).toFixed(2)),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase insert failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

// -----------------------------
// Chart load handler (fixed dayRange iteration and normalization)
// -----------------------------
const loadChartsBtn = document.getElementById("loadCharts");
if (loadChartsBtn) {
  loadChartsBtn.addEventListener("click", async () => {
    const canvas = document.getElementById("chart");
    if (!canvas) {
      alert("Chart canvas not found.");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (chart) chart.destroy();

    const selected = filterSelect ? filterSelect.value : "day";
    const deviceLabels = ["Light 1", "Light 2", "Light 3", "Fan"];
    const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
    let chartLabels = [];
    let dailyData = [];

    try {
      if (selected === "day") {
        const dayInput = document.getElementById("singleDay");
        const day = (dayInput && dayInput.value) ? dayInput.value : toISODateStr(new Date());
        if (dayInput && !dayInput.value) dayInput.value = day;
        chartLabels.push(day);

        let loads = null;
        try {
          loads = await fetchDayUsage(day);
        } catch (e) {
          console.error("fetchDayUsage error:", e);
          addNotification("Supabase fetch error. See console.");
          loads = null;
        }

        if (loads) {
          dailyData.push({ load1: loads.load1, load2: loads.load2, load3: loads.load3, load4: loads.load4 });
        } else {
          const sample = { load1: 1.5, load2: 1.5, load3: 1.4, load4: 1.6 };
          try {
            await insertSampleRow(day, sample);
            addNotification(`Inserted sample row for ${day} into Supabase.`);
            dailyData.push(sample);
          } catch (e) {
            console.warn("Insert sample failed:", e);
            addNotification(`No Supabase row for ${day}. Showing sample values locally.`);
            dailyData.push(sample);
          }
        }

      } else if (selected === "dayRange") {
        const fromVal = document.getElementById("fromDay").value;
        const toVal = document.getElementById("toDay").value;
        if (!fromVal || !toVal) {
          alert("Please select both From and To dates.");
          return;
        }

        const from = new Date(fromVal);
        const to = new Date(toVal);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          alert("Invalid dates selected.");
          return;
        }
        if (from > to) {
          alert("From date must be earlier than or equal to To date.");
          return;
        }

        const fromStr = toISODateStr(from);
        const toStr = toISODateStr(to);

        let rangeMap = {};
        try {
          rangeMap = await fetchRangeUsage(fromStr, toStr);
        } catch (e) {
          console.error("fetchRangeUsage error:", e);
          addNotification("Supabase range fetch error. See console.");
          rangeMap = {};
        }

        for (let d = new Date(from.getTime()); d.getTime() <= to.getTime(); d.setDate(d.getDate() + 1)) {
          const ds = toISODateStr(d);
          chartLabels.push(ds);
          if (rangeMap[ds]) {
            dailyData.push({
              load1: rangeMap[ds].load1,
              load2: rangeMap[ds].load2,
              load3: rangeMap[ds].load3,
              load4: rangeMap[ds].load4,
            });
          } else {
            dailyData.push({ load1: 0, load2: 0, load3: 0, load4: 0 });
          }
        }

      } else if (selected === "month") {
        const val = document.getElementById("singleMonth").value || new Date().toISOString().slice(0, 7);
        chartLabels.push(val);
        dailyData.push({ load1: 10, load2: 12, load3: 9, load4: 15 });

      } else if (selected === "monthRange") {
        const fromVal = document.getElementById("fromMonth").value;
        const toVal = document.getElementById("toMonth").value;
        if (!fromVal || !toVal) {
          alert("Please select both From and To months.");
          return;
        }
        const from = new Date(fromVal + "-01");
        const to = new Date(toVal + "-01");
        for (let d = new Date(from.getTime()); d.getTime() <= to.getTime(); d.setMonth(d.getMonth() + 1)) {
          chartLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          dailyData.push({ load1: 10 + Math.random() * 10, load2: 8 + Math.random() * 10, load3: 6 + Math.random() * 8, load4: 12 + Math.random() * 8 });
        }
      }

      const datasets = deviceLabels.map((load, i) => {
        const key = `load${i + 1}`;
        return {
          label: load,
          backgroundColor: colors[i],
          borderColor: colors[i],
          data: dailyData.map((day) => Number(day[key] || 0)),
          fill: false,
        };
      });

      chart = new Chart(ctx, {
        type: document.getElementById("chartType").value || "bar",
        data: { labels: chartLabels, datasets },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Power Consumption (Wh)", color: "#e2e8f0" },
            legend: { labels: { color: "#e2e8f0" } },
          },
          scales: {
            x: { ticks: { color: "#e2e8f0" } },
            y: { ticks: { color: "#e2e8f0" }, beginAtZero: true },
          },
        },
      });

      const resultDiv = document.getElementById("chartResults");
      if (resultDiv) {
        resultDiv.innerHTML = "";
        chartLabels.forEach((label, idx) => {
          const l = dailyData[idx] || { load1: 0, load2: 0, load3: 0, load4: 0 };
          const totalWh = Number(l.load1 || 0) + Number(l.load2 || 0) + Number(l.load3 || 0) + Number(l.load4 || 0);
          const cost = calculateCost(totalWh).toFixed(2);
          resultDiv.innerHTML += `
            <div style="
              margin-top:8px; background:#1e293b; padding:10px; border-radius:10px;
              text-align:center; width:60%; margin-left:auto; margin-right:auto;
              color:#e2e8f0; box-shadow:0 0 8px #0ea5e9;">
              <strong>${label}</strong><br>
              Load1: ${Number(l.load1 || 0).toFixed(2)} Wh<br>
              Load2: ${Number(l.load2 || 0).toFixed(2)} Wh<br>
              Load3: ${Number(l.load3 || 0).toFixed(2)} Wh<br>
              Fan:   ${Number(l.load4 || 0).toFixed(2)} Wh<br><br>
              <b>Total = ${totalWh.toFixed(2)} Wh</b> | Cost = ₹${cost}
            </div>`;
        });
      }

      addNotification(`Charts loaded for "${selected}" using ${selected === "day" || selected === "dayRange" ? "Supabase data" : "demo data"}.`);
    } catch (err) {
      console.error("loadCharts error:", err);
      alert("Failed to load data. Check console for details.");
      addNotification("Error loading charts. See console.");
    }
  });
}

// ==================================================================
//  PDF REPORT (IN Wh)
// ==================================================================
const downloadPdfBtn = document.getElementById("downloadPdf");
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", () => {
    const selected = filterSelect ? filterSelect.value : "month";
    if (selected !== "month" && selected !== "monthRange") {
      alert("PDF report available only for monthly or month-range data.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const deviceLabels = ["Light 1", "Light 2", "Light 3", "Fan"];

    function generateMonthlyReport(label) {
      pdf.setFontSize(14);
      pdf.text(`Power Consumption Report - ${label}`, 14, 20);
      pdf.setFontSize(10);
      pdf.text("------------------------------------------", 14, 25);

      let totalWh = 0;
      const rows = [];

      deviceLabels.forEach((load) => {
        const used = (Math.random() * 5000 + 1000).toFixed(0);
        totalWh += parseFloat(used);
        rows.push([load, used]);
      });

      const cost = calculateCost(totalWh).toFixed(2);
      let y = 35;
      pdf.text("Load Name        | Power Used (Wh)", 14, y);
      y += 6;

      rows.forEach((r) => {
        pdf.text(`${r[0].padEnd(16)} | ${r[1]} Wh`, 14, y);
        y += 6;
      });

      y += 6;
      pdf.text("------------------------------------------", 14, y);
      y += 8;
      pdf.text(`Total Power: ${totalWh.toFixed(0)} Wh`, 14, y);
      y += 6;
      pdf.text(`Cost: ${cost} rupees`, 14, y);
    }

    if (selected === "month") {
      const val = document.getElementById("singleMonth").value || new Date().toISOString().slice(0, 7);
      const [y, m] = val.split("-");
      const name = new Date(y, m - 1).toLocaleString("default", { month: "long" });
      generateMonthlyReport(`${name} ${y}`);
    } else {
      const from = new Date(document.getElementById("fromMonth").value + "-01");
      const to = new Date(document.getElementById("toMonth").value + "-01");
      let first = true;
      for (let d = new Date(from.getTime()); d.getTime() <= to.getTime(); d.setMonth(d.getMonth() + 1)) {
        if (!first) pdf.addPage();
        const label = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
        generateMonthlyReport(label);
        first = false;
      }
    }

    pdf.save("Monthly_Report_Wh.pdf");
  });
}

// ==================================================================
//  NOTIFICATIONS + LOGOUT
// ==================================================================
const refreshNotifs = document.getElementById("refreshNotifs");
if (refreshNotifs) refreshNotifs.addEventListener("click", () => addNotification("New data updated."));
const clearNotifs = document.getElementById("clearNotifs");
if (clearNotifs) clearNotifs.addEventListener("click", () => {
  const notifs = document.getElementById("notifs");
  if (notifs) notifs.innerHTML = "<li>No notifications yet.</li>";
});

function addNotification(msg) {
  const list = document.getElementById("notifs");
  if (!list) return;
  if (list.children.length === 0 || list.children[0].textContent === "No notifications yet.") list.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
  list.prepend(li);
}

function logout() {
  window.location.href = "index.html";
}
