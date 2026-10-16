#!/usr/bin/env python3
"""Propio de los Santos -> data/santos/{comunes,t1..t4}.json + js/santos-indice.js
Uso: python3 -I parse_santos.py <ruta>/liturgia-horas
(las rutas de los tomos están en santos_lib.py: ajústalas o pásalas por variables de entorno)"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parse_tiempos as PT
from santos_lib import T, entradas, load

COMUNES = {  # clave: (inicio, fin) en el tomo IV
    "dedicacion": (74208, 75315), "maria": (75316, 77485), "apostoles": (77486, 78286),
    "martires_varios": (78287, 79284), "martires_uno": (79285, 80295), "pastores": (80296, 81419),
    "doctores": (81420, 81829), "virgenes": (81830, 82775), "varones": (82776, 83860), "mujeres": (83861, 85090),
}


def prep(lines):
    """Normaliza remisiones para que parse_hour las reconozca."""
    out = []
    for l in lines:
        s = l.strip()
        m = re.match(r"^HIMNO,?\s+(como|del|de la|de los)\b(.*)$", s, re.I)
        if m:
            out.append("HIMNO"); out.append("@ref " + s[len("HIMNO"):].lstrip(", ").strip()); continue
        if s in ("Tercia", "Sexta", "Nona"):
            out.append(s.upper()); continue
        if re.match(r"^(La )?[Oo]ración( conclusiva)? como en( las| los)? (Laudes|Vísperas)\.?\s*$", s):
            out.append("Oración como en las Laudes."); continue
        out.append(l)
    return out


def comunes(out):
    L = load(T[4])
    res = {}
    for k, (a, b) in COMUNES.items():
        bl = prep([l for (i, l) in L if a <= i <= b])
        h = PT.parse_block(bl)
        res[k] = h
        print("común", k, {x: (len(v) if isinstance(v, list) else list(v)) for x, v in h.items()})
    return res



CAB = re.compile(r"^(I vísperas|II vísperas|Vísperas|Invitatorio|Oficio de lectura|Laudes|Hora intermedia)\s*$", re.I)


def cortar_alternos(lines):
    """Quita santos alternativos (segundo título en mayúsculas tras la oración del primero)."""
    from santos_lib import TITULO2
    en_lec, visto = False, False
    for n, l in enumerate(lines):
        s = l.strip()
        if re.match(r"^El mismo día \d+ de ", s) and n > 0:
            return lines[:n]
        if s in ("PRIMERA LECTURA", "SEGUNDA LECTURA", "TERCERA LECTURA"):
            en_lec = True; visto = True
        elif re.match(r"^Responsorio\b", s) or s in ("Oración", "HIMNO Te Deum."):
            en_lec = False
        elif visto and not en_lec and TITULO2.match(s) and n > 0 and not lines[n - 1].strip():
            return lines[:n]
    return lines


def parsear_entrada(en):
    lines = cortar_alternos(en["lineas"])
    # cabecera: hasta la primera marca de hora
    cab = []
    for l in lines:
        if CAB.match(l.strip()) or l.strip() == "SEGUNDA LECTURA":
            break
        cab.append(l)
    cab = [l.strip() for l in cab if l.strip()]
    h = PT.parse_block(prep(lines))
    return cab, h

import santos_tabla as TAB

KEYS = {"apóstoles": "apostoles", "apostoles": "apostoles", "santa maría": "maria", "santísima virgen": "maria",
        "un mártir": "martires_uno", "varios mártires": "martires_varios", "mártires": "martires_varios",
        "santos varones": "varones", "santas mujeres": "mujeres", "dedicación": "dedicacion",
        "pastores": "pastores", "doctores": "doctores", "vírgenes": "virgenes"}
HORAS = ("visperas1", "invitatorio", "oficio", "laudes", "intermedia", "visperas2")
BASE = {}


def sal_dom(base, w, hora):
    s = json.load(open(os.path.join(base, "salterio", "semana%d.json" % w), encoding="utf-8"))
    for x in s["dom"][hora]:
        if x["tipo"] == "salmodia":
            return x["texto"]
    return None


def get(h, tipo):
    for x in (h or []):
        if x["tipo"] == tipo:
            return x
    return None


def resolver_salmodia(x, hora, K, kdef, base):
    """x: sección salmodia de la entrada (se modifica)."""
    t = x["texto"]
    if re.search(r"^(Salmo|Cántico) ", t, re.M):
        return True
    horaS = {"visperas1": "visperas1", "visperas2": "visperas2", "laudes": "laudes", "oficio": "oficio"}.get(hora)
    m = re.search(r"domingo de la (IV|III|II|I) semana del Salterio", t, re.I) or re.search(r"[Dd]omingo[^.]*?(IV|III|II|I) (?:del )?Salterio", t)
    if not m:
        m = re.search(r"domingo[^.]*?semana (IV|III|II|I)\b", t, re.I) or re.search(r"domingo I\b", t)
    if m and horaS:
        w = PT.ROM.get(m.group(1), 1) if m.groups() and m.group(1) else 1
        b = sal_dom(base, w, horaS)
        if b:
            x["texto"] = PT.mezclar_antifonas(t, b); return True
    kk = kdef
    mm = re.search(r"Común de (?:los |las |un |una |santa |santísima |la )?([A-Za-záéíóúñ ]+)", t, re.I)
    if mm:
        w0 = mm.group(1).lower()
        for pat, key in KEYS.items():
            if pat in w0 or pat in t.lower():
                kk = key; break
    if kk and horaS and kk in K:
        s = get(K[kk].get(hora), "salmodia")
        if s:
            x["texto"] = PT.mezclar_antifonas(t, s["texto"]); return True
    return False


def resolver_himnos(c):
    for hr, h in c.items():
        if not isinstance(h, list):
            continue
        x = get(h, "himno")
        if x and x["texto"].startswith("@ref"):
            ref = x["texto"]
            alt = re.split(r"\n\s*O bien:\s*\n", ref, maxsplit=1)
            src = get(c.get("visperas2"), "himno") if re.search(r"II v[ií]speras", ref, re.I) and hr != "visperas2" else None
            if src and not src["texto"].startswith("@ref"):
                x["texto"] = src["texto"]
            elif len(alt) == 2 and len(alt[1].strip()) > 40:
                x["texto"] = alt[1].strip()
            else:
                h.remove(x)


def resolver_comunes(K, base):
    """Los salmos de Laudes/oficio de los Comunes remiten al Salterio: se expanden."""
    for k, c in K.items():
        resolver_himnos(c)
    for k, c in K.items():
        for hora, h in c.items():
            if isinstance(h, list):
                x = get(h, "salmodia")
                if x:
                    resolver_salmodia(x, hora, K, None, base)


def partir_versiculo(h):
    out = []
    for x in h:
        if x["tipo"] == "salmodia":
            m = re.search(r"\n(V\. [^\n]+\nR\. [^\n]+)\s*$", x["texto"])
            if m:
                x["texto"] = x["texto"][:m.start()].rstrip()
                out.append(x); out.append({"tipo": "versiculo", "texto": m.group(1)}); continue
        out.append(x)
    return out


def mixto(t):
    t = t.strip()
    small = {"de", "del", "la", "las", "los", "el", "y", "e", "o", "a", "en", "con", "para", "por", "al"}
    roles = {"obispo", "obispos", "presbítero", "presbíteros", "mártir", "mártires", "doctor", "doctora", "virgen", "religioso",
             "religiosa", "papa", "apóstol", "apóstoles", "evangelista", "diácono", "abad", "monje", "patrono", "patrona",
             "compañeros", "esposo", "padres", "protomártir", "laico", "madre", "reina", "fundadores", "ermitaño",
             "patronos", "padre", "iglesia", "iglesias", "orden", "siervos", "labrador", "obrero", "santos", "santo", "san",
             "santa", "beato", "beata"}
    out = []
    for i, w in enumerate(re.split(r"(\s+)", t.lower())):
        if not w.strip():
            out.append(w); continue
        core = re.sub(r"^[(,]+|[),.]+$", "", w)
        if i == 0 or (core not in small and core not in roles):
            w = re.sub(r"[a-záéíóúñü]", lambda m: m.group(0).upper(), w, count=1)
        if core == "iglesia":
            w = w.replace("iglesia", "Iglesia")
        out.append(w)
    return "".join(out)


def puntaje(h):
    n = 0
    for hr, v in h.items():
        if isinstance(v, dict):
            for z in v.values():
                n += sum(len(x.get("texto", "")) for x in z)
        else:
            n += sum(len(x.get("texto", "")) for x in v)
    return n


def armar(en, cab, h, rango, K, kdef, base):
    # visperas -> visperas2
    if "visperas" in h:
        h["visperas2"] = h.pop("visperas")
    cab2 = [l for l in cab if not re.match(r"^(Los himnos latinos|En el tiempo de|Para la conmemoración|Del Común|Común|O bien)", l)]
    comun = next((l for l in cab if re.match(r"^(Del Común|Común)", l)), "")
    d = {"titulo": mixto(en["titulo"]), "rango": rango, "semblanza": " ".join(cab2), "comun": comun, "horas": {}}
    def limpiar(v):
        for x in (v if isinstance(v, list) else []):
            if x["tipo"] == "cantico_evangelico":
                t = re.sub(r"\n?PRECES\b.*$", "", x["texto"], flags=re.S).strip()
                x["texto"] = re.sub(r"\n+(Benedictus|Magn[ií]ficat)\s*$", "", t).strip()
    for hr in HORAS:
        v = h.get(hr)
        if v is None:
            continue
        limpiar(v)
        if isinstance(v, dict):
            d["horas"][hr] = v
        else:
            d["horas"][hr] = partir_versiculo(v)
    return d


def memoria(d):
    H = d["horas"]
    orac = None
    for hr in ("laudes", "oficio", "visperas2"):
        x = get(H.get(hr), "oracion")
        if x and x["texto"]:
            orac = x; break
    m = {"titulo": d["titulo"], "rango": "M", "semblanza": d["semblanza"], "comun": d["comun"], "horas": {}}
    of = [x for x in H.get("oficio", []) if x["tipo"] in ("lectura2", "responsorio")]
    if of:
        m["horas"]["oficio"] = of
    for hr in ("laudes", "visperas2"):
        c = get(H.get(hr), "cantico_evangelico")
        if c:
            m["horas"][hr] = [c]
    m["oracion"] = orac["texto"] if orac else ""
    return m


def completar(d, K, kdef, base):
    """Fiesta/solemnidad: rellena con el Común lo que la entrada no trae."""
    H = d["horas"]
    kc = K.get(kdef) if kdef else None
    # himnos "como en ..."
    for hr in HORAS:
        h = H.get(hr)
        if not isinstance(h, list):
            continue
        x = get(h, "himno")
        if x and x["texto"].startswith("@ref"):
            ref = x["texto"]
            src = None
            if re.search(r"II Vísperas", ref, re.I) and hr != "visperas2":
                src = get(H.get("visperas2"), "himno")
            elif re.search(r"I Vísperas", ref, re.I) and hr == "visperas2":
                src = get(H.get("visperas1"), "himno")
            alt = re.split(r"\n\s*O bien:\s*\n", ref, maxsplit=1)
            if src and not src["texto"].startswith("@ref"):
                x["texto"] = src["texto"]
            elif len(alt) == 2 and len(alt[1].strip()) > 40:
                x["texto"] = alt[1].strip()
            else:
                h.remove(x)   # se cae al himno del Común / de la feria
    # salmodia
    for hr in ("visperas1", "laudes", "visperas2", "oficio"):
        h = H.get(hr)
        if isinstance(h, list):
            x = get(h, "salmodia")
            if x:
                resolver_salmodia(x, hr, K, kdef, base)
            elif kc and get(kc.get(hr), "salmodia") and hr != "oficio":
                h.insert(0, dict(get(kc[hr], "salmodia")))
    # horas que la entrada no trae: se toman enteras del Común
    import copy
    orac_p = None
    for hr0 in ("laudes", "oficio", "visperas2"):
        x0 = get(H.get(hr0), "oracion")
        if x0 and x0["texto"]:
            orac_p = x0; break
    if kc:
        for hr in ("laudes", "visperas2"):
            if H.get(hr) is None and hr in kc:
                H[hr] = [copy.deepcopy(x) for x in kc[hr] if x["tipo"] != "oracion"]
                if orac_p:
                    H[hr].append(dict(orac_p))
        if H.get("intermedia") is None and isinstance(kc.get("intermedia"), dict):
            H["intermedia"] = copy.deepcopy(kc["intermedia"])
    # completar tipos ausentes con el Común
    orden = ["himno", "salmodia", "lectura_breve", "responsorio_breve", "cantico_evangelico", "preces", "oracion"]
    for hr in ("visperas1", "laudes", "visperas2"):
        h = H.get(hr)
        if h is None or not kc or hr not in kc:
            continue
        for tp in orden:
            if tp == "oracion":
                continue
            if not get(h, tp) and get(kc[hr], tp):
                h.append(dict(get(kc[hr], tp)))
        h.sort(key=lambda x: orden.index(x["tipo"]) if x["tipo"] in orden else 99)
    # oficio
    of = H.get("oficio")
    if of is not None:
        if not get(of, "te_deum"):
            pos = len(of) - 1 if get(of, "oracion") or get(of, "oracion_laudes") else len(of)
            of.insert(pos, {"tipo": "te_deum"})
        if kc and "oficio" in kc:
            for tp in ("himno", "salmodia"):
                if not get(of, tp) and get(kc["oficio"], tp):
                    of.insert(0, dict(get(kc["oficio"], tp)))
        x = get(of, "salmodia")
        if x:
            resolver_salmodia(x, "oficio", K, kdef, base)
        if not get(of, "lectura1") and kc and get(kc.get("oficio"), "lectura1"):
            l1 = copy.deepcopy(get(kc["oficio"], "lectura1"))
            r1 = next((copy.deepcopy(r) for r in kc["oficio"] if r["tipo"] == "responsorio"), None)
            i2 = next((i for i, y in enumerate(of) if y["tipo"] == "lectura2"), len(of))
            of[i2:i2] = [l1] + ([r1] if r1 else [])
    # intermedia
    im = H.get("intermedia")
    if isinstance(im, dict) and kc and isinstance(kc.get("intermedia"), dict):
        for sub in ("tercia", "sexta", "nona"):
            if not get(im.get(sub), "lectura_breve") and get(kc["intermedia"].get(sub), "lectura_breve"):
                im.setdefault(sub, []).insert(0, dict(get(kc["intermedia"][sub], "lectura_breve")))
    # invitatorio
    inv = H.get("invitatorio")
    if kc and (not inv) and "invitatorio" in kc:
        H["invitatorio"] = kc["invitatorio"]
    # oración de visperas/oficio "como en Laudes"
    orac = get(H.get("laudes"), "oracion")
    for hr in ("visperas1", "oficio", "visperas2"):
        h = H.get(hr)
        if isinstance(h, list) and not get(h, "oracion"):
            x = get(h, "oracion_laudes")
            if x:
                h.remove(x)
            if orac:
                h.append(dict(orac))
    # intermedia: las referencias oracion_laudes las resuelve la app
    return d


SOLEMNIDADES_TO = [("trinidad", "La Santísima Trinidad", 34788, 35791), ("corpus", "El Santísimo Cuerpo y Sangre de Cristo", 35792, 36936),
                   ("corazon", "El Sagrado Corazón de Jesús", 36937, 37856)]


def difuntos(base, K):
    """Oficio de difuntos (tomo IV 85692-87164) + 2 lectura propia del 2 de noviembre."""
    L = load(T[4])
    h = PT.parse_block(prep([l for (i, l) in L if 85692 <= i <= 87164]))
    if "visperas" in h:
        h["visperas2"] = h.pop("visperas")
    d = {"titulo": "Conmemoración de todos los fieles difuntos", "rango": "D", "comun": "",
         "semblanza": "", "nota": "Si el 2 de noviembre cae en domingo se reza el Oficio del domingo; las Laudes y las Vísperas, con participación del pueblo, pueden celebrarse de la Conmemoración de los fieles difuntos.",
         "horas": {}}
    for hr in HORAS:
        v = h.get(hr)
        if v is None:
            continue
        d["horas"][hr] = v if isinstance(v, dict) else partir_versiculo(v)
    for hr in ("laudes", "visperas2"):
        for x in d["horas"].get(hr, []):
            if x["tipo"] == "cantico_evangelico":
                x["texto"] = re.sub(r"\n?PRECES\b.*$", "", x["texto"], flags=re.S).strip()
                x["texto"] = re.sub(r"\n+(Benedictus|Magn[ií]ficat)\s*$", "", x["texto"]).strip()
    # Oficio: segunda lectura propia del día (san Ambrosio)
    en = [e for e in entradas(4) if e["mmdd"] == "11-02"][0]
    ls = [l.rstrip() for l in en["lineas"]]
    i2 = next(i for i, l in enumerate(ls) if l.strip() == "SEGUNDA LECTURA")
    ir = next(i for i, l in enumerate(ls) if l.strip().startswith("Responsorio") and i > i2)
    io = next(i for i, l in enumerate(ls) if l.strip() == "Oración" and i > ir)
    lec = "\n".join(ls[i2 + 1:ir]).strip()
    lec = re.sub(r"\n{3,}", "\n\n", lec)
    rr = ls[ir:io]
    ref = rr[0].strip()[len("Responsorio"):].strip()
    resp = re.sub(r"\s+", " ", " ".join(rr[1:]))
    resp = re.sub(r"\s*\bV\.\s*", "\nV. ", resp.strip()); resp = re.sub(r"\s*\bR\.\s*(?=[A-ZÁÉÍÓÚ][^\n]*$)", "\nR. ", resp)
    resp = resp.strip().lstrip("R.").strip()
    oracion = re.sub(r"\s+", " ", " ".join(l for l in ls[io + 1:] if l.strip() and not l.startswith("Completas"))).strip()
    of = d["horas"]["oficio"]
    k2 = next(i for i, x in enumerate(of) if x["tipo"] == "lectura2")
    # quita la lectura 2 genérica y sus responsorios
    of[:] = [x for j, x in enumerate(of) if not (j >= k2 and x["tipo"] in ("lectura2", "responsorio"))]
    n = next(i for i, x in enumerate(of) if x["tipo"] == "oracion")
    of.insert(n, {"tipo": "responsorio", "texto": "R. " + resp, "ref": ref})
    of.insert(n, {"tipo": "lectura2", "texto": lec})
    of[n + 2]["texto"] = oracion
    return d


def solemnidades_to(base, K):
    L = load(T[3])
    res = {}
    for k, tit, a, b in SOLEMNIDADES_TO:
        bl = prep([l for (i, l) in L if a <= i <= b])
        h = PT.parse_block(bl)
        if "visperas" in h:
            h["visperas2"] = h.pop("visperas")
        d = {"titulo": tit, "rango": "S", "semblanza": "", "comun": "", "horas": {}}
        for hr in HORAS:
            v = h.get(hr)
            if v is None:
                continue
            d["horas"][hr] = v if isinstance(v, dict) else partir_versiculo(v)
        for x in d["horas"].get("visperas1", []) + d["horas"].get("visperas2", []):
            if x["tipo"] == "cantico_evangelico":
                x["texto"] = re.sub(r"\n?PRECES\b.*$", "", x["texto"], flags=re.S).strip()
        res[k] = completar(d, K, None, base)
    return res


if __name__ == "__main__":
    base_dir = sys.argv[1]
    base = os.path.join(base_dir, "data")
    d = os.path.join(base, "santos")
    os.makedirs(d, exist_ok=True)
    K = comunes(d)
    resolver_comunes(K, base)
    # elegir la mejor versión de cada fecha
    mejor = {}
    for t in (1, 2, 3, 4):
        for en in entradas(t):
            cab, h = parsear_entrada(en)
            sc = puntaje(h)
            if en["mmdd"] not in mejor or sc > mejor[en["mmdd"]][0]:
                mejor[en["mmdd"]] = (sc, en, cab, h)
    rango = {}
    for k in TAB.S: rango[k] = "S"
    for k in TAB.F: rango[k] = "F"
    for k in TAB.M: rango[k] = "M"
    meses = {}
    indice = {}
    for mmdd in sorted(rango):
        sc, en, cab, h = mejor[mmdd]
        dd = armar(en, cab, h, rango[mmdd], K, TAB.COMUN.get(mmdd), base)
        if mmdd in TAB.TITULOS:
            dd["titulo"] = TAB.TITULOS[mmdd]
        if mmdd in TAB.NOTAS:
            dd["nota"] = TAB.NOTAS[mmdd]
        if rango[mmdd] in ("S", "F"):
            dd = completar(dd, K, TAB.COMUN.get(mmdd), base)
        else:
            dd = memoria(dd)
        meses.setdefault(mmdd[:2], {})[mmdd[3:]] = dd
        indice[mmdd] = [rango[mmdd], dd["titulo"], "I" if "visperas1" in dd["horas"] else ""]
    dif = difuntos(base, K)
    meses.setdefault("11", {})["02"] = dif
    indice["11-02"] = ["D", dif["titulo"], ""]
    to = solemnidades_to(base, K)
    json.dump(to, open(os.path.join(d, "to.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k, v in to.items():
        indice["to:" + k] = ["S", v["titulo"], "I" if "visperas1" in v["horas"] else ""]
    for mm, v in meses.items():
        json.dump(v, open(os.path.join(d, mm + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(base_dir, "js", "santos-indice.js"), "w", encoding="utf-8").write(
        "window.SANTOS_IDX = " + json.dumps(indice, ensure_ascii=False, indent=0) + ";\n")
    print("santos:", len(indice), "archivos:", sorted(meses))
