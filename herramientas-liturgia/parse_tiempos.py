#!/usr/bin/env python3
"""Tiempos fuertes (tomos I y II) -> data/<tiempo>/...
Uso: python3 -I parse_tiempos.py adviento <tomo1.txt> <data_dir>
"""
import json, os, re, sys

NOISE = [re.compile(r"^\s*-?\d+-?\s*$"), re.compile(r"^LITURGIA DE LAS HORAS\b.*$")]
ROM = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}
DAYK = {"DOMINGO": "dom", "LUNES": "lun", "MARTES": "mar", "MIÉRCOLES": "mie", "JUEVES": "jue",
        "VIERNES": "vie", "SÁBADO": "sab"}
HOURS = {"i vísperas": "visperas1", "ii vísperas": "visperas2", "vísperas": "visperas",
         "invitatorio": "invitatorio", "oficio de lectura": "oficio", "laudes": "laudes",
         "hora intermedia": "intermedia"}
SUBH = {"TERCIA": "tercia", "SEXTA": "sexta", "NONA": "nona"}


def load(path):
    raw = open(path, encoding="utf-8-sig").read().split("\n")
    res = []
    for i, l in enumerate(raw, 1):
        l = l.replace(" ", " ").rstrip()
        if any(p.match(l) for p in NOISE):
            continue
        res.append((i, l))
    return res


def parse_hour(lines, keep_inicio=False, inicio_tipo="inicio"):
    secs, cur, anio = [], None, None

    def new(tipo, **kw):
        nonlocal cur
        if cur:
            secs.append(cur)
        cur = {"tipo": tipo, "lines": []}
        cur.update(kw)

    for l in lines:
        l = re.sub(r"^\s*La conclusión de la Hora como en el Ordinario\.\s*", "", l)
        if re.match(r"^\s*La oración como en las Laudes\.\s*$", l):
            continue
        if re.match(r"^\s*O bien(, si coincide en domingo)?: Antífonas alternativas", l):
            continue
        s = re.sub(r"\s+", " ", l.strip())
        if s == "RECES":
            s = "PRECES"   # error de OCR en el texto fuente
        if s == "PRIMERA LECTURA":
            anio = None; new("lectura1"); continue
        if s == "VERSÍCULO":
            new("versiculo"); continue
        if s == "TERCERA LECTURA":
            anio = None; new("lectura3"); continue
        if s == "SEGUNDA LECTURA":
            anio = None; new("lectura2"); continue
        m = re.search(r"\bAño (I|II):?\s*$", s)
        if m and len(s) < 60 and cur is not None and cur["tipo"] in ("lectura1", "responsorio"):
            anio = m.group(1); new("lectura1", anio=anio); continue
        if re.match(r"^Responsorio\b(?! breve)", s) and not s.startswith("RESPONSORIO"):
            new("responsorio", ref=s[len("Responsorio"):].strip()); continue
        if re.match(r"^HIMNO Te Deum", s):
            new("te_deum"); continue
        if s == "HIMNO":
            new("himno"); continue
        if s == "SALMODIA":
            new("salmodia"); continue
        m = re.match(r"^LECTURA BREVE\b(.*)$", s)
        if m:
            new("lectura_breve", ref=m.group(1).strip()); continue
        if s == "RESPONSORIO BREVE":
            new("responsorio_breve"); continue
        if s == "PRECES":
            new("preces"); continue
        if s == "Oración":
            new("oracion"); continue
        if re.match(r"^Oración como en", s):
            new("oracion_laudes" if "Laudes" in s else "oracion_tercia"); continue
        if s == "CÁNTICO EVANGÉLICO":
            new("cantico_evangelico"); continue
        if cur is not None and cur["tipo"] == "himno" and re.match(
                r"^(Ant[.,]\s*1\.|Los salmos y el cántico|Las antífonas(,| y) los salmos|Antífonas, salmos y cántico)", s):
            new("salmodia")   # en estos bloques falta el rótulo SALMODIA tras el himno
        if cur is None:
            cur = {"tipo": "inicio", "lines": []}
        cur["lines"].append(l)
    if cur:
        secs.append(cur)
    out = []
    for s in secs:
        txt = re.sub(r"\n{3,}", "\n\n", "\n".join(s["lines"])).strip()
        if s["tipo"] == "oracion":
            txt = txt.split("\n\n")[0].strip()
        if s["tipo"] == "inicio" and re.search(r"(?i)salmos|antífonas", txt) and re.search(r"Salterio|como en|domingo", txt):
            rub = txt if not keep_inicio else re.split(r"(?m)^V\. ", txt)[0].strip()
            if rub and re.search(r"(?i)salmos|antífonas", rub):
                out.append({"tipo": "salmodia_ref", "texto": rub})
        if s["tipo"] in ("inicio",) and not keep_inicio:
            continue
        if s["tipo"] in ("oracion_laudes", "oracion_tercia"):
            out.append({"tipo": s["tipo"]}); continue
        if s["tipo"] == "te_deum":
            out.append({"tipo": "te_deum"}); continue
        if s["tipo"] == "lectura1" and not txt:
            continue
        if s["tipo"] == "inicio" and inicio_tipo == "versiculo":
            m = re.search(r"(?m)^V\. ", txt)
            if not m:
                continue
            txt = txt[m.start():].strip()
            s = dict(s, tipo="versiculo")
        txt = re.sub(r"(diciembre\.)\s*\n\s*diciembre\.\s*$", r"\1", txt)
        d = {"tipo": s["tipo"], "texto": txt}
        for k in ("anio", "ref"):
            if s.get(k):
                d[k] = s[k]
        out.append(d)
    for d in out:
        if d["tipo"] == "cantico_evangelico":
            ants, ck = {}, None
            for l in d["texto"].split("\n"):
                m = re.match(r"^Año ([ABC]):\s*(.*)$", l.strip())
                if m:
                    ck = m.group(1); ants[ck] = m.group(2)
                elif ck and l.strip() and not re.match(r"^(Benedictus|Magn[ií]ficat)", l.strip()):
                    ants[ck] += " " + l.strip()
            if ants:
                d["ant_ciclo"] = {k: re.sub(r"\s*O bien:.*$", "", v).strip() for k, v in ants.items()}
                d["texto"] = ""
            else:
                d["texto"] = re.sub(r"\n?(Benedictus|Magn[ií]ficat)\s*$", "", d["texto"]).strip()
    # el responsorio hereda el año de su lectura
    cur_anio = None
    for d in out:
        if d["tipo"] == "lectura1":
            cur_anio = d.get("anio")
        elif d["tipo"] == "responsorio" and cur_anio:
            d["anio"] = cur_anio
        elif d["tipo"] == "lectura2":
            cur_anio = None
    return out


def parse_block(lines, es_dom=False, comunes=False):
    hours, name, buf, stop = {}, None, [], False

    def flush():
        nonlocal buf
        if name:
            key = name
            if name == "intermedia":
                parts, cur, sub = {}, [], "comun"
                for l in buf:
                    if l.strip() in SUBH:
                        parts[sub] = cur; cur = []; sub = SUBH[l.strip()]
                    else:
                        cur.append(l)
                parts[sub] = cur
                hours[key] = {k: parse_hour(v) for k, v in parts.items()}
            elif comunes and name == "laudes":
                himnos, cur, tit = [], [], None
                for l in buf:
                    if re.match(r"^(I|II|III)$", l.strip()):
                        if cur: himnos.append({"tipo": "himno", "texto": "\n".join(cur).strip(), "ref": tit or ""})
                        cur, tit = [], l.strip()
                    else:
                        cur.append(l)
                if cur: himnos.append({"tipo": "himno", "texto": "\n".join(cur).strip(), "ref": tit or ""})
                hours[key] = himnos
            else:
                hours[key] = parse_hour(buf, keep_inicio=(name in ("invitatorio", "oficio")), inicio_tipo=("versiculo" if name == "oficio" else "inicio"))
        buf = []

    for l in lines:
        k = HOURS.get(l.strip().lower())
        if k:
            if k in hours or k == name:
                flush(); name = None; stop = True; break
            flush(); name = k; continue
        if name:
            buf.append(l)
    if not stop:
        flush()
    return hours


def split_blocks(lines, classify, start, end):
    marks = []
    for idx, (i, l) in enumerate(lines):
        if i < start or i > end:
            continue
        k = classify(l.strip())
        if k:
            marks.append((idx, k))
    res = {}
    for n, (idx, k) in enumerate(marks):
        nxt = marks[n + 1][0] if n + 1 < len(marks) else None
        stop_i = lines[nxt][0] if nxt is not None else end
        block = [l for (i, l) in lines[idx + 1:] if i < stop_i and i <= end]
        if k == "_stop":
            continue
        if k in res:
            print("DUPLICADO", k)
            continue
        res[k] = block
    return res


# ---------------------------------------------------------------- ADVIENTO
def adviento(t1, out):
    lines = load(t1)

    def classify(s):
        m = re.match(r"^DOMINGO (I|II|III|IV) DE ADVIENTO\s*$", s)
        if m:
            return "s%d.dom" % ROM[m.group(1)]
        m = re.match(r"^(LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO) (I|II|III) SEMANA DE ADVIENTO\s*$", s)
        if m:
            return "s%d.%s" % (ROM[m.group(2)], DAYK[m.group(1)])
        m = re.match(r"^(1[7-9]|2[0-4]) DE DICIEMBRE\s*$", s)
        if m:
            return "dic%s" % m.group(1)
        if re.match(r"^(I|II)\. TEXTOS COMUNES", s) or s == "TIEMPO DE NAVIDAD":
            return "_stop"
        return None

    blocks = split_blocks(lines, classify, 2244, 11892)
    # los bloques de dic24 terminan en 11892; el de dic17 empieza tras los comunes II (9126-9318)
    data = {}
    for k, b in blocks.items():
        data[k] = parse_block(b, es_dom=k.endswith(".dom"))
    d = os.path.join(out, "adviento")
    os.makedirs(d, exist_ok=True)
    semanas, dic = {}, {}
    for k, v in data.items():
        if k.startswith("dic"):
            dic[k[3:]] = v
        else:
            w, dia = k[1:].split(".")
            semanas.setdefault(w, {})[dia] = v
    for w, v in semanas.items():
        json.dump(v, open(os.path.join(d, "s%s.json" % w), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(dic, open(os.path.join(d, "dic.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # textos comunes
    com = {}
    for nombre, a, b in (("hasta16", 2024, 2243), ("desde17", 9126, 9318)):
        bl = [l for (i, l) in lines if a <= i <= b]
        com[nombre] = parse_block(bl, comunes=True)
    json.dump(com, open(os.path.join(d, "comunes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("adviento semanas:", {w: sorted(v) for w, v in sorted(semanas.items())})
    print("adviento dic:", sorted(dic))
    print("comunes:", {k: list(v) for k, v in com.items()})


# ---------------------------------------------------------------- NAVIDAD
def navidad(t1, out):
    lines = load(t1)
    exact = {"LA NATIVIDAD DEL SEÑOR": "nat", "LA SAGRADA FAMILIA DE JESÚS, MARÍA Y JOSÉ": "sagrada",
             "SOLEMNIDAD DE SANTA MARÍA, MADRE DE DIOS": "madre", "LA EPIFANÍA DEL SEÑOR": "epifania",
             "EL BAUTISMO DEL SEÑOR": "bautismo", "DOMINGO SEGUNDO DESPUÉS DE NAVIDAD": "dom2",
             "DÍA V DENTRO DE LA OCTAVA DE NAVIDAD": "dia5", "DÍA VI DENTRO DE LA OCTAVA DE NAVIDAD": "dia6",
             "DÍA VII DENTRO DE LA OCTAVA DE NAVIDAD": "dia7"}
    stops = {"FERIAS DE LA OCTAVA DE NAVIDAD", "FERIAS ANTERIORES A LA EPIFANÍA", "FERIAS POSTERIORES A LA EPIFANÍA"}
    post = {"7": "post7", "8": "post8", "9": "post9", "10": "post10", "11": "post11", "12": "post12"}

    def classify(s):
        s = s.strip()
        if s in exact:
            return exact[s]
        if s in stops or re.match(r"^(I|II)\. TEXTOS COMUNES", s):
            return "_stop"
        m = re.match(r"^(2[6-8]) DE DICIEMBRE\s*$", s)
        if m:
            return "dic" + m.group(1)
        m = re.match(r"^([2-7]) DE ENERO\s*$", s)
        if m:
            return "ene" + m.group(1)
        m = re.match(r"^(\d+) DE ENERO O (LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO) DESPUÉS DEL DOMINGO DE EPIFANÍA\s*$", s)
        if m and m.group(1) in post:
            return post[m.group(1)]
        return None

    blocks = split_blocks(lines, classify, 11893, 22929)
    d = os.path.join(out, "navidad")
    os.makedirs(d, exist_ok=True)
    celeb, ferias = {}, {}
    for k, b in blocks.items():
        es_celeb = k in ("nat", "sagrada", "madre", "epifania", "bautismo", "dom2")
        h = parse_block(b)
        (celeb if es_celeb else ferias)[k] = h
    for k, v in celeb.items():
        json.dump(v, open(os.path.join(d, k + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(ferias, open(os.path.join(d, "ferias.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    com = {}
    for nombre, a, b in (("hasta_epifania", 11893, 12001), ("desde_epifania", 18948, 19076)):
        bl = [l for (i, l) in lines if a <= i <= b]
        com[nombre] = parse_block(bl, comunes=True)
    json.dump(com, open(os.path.join(d, "comunes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("celebraciones:", {k: list(v) for k, v in celeb.items()})
    print("ferias:", sorted(ferias))
    print("comunes:", {k: {h: len(v) for h, v in c.items()} for k, c in com.items()})


def mezclar_antifonas(prop, base):
    """Pone las antífonas propias (Ant. 1/2/3) sobre los salmos de `base` (Salterio o Común)."""
    ants, cur = {}, None
    for l in prop.split("\n"):
        m = re.match(r"^Ant[.,]\s*(\d)\.\s*(.*)$", l.strip())
        if m:
            cur = m.group(1); ants[cur] = m.group(2); continue
        if re.match(r"^(Los salmos|Las antífonas|Antífonas, salmos)", l.strip()) or not l.strip():
            cur = None; continue
        if cur:
            ants[cur] += "\n" + l.strip()
    if not ants:
        return base
    out, num, skip = [], None, False
    for l in base.split("\n"):
        m = re.match(r"^Ant\.\s*(\d)?\.?\s*(.*)$", l.strip())
        if m:
            if m.group(1):
                num = m.group(1)
                out.append("Ant. %s. %s" % (num, ants.get(num, m.group(2))))
            else:
                out.append("Ant. %s" % ants.get(num, m.group(2)))
            skip = True
            continue
        if skip:
            if not l.strip() or re.match(r"^(Salmo|Cántico)\b", l.strip()):
                skip = False
            else:
                continue
        out.append(l)
    return "\n".join(out)


def maria_vesperas(t4):
    lines = load(t4)
    res = {}
    for clave, ini in (("visperas1", 75324), ("visperas2", 76352)):
        tx, on = [], False
        for i, l in lines:
            if i == ini:
                on = True; continue
            if on:
                if l.strip().startswith("LECTURA BREVE"):
                    break
                tx.append(l)
        res[clave] = re.sub(r"\n{3,}", "\n\n", "\n".join(tx)).strip()
    return res


def resolver_navidad(d, t4):
    """Reemplaza las remisiones de la salmodia por el texto completo (salmos + antífonas propias)."""
    maria = maria_vesperas(t4)
    cel = {k: json.load(open(os.path.join(d, k + ".json"), encoding="utf-8")) for k in ("nat", "sagrada", "madre", "epifania", "bautismo")}
    fer = json.load(open(os.path.join(d, "ferias.json"), encoding="utf-8"))

    def sal(h):
        for x in h:
            if x["tipo"] == "salmodia":
                return x
        return None

    def sal_dom(w, hora):
        s = json.load(open(os.path.join(os.path.dirname(d), "salterio", "semana%d.json" % w), encoding="utf-8"))
        return sal(s["dom"][hora])["texto"]

    def resolver(h, hora, tabla):
        x = sal(h)
        if not x or re.search(r"^(Salmo|Cántico) ", x["texto"], re.M):
            return
        t = x["texto"]
        m = re.search(r"domingo de la (IV|III|II|I) semana del Salterio", t)
        if m:
            w = ROM[m.group(1)]
            x["texto"] = mezclar_antifonas(t, sal_dom(w, "laudes" if hora == "laudes" else hora if hora in ("visperas1", "visperas2", "oficio") else "laudes"))
        elif "Común de Santa María Virgen" in t:
            x["texto"] = mezclar_antifonas(t, maria["visperas1" if hora == "visperas1" else "visperas2"])
        else:
            for pat, (k, hh) in tabla.items():
                if re.search(pat, t):
                    x["texto"] = sal(cel[k][hh])["texto"]; break

    # orden: primero las que no dependen de otras
    for k in ("nat", "sagrada", "madre", "epifania"):
        for hora in ("visperas1", "laudes", "visperas2", "oficio"):
            if hora in cel[k]:
                resolver(cel[k][hora], hora, {})
    tabla = {r"I Vísperas de la Epifanía": ("epifania", "visperas1"), r"II Vísperas de la Epifanía": ("epifania", "visperas2")}
    # "II Vísperas..." debe probarse antes que "I Vísperas..."
    tabla = {r"II Vísperas de la Epifanía": ("epifania", "visperas2"), r"\bI Vísperas de la Epifanía": ("epifania", "visperas1")}
    for hora in ("visperas1", "laudes", "visperas2", "oficio"):
        resolver(cel["bautismo"][hora], hora, tabla)
        if hora == "laudes":
            pass
    tn = {r"Laudes de la Natividad": ("nat", "laudes"), r"II Vísperas de la Natividad": ("nat", "visperas2")}
    for k in fer:
        for hora, h in fer[k].items():
            if hora in ("laudes", "visperas") and isinstance(h, list):
                x = sal(h)
                if x and not re.search(r"^(Salmo|Cántico) ", x["texto"], re.M):
                    for pat, (kk, hh) in tn.items():
                        if re.search(pat, x["texto"]):
                            x["texto"] = sal(cel[kk][hh])["texto"]; break
    for k, v in cel.items():
        json.dump(v, open(os.path.join(d, k + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(fer, open(os.path.join(d, "ferias.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ---------------------------------------------------------------- CUARESMA Y PASCUA (tomo II)
DAYK2 = DAYK


def _guardar(d, nombre, data):
    json.dump(data, open(os.path.join(d, nombre), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def cuaresma(t2, out):
    lines = load(t2)
    dias = "LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO"

    def classify(s):
        s = s.strip()
        if s == "MIÉRCOLES DE CENIZA":
            return "c0.mie"
        m = re.match(r"^(JUEVES|VIERNES|SÁBADO) DESPUÉS DE CENIZA\s*$", s)
        if m:
            return "c0." + DAYK[m.group(1)]
        m = re.match(r"^DOMINGO (I|II|III|IV|V) DE CUARESMA\s*$", s)
        if m:
            return "c%d.dom" % ROM[m.group(1)]
        m = re.match(r"^(%s) (I|II|III|IV|V) (?:SEMANA )?DE CUARESMA\s*$" % dias, s)
        if m:
            return "c%d.%s" % (ROM[m.group(2)], DAYK[m.group(1)])
        if s == "DOMINGO DE RAMOS EN LA PASIÓN DEL SEÑOR":
            return "sa.dom"
        m = re.match(r"^(LUNES|MARTES|MIÉRCOLES) SANTO\s*$", s)
        if m:
            return "sa." + DAYK[m.group(1)]
        if s == "JUEVES SANTO":
            return "sa.jue"
        if s == "JUEVES SANTO DE LA CENA DEL SEÑOR":
            return "sa.cena"
        if s == "VIERNES SANTO DE LA MUERTE DEL SEÑOR":
            return "sa.vie"
        if s == "SÁBADO SANTO":
            return "sa.sab"
        if re.match(r"^(I|II)\. TEXTOS COMUNES", s) or s == "SEMANA SANTA" or s == "TIEMPO PASCUAL":
            return "_stop"
        return None

    blocks = split_blocks(lines, classify, 2704, 21535)
    d = os.path.join(out, "cuaresma")
    os.makedirs(d, exist_ok=True)
    semanas = {}
    for k, b in blocks.items():
        w, dia = k.split(".")
        semanas.setdefault(w, {})[dia] = parse_block(b, es_dom=(dia == "dom"))
    sa = semanas.get("sa", {})
    if "cena" in sa and "visperas" in sa["cena"] and "visperas" not in sa.get("jue", {}):
        sa["jue"]["visperas"] = sa["cena"]["visperas"]   # Jueves Santo: las Vísperas de la Cena del Señor
    for w, v in semanas.items():
        _guardar(d, w + ".json", v)
    com = {}
    for nombre, a, b in (("cuaresma", 2708, 3045), ("santa", 17099, 17313)):
        bl = [l for (i, l) in lines if a <= i <= b]
        com[nombre] = parse_block(bl, comunes=True)
    _guardar(d, "comunes.json", com)
    resolver_salterio_cuaresma(d, out)
    print("cuaresma:", {w: sorted(v) for w, v in sorted(semanas.items())})
    print("comunes:", {k: list(v) for k, v in com.items()})


def pascua(t2, out):
    lines = load(t2)
    dias = "LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO"
    RN = {"II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}

    def classify(s):
        s = s.strip()
        if s == "DOMINGO DE PASCUA DE LA RESURRECCIÓN DEL SEÑOR":
            return "pa.dom"
        m = re.match(r"^(%s) (?:DENTRO )?DE LA OCTAVA DE PASCUA\s*$" % dias, s)
        if m:
            return "oct." + DAYK[m.group(1)]
        if s == "DOMINGO DE LA OCTAVA DE PASCUA":
            return "_stop"
        m = re.match(r"^DOMINGO (II|III|IV|V|VI|VII) DE PASCUA\s*$", s)
        if m:
            return "p%d.dom" % RN[m.group(1)]
        m = re.match(r"^(%s) (II|III|IV|V|VI|VII) SEMANA DE PASCUA\s*$" % dias, s)
        if m:
            return "p%d.%s" % (RN[m.group(2)], DAYK[m.group(1)])
        if s == "LA ASCENSIÓN DEL SEÑOR":
            return "asc"
        if s == "DOMINGO DE PENTECOSTÉS":
            return "pent"
        if re.match(r"^(I|II)\. TEXTOS COMUNES", s) or s in ("TIEMPO PASCUAL", "SEMANA VII DE PASCUA"):
            return "_stop"
        return None

    blocks = split_blocks(lines, classify, 21536, 44961)
    d = os.path.join(out, "pascua")
    os.makedirs(d, exist_ok=True)
    semanas, sueltos = {}, {}
    for k, b in blocks.items():
        if k in ("asc", "pent"):
            sueltos[k] = parse_block(b)
            continue
        w, dia = k.split(".")
        semanas.setdefault(w, {})[dia] = parse_block(b, es_dom=(dia == "dom"))
    for w, v in semanas.items():
        _guardar(d, w + ".json", v)
    for k, v in sueltos.items():
        _guardar(d, k + ".json", v)
    com = {}
    for nombre, a, b in (("hasta_ascension", 22476, 22846), ("despues_ascension", 39792, 39923)):
        bl = [l for (i, l) in lines if a <= i <= b]
        com[nombre] = parse_block(bl, comunes=True)
    _guardar(d, "comunes.json", com)
    resolver_pascua(d)
    resolver_celebraciones_pascua(d, out)
    print("pascua:", {w: sorted(v) for w, v in sorted(semanas.items())}, list(sueltos))
    print("comunes:", {k: list(v) for k, v in com.items()})


def resolver_pascua(d):
    """Resuelve las remisiones 'como en el domingo de la Resurrección' (Octava y domingo II)."""
    pa = json.load(open(os.path.join(d, "pa.json"), encoding="utf-8"))["dom"]
    oc = json.load(open(os.path.join(d, "oct.json"), encoding="utf-8"))
    p2 = json.load(open(os.path.join(d, "p2.json"), encoding="utf-8"))

    def sal(h):
        for x in h:
            if x["tipo"] == "salmodia":
                return x
        return None

    def arreglar(dia):
        for hora in ("laudes", "visperas", "visperas1", "visperas2"):
            h = dia.get(hora)
            if not h:
                continue
            ref = [x for x in h if x["tipo"] == "salmodia_ref" and "Resurrección" in x["texto"]]
            if ref and not sal(h):
                base = sal(pa["laudes" if hora == "laudes" else "visperas"])
                i = next((k for k, x in enumerate(h) if x["tipo"] == "himno"), -1) + 1
                h.insert(i, {"tipo": "salmodia", "texto": base["texto"]})
                h.remove(ref[0])
    for dia in oc.values():
        arreglar(dia)
    arreglar(p2["dom"])
    im = p2["dom"].get("intermedia")
    if not im or not im.get("tercia"):
        p2["dom"]["intermedia"] = json.loads(json.dumps(pa["intermedia"]))
    json.dump(oc, open(os.path.join(d, "oct.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(p2, open(os.path.join(d, "p2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def resolver_salterio_cuaresma(d, out):
    """Salmodias que sólo remiten a otro día del Salterio (p. ej. Miércoles de Ceniza)."""
    DIAS = {"lunes": "lun", "martes": "mar", "miércoles": "mie", "jueves": "jue", "viernes": "vie", "sábado": "sab", "domingo": "dom"}
    cambios = 0
    for f in sorted(os.listdir(d)):
        if f == "comunes.json" or not f.endswith(".json"):
            continue
        data = json.load(open(os.path.join(d, f), encoding="utf-8"))
        for dia, horas in data.items():
            for hora, h in horas.items():
                if hora not in ("oficio", "laudes", "visperas", "visperas1", "visperas2") or not isinstance(h, list):
                    continue
                for x in h:
                    if x["tipo"] != "salmodia" or re.search(r"^(Salmo|Cántico) ", x["texto"], re.M) or len(x["texto"]) > 300:
                        continue
                    m = re.search(r"del (lunes|martes|miércoles|jueves|viernes|sábado|domingo) de la semana (IV|III|II|I)\b", x["texto"])
                    if not m:
                        continue
                    sal = json.load(open(os.path.join(out, "salterio", "semana%d.json" % ROM[m.group(2)]), encoding="utf-8"))
                    base = sal[DIAS[m.group(1)]][hora if hora in sal[DIAS[m.group(1)]] else "visperas"]
                    b = next((y for y in base if y["tipo"] == "salmodia"), None)
                    if b:
                        resto = ""
                        mv = re.search(r"\n\s*VERSÍCULO.*$", x["texto"], re.S)
                        x["texto"] = b["texto"]
                        cambios += 1
        json.dump(data, open(os.path.join(d, f), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("salmodias resueltas desde el Salterio:", cambios)


def resolver_celebraciones_pascua(d, out):
    """Ascensión y Pentecostés: antífonas propias + salmos del domingo indicado del Salterio."""
    for k in ("asc", "pent"):
        f = os.path.join(d, k + ".json")
        data = json.load(open(f, encoding="utf-8"))
        for hora in ("visperas1", "laudes", "visperas2", "oficio"):
            for x in data.get(hora, []):
                if x["tipo"] != "salmodia" or re.search(r"^(Salmo|Cántico) ", x["texto"], re.M):
                    continue
                m = re.search(r"domingo de la (?:semana (IV|III|II|I)|(IV|III|II|I) semana) del [Ss]alterio", x["texto"])
                if not m:
                    continue
                sal = json.load(open(os.path.join(out, "salterio", "semana%d.json" % ROM[m.group(1) or m.group(2)]), encoding="utf-8"))["dom"]
                base = next((y for y in sal[hora] if y["tipo"] == "salmodia"), None)
                if base:
                    x["texto"] = mezclar_antifonas(x["texto"], base["texto"])
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ---------------------------------------------------------------- Domingos de Cuaresma/Pascua: Salterio del tomo II
ETIQ = re.compile(r"^((?:Domingos?|Tiempo|En el tiempo|En tiempo)\b[^:]{0,80}):\s*(.*)$")
FINAL = re.compile(r"[.!?»”]\s*$")


def _salmodias_domingo_t2(lines, lo=44962, hi=89573):
    """-> {semana: {hora: texto_salmodia}} del Salterio del tomo II (sólo la parte del domingo)."""
    inicios = {}
    for i, l in lines:
        if lo <= i <= hi:
            m = re.match(r"^LUNES DE LA SEMANA (IV|III|II|I)\s*$", l.strip())
            if m:
                inicios[ROM[m.group(1)]] = i
    doms = {}
    for i, l in lines:
        if lo <= i <= hi and l.strip() == "DOMINGO":
            doms[len(doms) + 1] = i
    res = {}
    HORAS_ = {"i vísperas": "visperas1", "ii vísperas": "visperas2", "oficio de lectura": "oficio", "laudes": "laudes",
              "hora intermedia": "intermedia", "invitatorio": "invitatorio"}
    for w, a in doms.items():
        b = inicios[w]
        seg = [l for (i, l) in lines if a < i < b]
        hora, buf, out = None, [], {}
        def cerrar():
            if hora and buf:
                out.setdefault(hora, []).extend(buf)
        for l in seg:
            k = HORAS_.get(l.strip().lower())
            if k:
                cerrar(); hora, buf = k, []
                continue
            buf.append(l)
        cerrar()
        res[w] = {}
        for h, ls in out.items():
            tx, on = [], False
            for l in ls:
                t = l.strip()
                if t == "SALMODIA":
                    on = True; continue
                if on and (t.startswith("LECTURA BREVE") or t == "VERSÍCULO" or t.startswith("La lectura breve")
                           or t.startswith("Oración de la") or t == "RESPONSORIO BREVE"):
                    break
                if on:
                    tx.append(l)
            res[w][h] = "\n".join(tx)
    return res


def _coincide(etiqueta, tgt):
    kind, n = tgt
    if kind == "Ramos":
        return "Domingo de Ramos" in etiqueta
    m = re.search(r"Domingos? ([IVX]+(?:(?:,| y) [IVX]+)*) de " + kind, etiqueta)
    if not m:
        return False
    return n in re.split(r",| y ", m.group(1).replace(" y ", ","))


def _clean(l):
    return l.strip()


def construir_domingo(texto, tgt):
    """Elige las antífonas (y el cántico) del domingo `tgt` entre las variantes del Salterio del tomo II."""
    L = texto.split("\n")
    # 1) agrupar en segmentos por "Antífona N"
    segs, cur = [], {"n": None, "head": [], "cuerpo": []}
    i = 0
    def leer_variantes(i):
        vs, j = [], i
        while j < len(L) and not L[j].strip():
            j += 1
        while j < len(L):
            t = L[j].strip()
            if vs and not t:
                k = j + 1
                while k < len(L) and not L[k].strip():
                    k += 1
                if k < len(L) and ETIQ.match(L[k].strip()):
                    j = k
                    continue
            m = ETIQ.match(t)
            if m:
                txt = [m.group(2).strip()]
                lab = m.group(1)
                j += 1
                while j < len(L):
                    t2 = L[j].strip()
                    if not t2:
                        # línea en blanco: continúa sólo si el texto no terminó y lo que sigue no es otra cosa
                        k = j + 1
                        while k < len(L) and not L[k].strip():
                            k += 1
                        if k < len(L) and not FINAL.search(" ".join(txt)) and not ETIQ.match(L[k].strip()) \
                                and not re.match(r"^(Antífona|Salmo|Cántico|Gloria|El versículo)", L[k].strip()):
                            j = k; continue
                        break
                    if ETIQ.match(t2) or re.match(r"^(Antífona \d|Salmo|Cántico|Gloria|El versículo|El cántico)", t2):
                        break
                    txt.append(t2); j += 1
                vs.append((lab, re.sub(r"^Ant\.\s*", "", " ".join(txt))))
                continue
            break
        return vs, j
    salida = []
    n_act = None
    elegido = {}
    omitir_seg = False
    while i < len(L):
        t = L[i].strip()
        m = re.match(r"^Antífona (\d)\s*$", t)
        if m:
            vs, j = leer_variantes(i + 1)
            n_act = m.group(1)
            sel = [x for x in vs if _coincide(x[0], tgt)]
            omitir_seg = bool(vs) and not sel and all(not x[0].startswith("Tiempo") for x in vs)
            if sel:
                elegido[n_act] = sel[0][1]
                if not omitir_seg:
                    salida.append("Ant. %s. %s" % (n_act, sel[0][1]))
            elif vs:
                tm = [x for x in vs if x[0].startswith("Tiempo")]
                if tm:
                    elegido[n_act] = tm[0][1]
                    salida.append("Ant. %s. %s" % (n_act, tm[0][1]))
            i = j
            continue
        if ETIQ.match(t) and not omitir_seg:
            vs, j = leer_variantes(i)
            sel = [x for x in vs if _coincide(x[0], tgt)] or [x for x in vs if x[0].startswith("Tiempo")]
            if sel:
                salida.append("Ant. " + sel[0][1])
            i = j
            continue
        if ETIQ.match(t) and omitir_seg:
            vs, j = leer_variantes(i)
            i = j
            continue
        if not omitir_seg:
            salida.append(L[i])
        i += 1
    txt = "\n".join(salida)
    i_ap = txt.find("El cántico siguiente se dice con Aleluya")
    i_pe = txt.find("Cántico 1 Pe")
    if i_ap != -1 and i_pe != -1 and i_pe < i_ap:
        if tgt[0] in ("Cuaresma", "Ramos"):
            txt = txt[:i_ap]                      # en Cuaresma se dice el cántico de 1 Pe, no el del Apocalipsis
        else:
            # en Pascua: antífona 3 propia + cántico del Apocalipsis, sin el de 1 Pe
            ant3 = re.search(r"(?m)^Ant\. 3\. .*(?:\n(?!Salmo|Cántico|Ant\.).*)*", txt[:i_pe])
            a3 = "" if "Ant. 3." in txt[:i_pe] or "3" not in elegido else "Ant. 3. " + elegido["3"] + "\n\n"
            txt = txt[:i_pe].rstrip() + "\n\n" + a3 + txt[i_ap:]
    return re.sub(r"\n{3,}", "\n\n", txt).strip()


def domingos_t2(t2, out):
    lines = load(t2)
    base = _salmodias_domingo_t2(lines)
    jobs = [("cuaresma", "c1", 1, ("Cuaresma", "I")), ("cuaresma", "c2", 2, ("Cuaresma", "II")), ("cuaresma", "c3", 3, ("Cuaresma", "III")),
            ("cuaresma", "c4", 4, ("Cuaresma", "IV")), ("cuaresma", "c5", 1, ("Cuaresma", "V")), ("cuaresma", "sa", 2, ("Ramos", None)),
            ("pascua", "p3", 3, ("Pascua", "III")), ("pascua", "p4", 4, ("Pascua", "IV")), ("pascua", "p5", 1, ("Pascua", "V")),
            ("pascua", "p6", 2, ("Pascua", "VI")), ("pascua", "p7", 3, ("Pascua", "VII"))]
    n = 0
    for carp, arch, w, tgt in jobs:
        f = os.path.join(out, carp, arch + ".json")
        data = json.load(open(f, encoding="utf-8"))
        dom = data["dom"]
        for hora in ("visperas1", "laudes", "visperas2", "oficio"):
            if hora not in dom or hora not in base[w] or not base[w][hora].strip():
                continue
            texto = construir_domingo(base[w][hora], tgt)
            if "Salmo" not in texto and "Cántico" not in texto:
                print("AVISO sin salmos", arch, hora)
                continue
            h = [x for x in dom[hora] if x["tipo"] not in ("salmodia", "salmodia_ref")]
            i = next((k for k, x in enumerate(h) if x["tipo"] == "himno"), -1) + 1
            h.insert(i, {"tipo": "salmodia", "texto": texto})
            dom[hora] = h
            n += 1
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("domingos con Salterio del tomo II:", n)


def domingos_adviento(t1, out):
    """Domingos de Adviento: antífonas propias de las variantes del Salterio del tomo I."""
    lines = load(t1)
    base = _salmodias_domingo_t2(lines, 24537, 38000)
    n = 0
    for w, rom in ((1, "I"), (2, "II"), (3, "III"), (4, "IV")):
        f = os.path.join(out, "adviento", "s%d.json" % w)
        data = json.load(open(f, encoding="utf-8"))
        dom = data["dom"]
        for hora in ("visperas1", "laudes", "visperas2", "oficio"):
            if hora not in dom or hora not in base[w] or not base[w][hora].strip():
                print("AVISO sin base", w, hora); continue
            texto = construir_domingo(base[w][hora], ("Adviento", rom))
            if "Salmo" not in texto and "Cántico" not in texto:
                print("AVISO sin salmos", w, hora); continue
            h = [x for x in dom[hora] if x["tipo"] not in ("salmodia", "salmodia_ref")]
            i = next((k for k, x in enumerate(h) if x["tipo"] == "himno"), -1) + 1
            h.insert(i, {"tipo": "salmodia", "texto": texto})
            dom[hora] = h
            n += 1
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("domingos de Adviento con Salterio del tomo I:", n)


if __name__ == "__main__":
    tiempo, *args = sys.argv[1:]
    if tiempo == "adviento":
        adviento(args[0], args[1])
    elif tiempo == "cuaresma":
        cuaresma(args[0], args[1])
    elif tiempo == "pascua":
        pascua(args[0], args[1])
    elif tiempo == "domingos":
        domingos_t2(args[0], args[1])
    elif tiempo == "domingos_adv":
        domingos_adviento(args[0], args[1])
    elif tiempo == "navidad":
        navidad(args[0], args[1])
        if len(args) > 2:
            resolver_navidad(os.path.join(args[1], "navidad"), args[2])
