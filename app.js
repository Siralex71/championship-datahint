const DATA_URL = "./data/latest.json";

function pct(n){ return `${Math.round(n * 100)}%`; }

function teamStats(matches, team){
  const played = matches.filter(m => m.home === team || m.away === team);
  const last = played.slice(-6);
  let points = 0, gf = 0, ga = 0;
  for (const m of last) {
    const isHome = m.home === team;
    const f = isHome ? m.hg : m.ag;
    const a = isHome ? m.ag : m.hg;
    gf += f; ga += a;
    if (f > a) points += 3;
    else if (f === a) points += 1;
  }
  return {
    played: last.length,
    ppg: last.length ? points / last.length : 0,
    gf: last.length ? gf / last.length : 0,
    ga: last.length ? ga / last.length : 0
  };
}

function pickHint(home, away, homeStats, awayStats) {
  let homeScore = 0.55 + (homeStats.ppg - awayStats.ppg) * 0.18 + (homeStats.gf - awayStats.ga) * 0.08;
  let awayScore = 0.45 + (awayStats.ppg - homeStats.ppg) * 0.18 + (awayStats.gf - homeStats.ga) * 0.08;
  const diff = homeScore - awayScore;
  if (Math.abs(diff) < 0.12) return { pick: "X", text: "Data peger på en tæt kamp. Uafgjort er bedste hint lige nu." };
  if (diff > 0) return { pick: "1", text: `${home} står stærkere i seneste form og får hjemmebanefordel.` };
  return { pick: "2", text: `${away} står stærkere i seneste form trods udebane.` };
}

async function load() {
  const res = await fetch(DATA_URL + "?t=" + Date.now());
  const data = await res.json();
  const matches = data.matches || [];
  const upcoming = data.upcoming || null;

  const latest = matches.slice(-8).reverse();
  document.getElementById("matches").innerHTML = latest.map(m =>
    `<div class="match"><span>${m.date}: ${m.home} - ${m.away}</span><span class="score">${m.hg}-${m.ag}</span></div>`
  ).join("");

  if (!upcoming) {
    document.getElementById("nextMatch").textContent = "Ingen kommende kamp fundet";
    document.getElementById("reason").textContent = "Workflowet har hentet historiske data, men ingen fixture er sat endnu.";
    document.getElementById("hintBadge").textContent = "?";
    return;
  }

  const hs = teamStats(matches, upcoming.home);
  const as = teamStats(matches, upcoming.away);
  const hint = pickHint(upcoming.home, upcoming.away, hs, as);

  document.getElementById("nextMatch").textContent = `${upcoming.home} - ${upcoming.away}`;
  document.getElementById("hintBadge").textContent = hint.pick;
  document.getElementById("reason").textContent = hint.text;
  document.getElementById("homeStats").textContent = `${upcoming.home}: ${hs.played} seneste, ${hs.ppg.toFixed(2)} point/kamp, ${hs.gf.toFixed(1)} mål for, ${hs.ga.toFixed(1)} imod.`;
  document.getElementById("awayStats").textContent = `${upcoming.away}: ${as.played} seneste, ${as.ppg.toFixed(2)} point/kamp, ${as.gf.toFixed(1)} mål for, ${as.ga.toFixed(1)} imod.`;
  document.getElementById("updated").textContent = `Sidst opdateret: ${data.updated || "ukendt"}`;
}

document.getElementById("refreshBtn").addEventListener("click", load);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
load().catch(err => {
  document.getElementById("nextMatch").textContent = "Kunne ikke hente data";
  document.getElementById("reason").textContent = String(err);
});
