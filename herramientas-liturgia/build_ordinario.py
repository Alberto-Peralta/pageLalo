#!/usr/bin/env python3
"""Extrae las partes fijas del Ordinario (tomo III) a data/ordinario.json.
Uso: python3 -I build_ordinario.py <tomo3.txt> <data_dir>
"""
import json, re, sys, os

src, out = sys.argv[1], sys.argv[2]
raw = open(src, encoding="utf-8-sig").read().split("\n")
NOISE = [re.compile(r"^\s*-?\d+-?\s*$"), re.compile(r"^LITURGIA DE LAS HORAS\b.*$")]

def rng(a, b):
    """Líneas a..b (1-indexadas, inclusivas), limpias."""
    ls = [l.replace(" ", " ").rstrip() for l in raw[a - 1:b]]
    ls = [l for l in ls if not any(p.match(l) for p in NOISE)]
    t = "\n".join(ls)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def between(a, b, start_pat, end_pat):
    t = rng(a, b)
    i = re.search(start_pat, t)
    j = re.search(end_pat, t)
    return t[i.start():j.end()] if i and j else ""

def cut_after(t, pat):
    m = re.search(pat, t, re.S)
    return t[:m.end()].strip() if m else t

DOX = r"por los siglos de los siglos\.\s*Amén\."

o = {
    "invitatorio": {
        "versiculo": "V. Señor, ábreme los labios.\nR. Y mi boca proclamará tu alabanza.",
        "salmos": {
            "94": rng(37878, 37941), "99": rng(37942, 37988),
            "66": rng(37989, 38041), "23": rng(38042, 38118),
        },
    },
    "te_deum": between(38180, 38354, r"A ti, oh Dios, te alabamos", r"no quede yo nunca defraudado\."),
    "benedictus": cut_after(rng(38528, 38588), DOX),
    "magnificat": cut_after(rng(39043, 39080), r"su descendencia por siempre\.") + "\nGloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre,\npor los siglos de los siglos. Amén.",
    "nunc_dimittis": cut_after(rng(39257, 39275), DOX),
    "padre_nuestro": between(38586, 38612, r"Padre nuestro, que est", r"líbranos del mal\."),
    "conclusion_laudes_visperas": rng(38621, 38655),
    "completas_fijo": {
        "inicio": rng(39160, 39166),
        "examen": rng(39167, 39217),
        "conclusion": rng(39276, 39290),
        "responsorio_breve": between(39218, 39256, r"V\. En tus manos", r"R\. En tus manos, Señor, encomiendo mi espíritu,").rstrip(",") + ".",
        "cantico_ant": between(39218, 39256, r"Ant\. Sálvanos", r"descansemos en paz\."),
    },
    "antifonas_marianas_raw": rng(39284, 39402),
}
json.dump(o, open(os.path.join(out, "ordinario.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in o.items():
    if isinstance(v, str):
        print(k, len(v))
    else:
        print(k, {kk: (len(vv) if isinstance(vv, str) else {a: len(b) for a, b in vv.items()}) for kk, vv in v.items()})
