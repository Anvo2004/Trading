import sys, json, numpy as np
sys.path.insert(0, sys.argv[1]); from eng import *
S = sys.argv[1]; SRC = sys.argv[2]; START = sys.argv[3] if len(sys.argv) > 3 else '2021-01-01'
df = load(f'{S}/data/{SRC}', START)
o, h, l, c, v = (df[k].values.astype(float) for k in ['open', 'high', 'low', 'close', 'volume'])
t = df.time.values; nym = df.nym.values; day = df.day.values; yr = df.year.values; N = len(c)
M5 = ind(o, h, l, c, v)
H1, H4, D1, M15 = htf(df, 'b_h1'), htf(df, 'b_h4'), htf(df, 'b_d1'), htf(df, 'b_m15')
close5 = t + 300
ih1, ih4, id1, im15 = mapidx(H1, close5), mapidx(H4, close5), mapidx(D1, close5), mapidx(M15, close5)
print('bars', N, 'days', len(D1['c']), df.dt.iloc[0], '->', df.dt.iloc[-1], f'{time.time()-T0:.0f}s', flush=True)
import os; COST = float(os.environ.get('COST', 0.40))
SLIP = 0.05
if 'spread' in df and os.environ.get('REALSPREAD', '1') == '1':
    COST = df['spread'].fillna(df['spread'].median()).values.astype(float) + SLIP   # spread thật của sàn tại nến vào lệnh + trượt giá
    print('Dùng spread thật: TB', round(float(COST.mean()), 3), flush=True)
g = lambda A, I, k: np.where(I >= 0, A[k][np.maximum(I, 0)], np.nan)
# xu hướng
d_c, d_e20, d_e50, d_e200 = g(D1, id1, 'c'), g(D1, id1, 'e21'), g(D1, id1, 'e50'), g(D1, id1, 'e200')
d_e20_3 = np.where(id1 >= 3, D1['e21'][np.maximum(id1 - 3, 0)], np.nan)
biasD = np.where((d_c > d_e20) & (d_e20 > d_e20_3), 1, np.where((d_c < d_e20) & (d_e20 < d_e20_3), -1, 0))
h4c, h4e50, h4e200 = g(H4, ih4, 'c'), g(H4, ih4, 'e50'), g(H4, ih4, 'e200')
trH4 = np.where((h4c > h4e50) & (h4e50 > h4e200), 1, np.where((h4c < h4e50) & (h4e50 < h4e200), -1, 0))
h1rsi, h1hist, h1atr = g(H1, ih1, 'rsi'), g(H1, ih1, 'hist'), g(H1, ih1, 'atr')
atr5 = M5['atr']; e9, e21 = M5['e9'], M5['e21']
xup = np.r_[False, (e9[1:] > e21[1:]) & (e9[:-1] <= e21[:-1])]; xdn = np.r_[False, (e9[1:] < e21[1:]) & (e9[:-1] >= e21[:-1])]
inKZ = ((nym >= 120) & (nym < 300)) | ((nym >= 420) & (nym < 600))
sess = (nym >= 120) & (nym < 660)
RES = []; ALLN = 0

def run(name, group, sig, maxhold=72, flat=990, extra=None):
    global ALLN
    sig = sorted(sig, key=lambda s: s['i'])
    tr = sim(sig, M5, COST, maxhold, flat, nym, day)
    ALLN += len(tr); RES.append(report(name, group, tr, yr, extra)); return tr

# ====================== S1: ICT Mô hình A (quét → MSS → FVG) ======================
def ictA(look=6, wait=12, disp=1.3, kz='both'):
    out = []; dk = None; lv = []; setup = None; avgb = pd.Series(np.abs(c - o)).rolling(20, min_periods=1).mean().shift(1).bfill().values
    for i in range(30, N):
        m = nym[i]
        if day[i] != dk:
            dk = day[i]; lv = []; setup = None; j = id1[i]
            if j >= 0: lv = [[D1['h'][j], 1, 0], [D1['l'][j], -1, 0]]
            aH = -1e9; aL = 1e9; lH = -1e9; lL = 1e9; aDone = lDone = False
        if 1200 <= m or m < 120 and not aDone and m >= 1080 - 1440: pass
        if m >= 1140 or (m < 0): pass
        if (m >= 1140) and not aDone: aH = max(aH, h[i]); aL = min(aL, l[i])   # phiên Á 19:00–24:00 NY
        if m < 1080 and not aDone and aH > 0: aDone = True; lv += [[aH, 1, 0], [aL, -1, 0]]
        if 120 <= m < 300: lH = max(lH, h[i]); lL = min(lL, l[i])
        if m >= 300 and m < 1080 and not lDone and lH > 0: lDone = True; lv += [[lH, 1, 0], [lL, -1, 0]]
        act = ((120 <= m < 300) or (420 <= m < 600)) if kz == 'both' else (420 <= m < 600)
        if setup:
            d = setup['d']; setup['n'] += 1; setup['ext'] = min(setup['ext'], l[i]) if d == 1 else max(setup['ext'], h[i])
            brk = c[i] > setup['mss'] if d == 1 else c[i] < setup['mss']
            if brk and abs(c[i] - o[i]) >= disp * avgb[i]:
                F = None
                for j in range(i, setup['i'], -1):
                    if d == 1 and l[j] > h[j - 2]: F = (h[j - 2], l[j]); break
                    if d == -1 and h[j] < l[j - 2]: F = (h[j], l[j - 2]); break
                if F and act:
                    e = (F[0] + F[1]) / 2; sl = setup['ext'] - d * 0.3 * atr5[i]
                    if (c[i] - e) * d > 0:
                        exp = i + 1
                        while exp < N - 1 and (((120 <= nym[exp] < 300) or (420 <= nym[exp] < 600))) and day[exp] == day[i]: exp += 1
                        out.append({'i': i, 'd': d, 'entry': e, 'sl': sl, 'kind': 'lmt', 'exp': exp, 'lvl': setup['lv']})
                setup = None
            elif setup['n'] > wait: setup = None
        for L in lv:
            if L[2]: continue
            if (h[i] > L[0]) if L[1] == 1 else (l[i] < L[0]):
                L[2] = 1
                if act and setup is None:
                    d = -L[1]; a = max(0, i - look)
                    setup = {'d': d, 'i': i, 'n': 0, 'ext': l[i] if d == 1 else h[i], 'mss': h[a:i].max() if d == 1 else l[a:i].min(), 'lv': 1}
    return out
def withTP(sig, rr, filt=lambda s: True, tag=''):
    o2 = []
    for s in sig:
        if not filt(s): continue
        r = abs(s['entry'] - s['sl']); x = dict(s); x['tp'] = s['entry'] + s['d'] * rr * r; x['tag'] = tag; o2.append(x)
    return o2

base = ictA()
for rr in (1.5, 2, 3):
    run(f'A · ICT quét→MSS→FVG, London+NY, RR {rr}', 'scalp', withTP(base, rr), extra={'k': 'ictA'})
    run(f'A · + bias D1 cùng hướng, RR {rr}', 'scalp', withTP(base, rr, lambda s: biasD[s['i']] == s['d']), extra={'k': 'ictA'})
    run(f'A · + bias D1 + xu hướng H4 cùng hướng, RR {rr}', 'scalp', withTP(base, rr, lambda s: biasD[s['i']] == s['d'] and trH4[s['i']] == s['d']), extra={'k': 'ictA'})

# ====================== S2: EMA9/21 tại vùng S/R (video @dailymarketgold) ======================
def emaSR(SW=12, touch=2, wait=24):
    out = []; sw = []; tch = None; dk = None
    for i in range(2 * SW + 1, N):
        if day[i] != dk: dk = day[i]; tch = None; j = id1[i]; lv = [(D1['h'][j], 'PDH'), (D1['l'][j], 'PDL')] if j >= 0 else []
        cc = i - SW; seg_h = h[cc - SW:cc + SW + 1]; seg_l = l[cc - SW:cc + SW + 1]
        if h[cc] == seg_h.max() and (seg_h == h[cc]).sum() == 1: sw.append((h[cc], t[cc]))
        if l[cc] == seg_l.min() and (seg_l == l[cc]).sum() == 1: sw.append((l[cc], t[cc]))
        if len(sw) > 80: sw = [x for x in sw if t[i] - x[1] < 3 * 86400]
        tol = 0.4 * atr5[i]
        if tch:
            d = tch['d']; tch['n'] += 1; tch['ext'] = min(tch['ext'], l[i]) if d == 1 else max(tch['ext'], h[i])
            brk = c[i] < tch['L'] - atr5[i] if d == 1 else c[i] > tch['L'] + atr5[i]
            cross = xup[i] if d == 1 else xdn[i]
            if brk or tch['n'] > wait or not sess[i]: tch = None
            elif cross and (c[i] - tch['L']) * d > 0:
                a = max(0, tch['i'] - 96); mid = (h[a:tch['i'] + 1].max() + l[a:tch['i'] + 1].min()) / 2
                sl = tch['ext'] - d * 0.3 * atr5[i]
                out.append({'i': i, 'd': d, 'entry': c[i], 'sl': sl, 'kind': 'mkt', 'fib': (c[i] < mid) if d == 1 else (c[i] > mid), 'nt': tch['nt']})
                tch = None
        if tch is None and sess[i]:
            best = None; pc = c[i - 1]
            cand = [(p, sum(1 for q, _ in sw if abs(q - p) <= 1.5 * tol)) for p, _ in sw] + [(p, 9) for p, _ in lv]
            for p, nt in cand:
                if nt < touch: continue
                if pc > p and l[i] <= p + tol: dd = pc - p; best = (p, 1, nt) if best is None or dd < abs(pc - best[0]) else best
                if pc < p and h[i] >= p - tol: dd = p - pc; best = (p, -1, nt) if best is None or dd < abs(pc - best[0]) else best
            if best: tch = {'L': best[0], 'd': best[1], 'nt': best[2], 'i': i, 'n': 0, 'ext': l[i] if best[1] == 1 else h[i]}
    return out
b2 = emaSR()
for rr in (1.5, 2):
    run(f'B · EMA9/21 tại vùng S/R (bước 1+2), RR {rr}', 'scalp', withTP(b2, rr), extra={'k': 'emaSR'})
    run(f'B · đủ 3 bước video (+Fibo 50%), RR {rr}', 'scalp', withTP(b2, rr, lambda s: s['fib']), extra={'k': 'emaSR'})
    run(f'B · 3 bước + xu hướng H4 cùng hướng, RR {rr}', 'scalp', withTP(b2, rr, lambda s: s['fib'] and trH4[s['i']] == s['d']), extra={'k': 'emaSR'})
    run(f'B · bước 1+2 + xu hướng H4 + bias D1, RR {rr}', 'scalp', withTP(b2, rr, lambda s: trH4[s['i']] == s['d'] and biasD[s['i']] == s['d']), extra={'k': 'emaSR'})

# ====================== S3: Thuận xu hướng H4, hồi RSI H1, vào M5 khi EMA9 cắt EMA21 ======================
def pull(rsi_lo=45, need_macd=False):
    out = []; rmin = pd.Series(h1rsi).rolling(48, min_periods=1).min().values; rmax = pd.Series(h1rsi).rolling(48, min_periods=1).max().values
    for i in np.where((xup | xdn) & sess)[0]:
        d = 1 if xup[i] else -1
        if trH4[i] != d: continue
        if d == 1 and not rmin[i] < rsi_lo: continue
        if d == -1 and not rmax[i] > 100 - rsi_lo: continue
        if need_macd and np.sign(M5['hist'][i]) != d: continue
        a = max(0, i - 12); sl = (l[a:i + 1].min() if d == 1 else h[a:i + 1].max()) - d * 0.2 * atr5[i]
        if abs(c[i] - sl) < 0.5 * atr5[i]: continue
        out.append({'i': i, 'd': d, 'entry': c[i], 'sl': sl, 'kind': 'mkt'})
    return out
for lo in (40, 45):
    for mac in (False, True):
        p3 = pull(lo, mac)
        for rr in (1.5, 2, 3):
            run(f'C · Xu hướng H4 + hồi RSI H1<{lo} + EMA9×21 M5{" + MACD M5" if mac else ""}, RR {rr}', 'scalp', withTP(p3, rr), extra={'k': 'pull'})

# ====================== S4: MACD M15 cắt + RSI>50 thuận xu hướng H4 ======================
def macd15(rr_atr=1.5):
    out = []; new15 = np.r_[False, im15[1:] != im15[:-1]]
    hi, ri, ai = M15['hist'], M15['rsi'], M15['atr']
    for i in np.where(new15 & sess)[0]:
        j = im15[i]
        if j < 2: continue
        d = 1 if (hi[j] > 0 and hi[j - 1] <= 0) else -1 if (hi[j] < 0 and hi[j - 1] >= 0) else 0
        if not d or trH4[i] != d or (ri[j] - 50) * d <= 0: continue
        out.append({'i': i, 'd': d, 'entry': c[i], 'sl': c[i] - d * rr_atr * ai[j], 'kind': 'mkt'})
    return out
for k in (1.0, 1.5):
    p4 = macd15(k)
    for rr in (1.5, 2, 3):
        run(f'D · MACD M15 cắt + RSI M15 thuận H4, SL {k}×ATR M15, RR {rr}', 'scalp', withTP(p4, rr), extra={'k': 'macd15'})

# ====================== S5: Phá range phiên Á trong London ======================
def asiaBO(sl_mode='mid'):
    out = []; dk = None
    for i in range(N):
        if day[i] != dk: dk = day[i]; aH = -1e9; aL = 1e9; done = False
        m = nym[i]
        if m >= 1140 or m < 120: aH = max(aH, h[i]); aL = min(aL, l[i]); continue
        if done or not (120 <= m < 300) or aH < 0: continue
        d = 1 if c[i] > aH else -1 if c[i] < aL else 0
        if not d: continue
        done = True
        sl = (aH + aL) / 2 if sl_mode == 'mid' else (aL if d == 1 else aH)
        if (aH - aL) > 3 * h1atr[i]: continue
        out.append({'i': i, 'd': d, 'entry': c[i], 'sl': sl, 'kind': 'mkt'})
    return out
for mode in ('mid', 'opp'):
    p5 = asiaBO(mode)
    for rr in (1, 1.5, 2):
        run(f'E · Phá range Á đầu London, SL {"giữa range" if mode == "mid" else "biên đối diện"}, RR {rr}', 'scalp', withTP(p5, rr), extra={'k': 'asia'})
        run(f'E · Phá range Á + thuận H4, SL {"giữa range" if mode == "mid" else "biên đối diện"}, RR {rr}', 'scalp', withTP(p5, rr, lambda s: trH4[s['i']] == s['d']), extra={'k': 'asia'})

# ====================== SWING (giữ 3–5 ngày): xu hướng D1 → kiểm tra H4 → vào H1 ======================
A1 = H1; n1 = len(A1['c']); t1 = A1['end']; SWAP = float(os.environ.get('SWAP', 0.5))   # $/oz mỗi đêm (ước tính thận trọng; tài khoản swap-free = 0)
id1h = np.searchsorted(D1['end'], t1, side='right') - 1; ih4h = np.searchsorted(H4['end'], t1, side='right') - 1
yr1 = pd.to_datetime(t1, unit='s').year.values
gD = lambda k: np.where(id1h >= 0, D1[k][np.maximum(id1h, 0)], np.nan); gH4 = lambda k: np.where(ih4h >= 0, H4[k][np.maximum(ih4h, 0)], np.nan)
trD = np.where((gD('c') > gD('e50')) & (gD('e50') > gD('e200')), 1, np.where((gD('c') < gD('e50')) & (gD('e50') < gD('e200')), -1, 0))
h4r = gH4('rsi'); h4rmin = pd.Series(h4r).rolling(24, min_periods=1).min().values; h4rmax = pd.Series(h4r).rolling(24, min_periods=1).max().values
mx = np.r_[False, (A1['hist'][1:] > 0) & (A1['hist'][:-1] <= 0)]; mxd = np.r_[False, (A1['hist'][1:] < 0) & (A1['hist'][:-1] >= 0)]
ex1 = np.r_[False, (A1['e9'][1:] > A1['e21'][1:]) & (A1['e9'][:-1] <= A1['e21'][:-1])]; ex1d = np.r_[False, (A1['e9'][1:] < A1['e21'][1:]) & (A1['e9'][:-1] >= A1['e21'][:-1])]
datr = gD('atr')
def runS(name, sig, maxhold=120, extra=None):
    global ALLN
    c1 = COST[A1['i1']] if isinstance(COST, np.ndarray) else COST
    tr = sim(sorted(sig, key=lambda s: s['i']), A1, c1, maxhold, T=A1['end'], swap=SWAP)
    ALLN += len(tr); RES.append(report(name, 'swing', tr, yr1, extra)); return tr
def swingSig(trig='macd', lo=40, sl_mode='swing', rr=2):
    out = []
    for i in range(30, n1):
        up = mx[i] if trig == 'macd' else ex1[i]; dn = mxd[i] if trig == 'macd' else ex1d[i]
        d = 1 if up else -1 if dn else 0
        if not d or trD[i] != d: continue
        if d == 1 and not h4rmin[i] < lo: continue
        if d == -1 and not h4rmax[i] > 100 - lo: continue
        e = A1['c'][i]
        if sl_mode == 'swing': a = max(0, i - 24); sl = (A1['l'][a:i + 1].min() if d == 1 else A1['h'][a:i + 1].max()) - d * 0.3 * A1['atr'][i]
        else: sl = e - d * 1.0 * datr[i]
        r = abs(e - sl)
        if r < 0.3 * A1['atr'][i]: continue
        out.append({'i': i, 'd': d, 'entry': e, 'sl': sl, 'tp': e + d * rr * r, 'kind': 'mkt'})
    return out
for trig in ('macd', 'ema'):
    for lo in (40, 45):
        for slm in ('swing', 'atr'):
            for rr in (1.5, 2, 3):
                runS(f'W · D1 xu hướng + RSI H4 hồi <{lo} + {"MACD" if trig == "macd" else "EMA9×21"} H1, SL {"đáy/đỉnh 24 nến H1" if slm == "swing" else "1×ATR D1"}, RR {rr}', swingSig(trig, lo, slm, rr), extra={'k': 'swing'})

print('TOTAL TRADES', ALLN, f'{time.time()-T0:.0f}s')
# trạng thái hiện tại
def snap(A, nm):
    i = len(A['c']) - 1
    return {'tf': nm, 'c': round(A['c'][i], 2), 'e9': round(A['e9'][i], 2), 'e21': round(A['e21'][i], 2), 'e50': round(A['e50'][i], 2), 'e200': round(A['e200'][i], 2), 'rsi': round(A['rsi'][i], 1), 'macd': round(A['macd'][i], 2), 'sig': round(A['sig'][i], 2), 'hist': round(A['hist'][i], 2), 'hist_prev': round(A['hist'][i - 1], 2), 'atr': round(A['atr'][i], 2), 'v': float(A['v'][i]), 'vma': float(A['vma'][i])}
json.dump({'src': SRC, 'from': str(df.dt.iloc[0]), 'to': str(df.dt.iloc[-1]), 'total': ALLN, 'res': RES, 'now': [snap(D1, 'D1'), snap(H4, 'H4'), snap(H1, 'H1'), snap(M15, 'M15'), snap(M5, 'M5')]}, open(f'{S}/res_{SRC}.json', 'w', encoding='utf-8'), ensure_ascii=False, default=float)
