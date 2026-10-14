#!/usr/bin/env python3
"""Propio del Tiempo Ordinario (tomos III y IV) -> data/propio_to/semanaNN.json
Uso: python3 -I parse_propio_to.py <tomo3.txt> <tomo4.txt> <data_dir>
"""
import json, os, re, sys

t3, t4, out = sys.argv[1], sys.argv[2], sys.argv[3]
ROM = {}
_r = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII",
      "XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX","XXXI","XXXII",
      "XXXIII","XXXIV"]
for i, r in enumerate(_r, 1):
    ROM[r] = i
DAYK = {"DOMINGO": "dom", "LUNES": "lun", "MARTES": "mar", "MIÉRCOLES": "mie", "JUEVES": "jue",
        "VIERNES": "vie", "SÁBADO": "sab"}
NOISE = [re.compile(r"^\s*-?\d+-?\s*$"), re.compile(r"^LITURGIA DE LAS HORAS\b.*$")]

H_WEEK = re.compile(r"^(LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO) ([IVXL]+) SEMANA DEL TIEMPO( ORDINARIO)?\s*$")
H_WEEK2 = re.compile(r"^(LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO) DE LA ([IVXL]+) SEMANA DEL TIEMPO ORDINARIO\s*$")
H_DOM = re.compile(r"^DOMINGO ([IVXL]+) DEL TIEMPO ORDINARIO\s*$")
HOURS = {"i vísperas": "visperas1", "ii vísperas": "visperas2", "vísperas": "visperas",
         "invitatorio": "invitatorio", "oficio de lectura": "oficio", "laudes": "laudes",
         "hora intermedia": "intermedia"}


def load(path, skip):
    raw = open(path, encoding="utf-8-sig").read().split("\n")
    res = []
    for i, l in enumerate(raw, 1):
        l = l.replace(" ", " ").rstrip()
        if any(p.match(l) for p in NOISE):
            continue
        res.append((i, l))
    return [(i, l) for i, l in res if i > skip]


def parse_hour(lines):
    """Divide una hora en secciones lineales."""
    secs, cur = [], None
    anio = None

    def new(tipo, **kw):
        nonlocal cur
        if cur:
            secs.append(cur)
        cur = {"tipo": tipo, "lines": []}
        cur.update(kw)

    for l in lines:
        s = l.strip()
        m = None
        if s == "PRIMERA LECTURA":
            anio = None; new("lectura1"); continue
        if s == "SEGUNDA LECTURA":
            anio = None; new("lectura2"); continue
        m = re.search(r"\bAño (I|II):?\s*$", s)
        if m and len(s) < 60 and cur is not None and cur["tipo"] in ("lectura1", "responsorio"):
            anio = m.group(1); new("lectura1", anio=anio); continue
        if re.match(r"^Responsorio\b", s):
            new("responsorio", ref=s[len("Responsorio"):].strip(), anio=anio if (cur and cur.get("tipo") == "lectura1") or anio else None)
            # el responsorio hereda el año de su lectura
            continue
        if re.match(r"^HIMNO Te Deum", s):
            new("te_deum"); continue
        if s == "Oración":
            new("oracion"); continue
        if s == "CÁNTICO EVANGÉLICO":
            new("cantico_evangelico"); continue
        if cur is None:
            cur = {"tipo": "inicio", "lines": []}
        cur["lines"].append(l)
    if cur:
        secs.append(cur)
    out = []
    for s in secs:
        txt = "\n".join(s["lines"])
        txt = re.sub(r"\n{3,}", "\n\n", txt).strip()
        if s["tipo"] == "oracion":
            txt = txt.split("\n\n")[0].strip()      # la oración es un párrafo; lo demás es otra sección
        d = {"tipo": s["tipo"], "texto": txt}
        for k in ("anio", "ref"):
            if s.get(k):
                d[k] = s[k]
        if s["tipo"] in ("inicio", "lectura1") and not txt:
            continue
        if s["tipo"] == "inicio":
            continue
        if s["tipo"] == "te_deum":
            d = {"tipo": "te_deum"}
        out.append(d)
    # cántico evangélico: separar antífonas por ciclo A/B/C
    for d in out:
        if d["tipo"] == "cantico_evangelico":
            ants, cur_k = {}, None
            for l in d["texto"].split("\n"):
                m = re.match(r"^Año ([ABC]):\s*(.*)$", l.strip())
                if m:
                    cur_k = m.group(1); ants[cur_k] = m.group(2)
                elif cur_k and l.strip() and not re.match(r"^(Benedictus|Magn[ií]ficat)", l.strip()):
                    ants[cur_k] += " " + l.strip()
            if ants:
                ants = {k: re.sub(r"\s*O bien:.*$", "", v).strip() for k, v in ants.items()}
                d["ant_ciclo"] = ants
                d["texto"] = ""
            else:
                d["texto"] = re.sub(r"\n?(Benedictus|Magn[ií]ficat)\s*$", "", d["texto"]).strip()
    # lecturas del "Ciclo anual" (semanas I-IX): se marcan aparte
    for d in out:
        if d["tipo"] == "lectura1" and "anio" not in d and re.match(r"^Ciclo anual:", d["texto"]):
            d["anio"] = "anual"
            d["texto"] = re.sub(r"^Ciclo anual:\s*", "", d["texto"]).strip()
    # propagar año a responsorios que siguen a una lectura con año
    cur_anio = None
    for d in out:
        if d["tipo"] == "lectura1":
            cur_anio = d.get("anio")
        elif d["tipo"] == "responsorio":
            if cur_anio and "anio" not in d:
                d["anio"] = cur_anio
        elif d["tipo"] == "lectura2":
            cur_anio = None
    for d in out:
        if d["tipo"] == "responsorio" and "anio" in d and d["anio"] is None:
            del d["anio"]
    return out


def parse_block(lines, es_dom):
    hours, name, buf = {}, None, []
    stop = False

    def flush():
        nonlocal buf
        if name:
            key = name if name not in hours else name + "_2"
            hours[key] = parse_hour(buf)
        buf = []

    for l in lines:
        k = HOURS.get(l.strip().lower())
        if k:
            if (not es_dom and k != "oficio") or k in hours or (name == k):
                flush(); name = None; stop = True; break
            flush(); name = k; continue
        if name:
            buf.append(l)
    if not stop:
        flush()
    return hours


def run(path, skip, data):
    lines = load(path, skip)
    marks = []
    for idx, (i, l) in enumerate(lines):
        s = l.strip()
        m = H_WEEK.match(s) or H_WEEK2.match(s)
        if m:
            marks.append((idx, ROM[m.group(2)], DAYK[m.group(1)])); continue
        m = H_DOM.match(s)
        if m:
            marks.append((idx, ROM[m.group(1)], "dom"))
    for n, (idx, w, d) in enumerate(marks):
        end = marks[n + 1][0] if n + 1 < len(marks) else len(lines)
        block = [l for _, l in lines[idx + 1:end]]
        data.setdefault(w, {})
        if d in data[w]:
            print("DUPLICADO", w, d, lines[idx][0])
            continue
        data[w][d] = parse_block(block, d == "dom")


data = {}
run(t3, 200, data)
run(t4, 300, data)
os.makedirs(os.path.join(out, "propio_to"), exist_ok=True)
for w, days in sorted(data.items()):
    json.dump(days, open(os.path.join(out, "propio_to", f"semana{w}.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
print("semanas:", sorted(data))
falt = []
for w in range(1, 35):
    for d in ["dom", "lun", "mar", "mie", "jue", "vie", "sab"]:
        if w == 1 and d == "dom":
            continue
        if d not in data.get(w, {}):
            falt.append((w, d))
print("faltan:", falt)
