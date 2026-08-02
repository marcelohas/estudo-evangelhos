from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GOSPEL = (sys.argv[1] if len(sys.argv) > 1 else "marcos").lower()
DIRECTORY = ROOT / "traducao-pt" / f"{GOSPEL}-em-revisao"

REPLACEMENTS = {
    "Lustro.": "Glosa.",
    "Lustro:": "Glosa:",
    "Gloss.": "Glosa.",
    "Gloss:": "Glosa:",
    "Pseudo-Jerome": "Pseudo-Jerônimo",
    "Pseudo-Chrysostom": "Pseudo-Crisóstomo",
    "Chrysostom": "Crisóstomo",
    "Theophylact": "Teofilato",
    "Augustine": "Agostinho",
    "Jerome": "Jerônimo",
    "Bede": "Beda",
    "Gregory": "Gregório",
    "Severianus": "Severiano",
    "Ambrose": "Ambrósio",
    "Hilary": "Hilário",
    "Leo": "Leão",
    "Teofilacto": "Teofilato",
    "Tito Bostrensis": "Tito de Bostra",
    "PREFÁCIO AO EVANGELHO SEGUNDO ST. MARK": "PREFÁCIO AO EVANGELHO SEGUNDO SÃO MARCOS",
    "Basil": "Basílio",
    "Pseudo-Basílio": "Pseudo-Basílio",
    "Pseudo-Basil": "Pseudo-Basílio",
    "Titus Bostrensis": "Tito de Bostra",
    "Maximus": "Máximo",
    "Cyprian": "Cipriano",
    "Gregório Nazianzen": "Gregório Nazianzeno",
    "Isidoro de Peleusium": "Isidoro de Pelúsio",
    "Evagrius": "Evágrio",
    "Antipater": "Antípatro",
    "Nilus": "Nilo",
    "Symeon": "Simeão",
    "Victor": "Vítor",
    "Didymus": "Dídimo",
    "Haymo": "Aimão",
    "Alcuín": "Alcuíno",
    "Jacob": "Jacó",
    "Abraham": "Abraão",
}


def revise(text: str) -> str:
    text = re.sub(r"^(#{1,4})\s+Rachar\.\s*(\d+)\s*$", r"\1 Capítulo \2", text, flags=re.M)
    text = re.sub(r"^Ver\.\s+(\d+)", r"Vers. \1", text, flags=re.M)
    for source, target in REPLACEMENTS.items():
        text = text.replace(source, target)
    return text


def main() -> None:
    for path in sorted(DIRECTORY.glob("*-pt.md")):
        original = path.read_text(encoding="utf-8")
        updated = revise(original)
        path.write_text(updated, encoding="utf-8")
        print(path.name)


if __name__ == "__main__":
    main()
