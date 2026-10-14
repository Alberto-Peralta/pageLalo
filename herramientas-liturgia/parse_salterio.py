#!/usr/bin/env python3
"""Parsea el Salterio (4 semanas) del tomo III a JSON.
Uso: python3 -I parse_salterio.py <tomo3.txt> <out_dir>
"""
import json, re, sys, os

src, out = sys.argv[1], sys.argv[2]
raw = open(src, encoding="utf-8-sig").read().split("\n")

START, END_SAL, END_COMP = 39403, 62905, 64133  # líneas 1-indexadas (ver exploración)

NOISE = [
    re.compile(r"^\s*-?\d+-?\s*$"),                       # números de página
    re.compile(r"^LITURGIA DE LAS HORAS\b.*$"),          # encabezado de tomo
]

def clean(lines):
    res = []
    for l in lines:
        l = l.replace(" ", " ").rstrip()
        if any(p.match(l) for p in NOISE):
            continue
        res.append(l)
    return res

def collapse(lines):
    """Une líneas en texto: párrafos separados por línea vacía."""
    RUB = re.compile(r"^(La conclusión de la Hora|La conclusión se hace|Se pueden añadir algunas intenciones|"
                     r"Esta invocación inicial se omite|Las lecturas y la oración|Todo como en el Ordinario|"
                     r"El responsorio breve y el cántico evangélico|El salmo invitatorio|"
                     r"La\s+oración conclusiva se toma|La oración, del domingo|La\s+antífona del cántico evangélico se toma|"
                     r"Pueden usarse también|Los himnos latinos de Completas|Después de la\s+invocación inicial)")
    kept, skipping = [], False
    for l in lines:
        st = l.strip()
        if skipping:
            if st and not st.endswith((".", ":")):
                continue
            skipping = False
            if st:
                continue
        if RUB.match(st):
            skipping = not st.endswith((".", ":"))
            continue
        kept.append(l)
    lines = kept
    txt = "\n".join(lines)
    txt = re.sub(r"[ \t]+\n", "\n", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    return txt.strip()

DAYS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"]
DAY_KEY = {"DOMINGO": "dom", "LUNES": "lun", "MARTES": "mar", "MIÉRCOLES": "mie",
           "JUEVES": "jue", "VIERNES": "vie", "SÁBADO": "sab"}
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4}

HOURS = {
    "i vísperas": "visperas1", "ii vísperas": "visperas2", "vísperas": "visperas",
    "invitatorio": "invitatorio", "oficio de lectura": "oficio",
    "laudes": "laudes", "hora intermedia": "intermedia", "completas": "completas",
}
SUBHOURS = {"tercia": "tercia", "sexta": "sexta", "nona": "nona"}

SECTION_MARKERS = [
    (re.compile(r"^HIMNO$"), "himno"),
    (re.compile(r"^SALMODIA$"), "salmodia"),
    (re.compile(r"^LECTURA BREVE\b(.*)$"), "lectura_breve"),
    (re.compile(r"^RESPONSORIO BREVE\b.*$"), "responsorio_breve"),
    (re.compile(r"^PRECES$"), "preces"),
    (re.compile(r"^Oración$"), "oracion"),
    (re.compile(r"^CÁNTICO EVANGÉLICO:?$"), "cantico_evangelico"),
    (re.compile(r"^(VERSÍCULO|Versículo)$"), "versiculo"),
    (re.compile(r"^(Tercia, Sexta, Nona|Tercia,? Sexta y Nona)$"), "_comun_menor"),
]

def split_sections(lines):
    """Divide las líneas de una hora en secciones por marcadores."""
    secs, cur = [], {"tipo": "inicio", "ref": "", "lines": []}
    for l in lines:
        s = l.strip()
        hit = None
        for rx, kind in SECTION_MARKERS:
            m = rx.match(s)
            if m:
                hit = (kind, m)
                break
        if hit:
            secs.append(cur)
            ref = hit[1].group(1).strip() if hit[0] == "lectura_breve" and hit[1].groups() else ""
            cur = {"tipo": hit[0], "ref": ref, "lines": []}
        else:
            cur["lines"].append(l)
    secs.append(cur)
    out = []
    for s in secs:
        t = collapse(s["lines"])
        if not t and s["tipo"] in ("inicio",):
            continue
        d = {"tipo": s["tipo"], "texto": t}
        if s["ref"]:
            d["ref"] = s["ref"]
        out.append(d)
    return out

def parse_region(lines, completas=False):
    """Devuelve estructura semana -> día -> hora -> secciones."""
    data = {}
    week = day = hour = None
    buf = []
    def flush():
        nonlocal buf
        if week and day and hour is not None and buf:
            data.setdefault(week, {}).setdefault(day, {})
            key = hour
            if key in data[week][day]:  # evitar sobrescribir
                key = hour + "_2"
            data[week][day][key] = buf
        buf = []
    for l in lines:
        s = l.strip()
        m = re.match(r"^SEMANA ([IV]+)$", s)
        if m:
            flush(); week = ROMAN[m.group(1)]; day = hour = None; continue
        if s in DAYS and week:
            flush(); day = DAY_KEY[s]; hour = None; continue
        m = re.match(r"^(DOMINGO|LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO) DE LA SEMANA ([IV]+)$", s)
        if m:
            flush(); week = ROMAN[m.group(2)]; day = DAY_KEY[m.group(1)]; hour = None; continue
        if s.lower() in HOURS and week and day:
            flush(); hour = HOURS[s.lower()]; continue
        if hour is not None:
            buf.append(l)
    flush()
    # estructurar secciones
    for w in data:
        for d in data[w]:
            for h, ls in list(data[w][d].items()):
                if h == "intermedia":
                    parts, cur, name = {}, [], "comun"
                    for l in ls:
                        if l.strip().lower() in SUBHOURS:
                            parts[name] = cur; cur = []; name = SUBHOURS[l.strip().lower()]
                        else:
                            cur.append(l)
                    parts[name] = cur
                    data[w][d][h] = {k: split_sections(v) for k, v in parts.items()}
                else:
                    data[w][d][h] = split_sections(ls)
    return data

# Salterio
sal_lines = clean(raw[START - 1:END_SAL])
sal = parse_region(sal_lines)

# Domingo "Domingo" tiene "I vísperas" y "II vísperas" — ya cubiertos.
os.makedirs(os.path.join(out, "salterio"), exist_ok=True)
for w, days in sal.items():
    with open(os.path.join(out, "salterio", f"semana{w}.json"), "w", encoding="utf-8") as f:
        json.dump(days, f, ensure_ascii=False, indent=1)

# Completas
comp_lines = clean(raw[END_SAL:END_COMP])
open(os.path.join(out, "_completas_raw.txt"), "w", encoding="utf-8").write("\n".join(comp_lines))

print("semanas:", sorted(sal.keys()))
for w in sorted(sal):
    print(w, {d: list(hs.keys()) for d, hs in sal[w].items()})

# ---- Completas ----
CB = [("dom1", 62906, 63036), ("dom", 63037, 63178), ("lun", 63179, 63312),
      ("mar", 63313, 63423), ("mie", 63424, 63552), ("jue", 63553, 63652),
      ("vie", 63653, 64133)]
comp = {}
for key, a, b in CB:
    ls = clean(raw[a - 1:b])
    # quitar el título inicial (primeras líneas hasta la primera sección)
    comp[key] = split_sections(ls)
with open(os.path.join(out, "completas.json"), "w", encoding="utf-8") as f:
    json.dump(comp, f, ensure_ascii=False, indent=1)
for k, v in comp.items():
    print("completas", k, [x["tipo"] for x in v])
