"""Extracción de entradas del Propio de los Santos (tomos I-IV)."""
import re, sys
sys.path.insert(0, '.')
from parse_tiempos import load
U = '/root/.claude/uploads/19c38203-b726-5d81-a8de-3b9b7c6bd8e2/'
T = {1: U+'ddef3e6e-1791955206320_liturgia-de-las-horas1.txt', 2: U+'9d39bb22-1791955206321_liturgia-de-las-horas2.txt',
     3: U+'f4bd185d-1791955206320_liturgia-de-las-horas3.txt', 4: U+'23de672b-1791955206319_liturgia-de-las-horas4.txt'}
REG = {1: (42466, 47079), 2: (64533, None), 3: (64134, None), 4: (56270, None)}
MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
DATE = re.compile(r'^(\d{1,2}) de (%s)\s*$' % '|'.join(MES))
TITULO2 = re.compile(r'^(SAN|SANTA|SANTO|SANTOS|BEATO|BEATA|BEATOS|BEATAS)\b[A-ZÁÉÍÓÚÑ ,.()ÜI-]+$')
RANKS = {'Solemnidad': 'S', 'Fiesta': 'F', 'Memoria': 'M', 'Memoria obligatoria': 'M', 'Memoria libre': 'L'}


def entradas(t):
    """-> lista de dicts {tomo, mmdd, titulo, rango_libro, lineas(sin cabecera), alternos:[...]}"""
    L = load(T[t])
    s, e = REG[t]
    if e is None:
        e = next(i for i, l in L if i > s and l.strip() == 'OFICIOS COMUNES')
    idx = [n for n, (i, l) in enumerate(L) if s <= i <= e and DATE.match(l.strip())]
    fin = len([1 for (j, _) in L if j <= e])
    res = []
    for k, n in enumerate(idx):
        nxt = idx[k + 1] if k + 1 < len(idx) else fin
        blk = [l for _, l in L[n:nxt]]
        m = DATE.match(blk[0].strip())
        dia, mes = int(m.group(1)), MES.index(m.group(2)) + 1
        # título: primera línea no vacía; puede continuar en la siguiente si termina sin rango
        j = 1
        while j < len(blk) and not blk[j].strip():
            j += 1
        tit = [blk[j].strip()]
        j += 1
        while j < len(blk) and blk[j].strip() and re.match(r'^[A-ZÁÉÍÓÚÑ ,.()ÜI-]+$', blk[j].strip()) and blk[j].strip() not in RANKS:
            tit.append(blk[j].strip()); j += 1
        titulo = ' '.join(tit)
        rango = None
        while j < len(blk) and not blk[j].strip():
            j += 1
        if j < len(blk) and blk[j].strip() in RANKS:
            rango = RANKS[blk[j].strip()]; j += 1
        res.append({'tomo': t, 'mmdd': '%02d-%02d' % (mes, dia), 'titulo': titulo, 'rango_libro': rango, 'lineas': blk[j:], 'linea0': L[n][0]})
    return res


def dump():
    import os
    os.makedirs('/tmp/santos_txt', exist_ok=True)
    for t in (1, 2, 3, 4):
        for en in entradas(t):
            open('/tmp/santos_txt/t%d_%s.txt' % (t, en['mmdd']), 'w').write(
                '%s | %s | %s\n' % (en['mmdd'], en['titulo'], en['rango_libro']) + '\n'.join(en['lineas']))
if __name__ == '__main__':
    dump()
    import glob
    print(len(glob.glob('/tmp/santos_txt/*')))
