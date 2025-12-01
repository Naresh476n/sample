// ==================================================================
//  DATE & TIME
// ==================================================================
function updateDateTime() {
  document.getElementById("dateTime").textContent = new Date().toLocaleString();
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
  document.getElementById(`relay${i}`).addEventListener("change", (e) =>
    toggleRelay(i, e.target.checked)
  );
}

function toggleRelay(id, state) {
  relayStates[id] = state;
  document.getElementById(`s${id}`).textContent = state ? "ON" : "OFF";
  addNotification(`Load ${id} turned ${state ? "ON" : "OFF"}`);
}

// ==================================================================
//  AUTO-OFF TIMER
// ==================================================================
document.querySelectorAll(".preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("customMin").value = btn.dataset.min;
  });
});

document.getElementById("applyTimer").addEventListener("click", () => {
  const load = document.getElementById("loadSelect").value;
  const mins = parseInt(document.getElementById("customMin").value);
  if (!mins || mins <= 0) return alert("Enter valid minutes");

  if (autoOffTimers[load]) clearTimeout(autoOffTimers[load]);
  autoOffTimers[load] = setTimeout(() => {
    document.getElementById(`relay${load}`).checked = false;
    toggleRelay(load, false);
    addNotification(`Auto-OFF: Load ${load} OFF after ${mins} min`);
  }, mins * 60 * 1000);

  addNotification(`Timer set for Load ${load}: ${mins} min`);
});

// ==================================================================
//  DAILY LIMIT LOGIC
// ==================================================================
document.getElementById("saveLimits").addEventListener("click", () => {
  for (let i = 1; i <= 4; i++) {
    usageLimits[i] = parseFloat(document.getElementById(`limit${i}`).value);
  }
  addNotification("Usage limits updated.");
});

setInterval(() => {
  for (let i = 1; i <= 4; i++) {
    if (relayStates[i]) {
      usageTimers[i] += 2;
      const hoursUsed = usageTimers[i] / 3600;
      if (hoursUsed >= usageLimits[i]) {
        document.getElementById(`relay${i}`).checked = false;
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

  // LOAD 1  --> 12.0 - 12.3V & 0.12 - 0.14A
  if (relayStates[1]) {
    var v1 = (12 + Math.random() * 0.3).toFixed(1);
    var c1 = (0.12 + Math.random() * 0.02).toFixed(2);
  } else {
    var v1 = "0.0";
    var c1 = "0.00";
  }

  // LOAD 2  --> 12.0 - 12.2V & 0.12 - 0.13A
  if (relayStates[2]) {
    var v2 = (12 + Math.random() * 0.2).toFixed(1);
    var c2 = (0.12 + Math.random() * 0.01).toFixed(2);
  } else {
    var v2 = "0.0";
    var c2 = "0.00";
  }

  // LOAD 3  --> FIXED 12.0V & 0.12A
  if (relayStates[3]) {
    var v3 = (12).toFixed(1);
    var c3 = (0.12).toFixed(2);
  } else {
    var v3 = "0.0";
    var c3 = "0.00";
  }

  // FAN  --> 12.0 - 12.5V & 0.11 - 0.16A
  if (relayStates[4]) {
    var v4 = (12 + Math.random() * 0.5).toFixed(1);
    var c4 = (0.11 + Math.random() * 0.05).toFixed(2);
  } else {
    var v4 = "0.0";
    var c4 = "0.00";
  }

  // ---- Update HTML Values ----
  const voltages = [v1, v2, v3, v4];
  const currents = [c1, c2, c3, c4];

  for (let i = 1; i <= 4; i++) {
    const power = (voltages[i - 1] * currents[i - 1]).toFixed(1);
    const energy = (currents[i - 1] > 0 ? Math.random() * 5 : 0).toFixed(2);

    document.getElementById(`v${i}`).textContent = voltages[i - 1] + "V";
    document.getElementById(`c${i}`).textContent = currents[i - 1] + "A";
    document.getElementById(`p${i}`).textContent = power + "W";
    document.getElementById(`s${i}`).textContent = relayStates[i] ? "ON" : "OFF";

    totalCurrent += parseFloat(currents[i - 1]);
    totalPower += parseFloat(power);
  }

  // ---- TOTALS ---- (AVERAGE VOLTAGE)
  let validVoltages = voltages.filter(v => parseFloat(v) > 0); // only ON loads
  let avgVoltage = validVoltages.length > 0
    ? (validVoltages.reduce((a, b) => a + parseFloat(b), 0) / validVoltages.length).toFixed(1)
    : "0.0";

  document.getElementById("tv").textContent = avgVoltage + "V";  // Average Voltage
  document.getElementById("tc").textContent = totalCurrent.toFixed(2) + "A"; // Total Current
  document.getElementById("tp").textContent = totalPower.toFixed(1) + "W";   // Total Power
}

setInterval(updateLiveDemo, 2000);

// ==================================================================
//  CHART & PDF SECTION (UPDATED)
// ==================================================================
const filterSelect = document.getElementById("filterSelect");
const filterInputs = {
  day: document.getElementById("singleDay"),
  month: document.getElementById("singleMonth"),
  dayRange: document.getElementById("dayRangeInputs"),
  monthRange: document.getElementById("monthRangeInputs"),
};

// Show/hide filter inputs
filterSelect.addEventListener("change", () => {
  Object.values(filterInputs).forEach(el => el.classList.add("hidden"));
  const selected = filterSelect.value;
  if (filterInputs[selected]) filterInputs[selected].classList.remove("hidden");
});

let chart;

// Fixed energy ranges per load (Wh) for demo-only (used for month/monthRange)
const energyRanges = {
  load1: [1.5, 3, 4.5, 6, 7.5],
  load2: [1.5, 3, 4.5, 6, 7.5],
  load3: [1.4, 2.8, 4.2, 5.6, 7],
  load4: [1.6, 3.2, 4.8, 6.4, 8],
};

// Get random Wh for ONE day (demo)
function getRandomWhForDay() {
  return {
    load1: energyRanges.load1[Math.floor(Math.random() * energyRanges.load1.length)],
    load2: energyRanges.load2[Math.floor(Math.random() * energyRanges.load2.length)],
    load3: energyRanges.load3[Math.floor(Math.random() * energyRanges.load3.length)],
    load4: energyRanges.load4[Math.floor(Math.random() * energyRanges.load4.length)],
  };
}

// Cost calculation
function calculateCost(totalWh) {
  if (totalWh <= 250) return totalWh * 0.5;
  else if (totalWh <= 500) return totalWh * 1;
  else return totalWh * 1.5;
}

// ==================================================================
//  SUPABASE INTEGRATION FOR DAY AND DAY-RANGE (REAL DATA)
// ==================================================================
// Fill these with your actual project values
const SUPABASE_URL = "https://qcmtwrllhkecstwnnfik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbXR3cmxsaGtlY3N0d25uZmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjU2ODUsImV4cCI6MjA4MDE0MTY4NX0.pAtt5qH76t0GzHkljnOcIYitRisV4TyPl-s-1cZmaUg";

// Helpers
function toISODateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseRowToLoads(row) {
  return {
    load1: parseFloat(row.load1_wh ?? 0) || 0,
    load2: parseFloat(row.load2_wh ?? 0) || 0,
    load3: parseFloat(row.load3_wh ?? 0) || 0,
    load4: parseFloat(row.load4_wh ?? 0) || 0,
  };
}

// Fetch single day from Supabase
async function fetchDayUsage(dateStr) {
  const url = `${SUPABASE_URL}/rest/v1/daily_load_usage?select=date,load1_wh,load2_wh,load3_wh,load4_wh,total_wh&date=eq.${encodeURIComponent(dateStr)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase day fetch failed: ${res.status}`);
  const data = await res.json();
  if (data.length === 0) return null;
  return parseRowToLoads(data[0]);
}

// Fetch range of days (inclusive) from Supabase
async function fetchRangeUsage(fromStr, toStr) {
  const url = `${SUPABASE_URL}/rest/v1/daily_load_usage?select=date,load1_wh,load2_wh,load3_wh,load4_wh,total_wh&date=gte.${encodeURIComponent(fromStr)}&date=lte.${encodeURIComponent(toStr)}&order=date.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase range fetch failed: ${res.status}`);
  const rows = await res.json();
  // Map: dateStr -> loads
  const map = {};
  rows.forEach(r => { map[r.date] = parseRowToLoads(r); });
  return map;
}

// ==================================================================
//  LOAD CHARTS (DAY/DAY-RANGE FROM SUPABASE, MONTH/MONTH-RANGE DEMO)
// ==================================================================
document.getElementById("loadCharts").addEventListener("click", async () => {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chart) chart.destroy();

  const selected = filterSelect.value;
  const deviceLabels = ["Light 1", "Light 2", "Light 3", "Fan"];
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
  let chartLabels = [];
  let dailyData = [];

  try {
    if (selected === "day") {
      const day = document.getElementById("singleDay").value || new Date().toISOString().split("T")[0];
      chartLabels.push(day);

      // Fetch from Supabase
      const loads = await fetchDayUsage(day);
      if (loads) {
        dailyData.push(loads);
      } else {
        addNotification(`No data in Supabase for ${day}.`);
        dailyData.push({ load1: 0, load2: 0, load3: 0, load4: 0 });
      }

    } else if (selected === "dayRange") {
      const fromInput = document.getElementById("fromDay").value;
      const toInput = document.getElementById("toDay").value;

      if (!fromInput || !toInput) {
        alert("Please select both From and To dates.");
        return;
      }

      const from = new Date(fromInput);
      const to = new Date(toInput);

      // Fetch all data in one call
      const fromStr = toISODateStr(from);
      const toStr = toISODateStr(to);
      const rangeMap = await fetchRangeUsage(fromStr, toStr);

      // Build labels for every day in range, fill with 0 if missing
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = toISODateStr(d);
        chartLabels.push(ds);
        if (rangeMap[ds]) {
          dailyData.push(rangeMap[ds]);
        } else {
          dailyData.push({ load1: 0, load2: 0, load3: 0, load4: 0 });
        }
      }

    } else if (selected === "month") {
      const val = document.getElementById("singleMonth").value || new Date().toISOString().slice(0, 7);
      chartLabels.push(val);
      // Keep demo for month
      dailyData.push(getRandomWhForDay());

    } else if (selected === "monthRange") {
      const fromVal = document.getElementById("fromMonth").value;
      const toVal = document.getElementById("toMonth").value;
      if (!fromVal || !toVal) {
        alert("Please select both From and To months.");
        return;
      }
      const from = new Date(fromVal + "-01");
      const to = new Date(toVal + "-01");
      for (let d = new Date(from); d <= to; d.setMonth(d.getMonth() + 1)) {
        chartLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        // Keep demo for month-range
        dailyData.push(getRandomWhForDay());
      }
    }

    // Prepare dataset for Chart.js
    const datasets = deviceLabels.map((load, i) => {
      const key = `load${i + 1}`;
      return {
        label: load,
        backgroundColor: colors[i],
        borderColor: colors[i],
        data: dailyData.map(day => day[key]),
      };
    });

    chart = new Chart(ctx, {
      type: document.getElementById("chartType").value,
      data: { labels: chartLabels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "Power Consumption (Wh)", color: "#e2e8f0" },
          legend: { labels: { color: "#e2e8f0" } },
        },
        scales: {
          x: { ticks: { color: "#e2e8f0" } },
          y: { ticks: { color: "#e2e8f0" } },
        },
      },
    });

    // Show Wh & Cost below chart (uses real data for day/day-range, demo for others)
    const resultDiv = document.getElementById("chartResults");
    resultDiv.innerHTML = "";
    chartLabels.forEach((label, idx) => {
      const totalWh =
        (dailyData[idx].load1 || 0) +
        (dailyData[idx].load2 || 0) +
        (dailyData[idx].load3 || 0) +
        (dailyData[idx].load4 || 0);
      const cost = calculateCost(totalWh).toFixed(2);
      resultDiv.innerHTML += `
        <div style="
          margin-top:8px; background:#1e293b; padding:10px; border-radius:10px;
          text-align:center; width:60%; margin-left:auto; margin-right:auto;
          color:#e2e8f0; box-shadow:0 0 8px #0ea5e9;">
          <strong>${label}</strong><br>
          Load1: ${Number(dailyData[idx].load1 || 0).toFixed(2)} Wh<br>
          Load2: ${Number(dailyData[idx].load2 || 0).toFixed(2)} Wh<br>
          Load3: ${Number(dailyData[idx].load3 || 0).toFixed(2)} Wh<br>
          Fan:   ${Number(dailyData[idx].load4 || 0).toFixed(2)} Wh<br><br>
          <b>Total = ${totalWh.toFixed(2)} Wh</b> | Cost = ₹${cost}
        </div>`;
    });

    // Notify success
    addNotification(`Charts loaded for "${selected}" using ${selected === "day" || selected === "dayRange" ? "Supabase data" : "demo data"}.`);

  } catch (err) {
    console.error(err);
    alert("Failed to load data. Please check Supabase URL/key and table schema.");
    addNotification("Error loading charts. Check console and Supabase settings.");
  }
});

// ==================================================================
//  PDF REPORT
// ==================================================================
document.getElementById("downloadPdf").addEventListener("click", () => {
  const selected = filterSelect.value;
  if (selected !== "month" && selected !== "monthRange") {
    alert("PDF only available for month or month-range!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  function generateReport(label) {
    pdf.setFontSize(14);
    pdf.text(`Power Consumption Report - ${label}`, 14, 20);

    const values = getRandomWhForDay();
    let totalWh = values.load1 + values.load2 + values.load3 + values.load4;
    const cost = calculateCost(totalWh).toFixed(2);

    pdf.setFontSize(10);
    pdf.text(`---------------------------------------`, 14, 25);
    pdf.text(`Load1 : ${values.load1} Wh`, 14, 35);
    pdf.text(`Load2 : ${values.load2} Wh`, 14, 45);
    pdf.text(`Load3 : ${values.load3} Wh`, 14, 55);
    pdf.text(`Fan   : ${values.load4} Wh`, 14, 65);
    pdf.text(`---------------------------------------`, 14, 75);
    pdf.text(`Total Power: ${totalWh.toFixed(2)} Wh`, 14, 85);
    pdf.text(`Cost: ₹${cost}`, 14, 95);
  }

  if (selected === "month") {
    const val = document.getElementById("singleMonth").value || new Date().toISOString().slice(0, 7);
    const [y, m] = val.split("-");
    const name = new Date(y, m - 1).toLocaleString("default", { month: "long" });
    generateReport(`${name} ${y}`);
  } else {
    const from = new Date(document.getElementById("fromMonth").value + "-01");
    const to = new Date(document.getElementById("toMonth").value + "-01");
    let first = true;
    for (let d = new Date(from); d <= to; d.setMonth(d.getMonth() + 1)) {
      if (!first) pdf.addPage();
      const label = `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
      generateReport(label);
      first = false;
    }
  }

  pdf.save("Monthly_Report_Wh.pdf");
});

// ==================================================================
//  NOTIFICATIONS + LOGOUT
// ==================================================================
document
  .getElementById("refreshNotifs")
  .addEventListener("click", () => addNotification("New data updated."));

document.getElementById("clearNotifs").addEventListener("click", () => {
  document.getElementById("notifs").innerHTML =
    "<li>No notifications yet.</li>";
});

function addNotification(msg) {
  const list = document.getElementById("notifs");
  if (list.children[0].textContent === "No notifications yet.")
    list.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
  list.prepend(li);
}

function logout() {
  window.location.href = "index.html";
}
