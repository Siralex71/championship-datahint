import csv, json, urllib.request
from datetime import datetime, timezone

URL = "https://www.football-data.co.uk/mmz4281/2526/E1.csv"
OUT = "data/latest.json"

def fetch_csv():
    with urllib.request.urlopen(URL, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace").splitlines()

rows = list(csv.DictReader(fetch_csv()))
matches = []
for row in rows:
    if not row.get("HomeTeam") or not row.get("AwayTeam"):
        continue
    if row.get("FTHG") in ("", None) or row.get("FTAG") in ("", None):
        continue
    try:
        matches.append({
            "date": row.get("Date",""),
            "home": row["HomeTeam"],
            "away": row["AwayTeam"],
            "hg": int(row["FTHG"]),
            "ag": int(row["FTAG"])
        })
    except ValueError:
        pass

teams = sorted({m["home"] for m in matches} | {m["away"] for m in matches})
upcoming = None
if len(teams) >= 2:
    # Simpel placeholder: vælg to hold med nyeste registrerede kampe.
    recent = matches[-12:]
    seen = []
    for m in reversed(recent):
        for t in (m["home"], m["away"]):
            if t not in seen:
                seen.append(t)
    if len(seen) >= 2:
        upcoming = {"home": seen[0], "away": seen[1]}

payload = {
    "updated": datetime.now(timezone.utc).isoformat(),
    "source": URL,
    "upcoming": upcoming,
    "matches": matches[-120:]
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)
print(f"Wrote {OUT} with {len(payload['matches'])} matches")
