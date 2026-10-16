import json,glob,re,sys
d=sys.argv[1]
bad=[]
for f in sorted(glob.glob(d+'/*.json')):
    mm=f.split('/')[-1][:2]
    for dd,e in json.load(open(f)).items():
        H=e['horas']; probs=[]
        if e['rango']=='M':
            if 'oficio' not in H or not any(x['tipo']=='lectura2' for x in H['oficio']): probs.append('sin lectura2')
            if not e['oracion']: probs.append('sin oracion')
        else:
            for hr in ('visperas1','oficio','laudes','visperas2'):
                if hr=='visperas1' and hr not in H: continue
                h=H.get(hr)
                if h is None: probs.append(hr+':FALTA'); continue
                tp={x['tipo']:x for x in h}
                need=['himno','salmodia','lectura1','lectura2','responsorio','te_deum','oracion'] if hr=='oficio' else ['himno','salmodia','lectura_breve','responsorio_breve','cantico_evangelico','preces','oracion']
                for n in need:
                    if n not in tp: probs.append(hr+':sin '+n)
                s=tp.get('salmodia')
                if s and not re.search(r'^(Salmo|Cántico)\b',s['texto'],re.M): probs.append(hr+':salmodia sin salmos')
                if s and len(re.findall(r'^(?:Salmo|Cántico)\b',s['texto'],re.M))<3: probs.append(hr+':<3 salmos(%d)'%len(re.findall(r'^(?:Salmo|Cántico)\b',s['texto'],re.M)))
                hm=tp.get('himno')
                if hm and hm['texto'].startswith('@ref'): probs.append(hr+':himno @ref')
                for x in h:
                    if 'Común' in x.get('texto','') and x['tipo'] in('salmodia','himno'): probs.append(hr+':queda "Común" en '+x['tipo'])
            if not H.get('intermedia'): probs.append('intermedia FALTA')
            if 'invitatorio' not in H: probs.append('invitatorio FALTA')
        if probs: bad.append((mm+'-'+dd,e['titulo'][:28],probs))
for b in bad: print(b)
print(len(bad))
