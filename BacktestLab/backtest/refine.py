"""Tinh chỉnh ĐIỂM VÀO bằng M15/M5 cho phương pháp swing H1 (dữ liệu tick Exness, spread thật).
Tín hiệu gốc: D1 xu hướng → RSI H4 hồi → RSI H1 cắt 50 (+ nến H4 cùng phía EMA21 H4). Gốc vào market ở giá đóng nến H1, SL 1×ATR D1, TP 2R.
Sau tín hiệu, thử nhiều cách vào ở khung nhỏ trong W giờ; quản lý lệnh trên từng nến M5 (SL trước nếu cùng nến).
Dùng: python refine.py <M5 csv> <json ra>
"""
import sys, os, json, itertools, time
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eng import load, htf
sys.stdout.reconfigure(encoding='utf-8')
T0 = time.time(); SRC, OUT = sys.argv[1], sys.argv[2]
SWAP, SLIP = 0.5, 0.05
df = load(SRC, '2020-01-01'); df['b_m5'] = df['time']
H1, H4, D1, M15, M5 = (htf(df, k) for k in ('b_h1', 'b_h4', 'b_d1', 'b_m15', 'b_m5'))
mt = df['time'].values.astype(np.int64); mh, ml, mc = (df[k].values.astype(float) for k in ('high', 'low', 'close'))
msp = df['spread'].fillna(df['spread'].median()).values.astype(float)
del df
t = H1['end']; n = len(t); yr = pd.to_datetime(t - 1, unit='s').year.values; YEARS = list(range(2021, int(yr.max()) + 1))
id1 = np.searchsorted(D1['end'], t, side='right') - 1; ih4 = np.searchsorted(H4['end'], t, side='right') - 1
g = lambda X, I, k, lag=0: X[k][np.clip(I - lag, 0, None)]
dc, e50, e50_5, e200, e21d, e21d3, datr = g(D1, id1, 'c'), g(D1, id1, 'e50'), g(D1, id1, 'e50', 5), g(D1, id1, 'e200'), g(D1, id1, 'e21'), g(D1, id1, 'e21', 3), g(D1, id1, 'atr')
sgn = lambda up, dn: np.where(up, 1, np.where(dn, -1, 0))
TR = {'ema50_5': sgn((dc > e50) & (e50 > e50_5), (dc < e50) & (e50 < e50_5)), 'ema50_200': sgn((dc > e50) & (e50 > e200), (dc < e50) & (e50 < e200)), 'ema21_3': sgn((dc > e21d) & (e21d > e21d3), (dc < e21d) & (e21d < e21d3))}
h4r = pd.Series(g(H4, ih4, 'rsi')); h4c, h4e21 = g(H4, ih4, 'c'), g(H4, ih4, 'e21')
cr = lambda a, b: (np.r_[False, (a[1:] > b[1:]) & (a[:-1] <= b[:-1])], np.r_[False, (a[1:] < b[1:]) & (a[:-1] >= b[:-1])])
TRIG = {'rsi50': cr(H1['rsi'], np.full(n, 50.0)), 'ema': cr(H1['e9'], H1['e21'])}
valid = (id1 >= 200) & (ih4 >= 50) & (yr >= 2021)

def base_signals(trend='ema50_5', lo=40, win=24, trig='rsi50', h4f=True):
    tr_ = TR[trend]; mn = h4r.rolling(4 * win, min_periods=1).min().values; mx = h4r.rolling(4 * win, min_periods=1).max().values; up, dn = TRIG[trig]
    L = valid & (((tr_ == 1) & (mn < lo) & up & ((h4c > h4e21) if h4f else True)) | ((tr_ == -1) & (mx > 100 - lo) & dn & ((h4c < h4e21) if h4f else True)))
    return [{'ts': int(t[i]), 'd': int(tr_[i]), 'p0': float(H1['c'][i]), 'r0': float(datr[i]), 'y': int(yr[i])} for i in np.where(L)[0]]

# ---------- vào lệnh trên khung nhỏ ----------
LTF = {'M5': M5, 'M15': M15}
def m5_at(ts): return int(np.searchsorted(mt, ts, side='left'))           # nến M5 đầu tiên mở lúc ≥ ts
def refine(s, cfg):
    """→ (chỉ số M5 bắt đầu quản lý, giá vào, SL, TP, 'lmt'|'mkt') hoặc (None, lý do)"""
    d, p0, r0, ts = s['d'], s['p0'], s['r0'], s['ts']; sl0, tp0 = p0 - d * r0, p0 + 2 * d * r0
    kind, W = cfg['kind'], cfg.get('W', 0) * 3600
    if kind == 'market': return m5_at(ts), p0, sl0, tp0, 'mkt'
    if kind == 'delay':      # đối chứng: chỉ chờ W giờ rồi vào market (không cần tín hiệu khung nhỏ)
        i0 = m5_at(ts); i1 = m5_at(ts + W)
        for j in range(i0, i1):
            if (ml[j] <= sl0 or mh[j] >= tp0) if d == 1 else (mh[j] >= sl0 or ml[j] <= tp0): return None, 'hit_before'
        return fallback(dict(s), {'fb': 'market'}, i1)
    i0 = m5_at(ts); i1 = m5_at(ts + W)
    if kind == 'limit':
        pl = p0 - d * cfg['k'] * r0
        for j in range(i0, i1):
            if (mh[j] >= tp0) if d == 1 else (ml[j] <= tp0): return None, 'tp_first'
            if (ml[j] <= pl) if d == 1 else (mh[j] >= pl): return j, pl, sl0, tp0 if cfg['tp'] == 'orig' else pl + d * cfg['tp'] * abs(pl - sl0), 'lmt'
        return fallback(s, cfg, i1)
    A = LTF[cfg['tf']]; e = A['end']; a0 = int(np.searchsorted(e, ts, side='right')); a1 = int(np.searchsorted(e, ts + W, side='right'))
    pulled = False; ext = p0; ext_i = a0; sh = None
    for k in range(a0, min(a1, len(e))):
        h_, l_, c_ = A['h'][k], A['l'][k], A['c'][k]
        if (l_ <= sl0) if d == 1 else (h_ >= sl0): return None, 'sl_first'
        if (h_ >= tp0) if d == 1 else (l_ <= tp0): return None, 'tp_first'
        if kind == 'ema':
            if (A['e9'][k] < A['e21'][k]) if d == 1 else (A['e9'][k] > A['e21'][k]): pulled = True
            elif pulled: return entry(s, cfg, k, A, c_, ext if d == 1 else ext)
        elif kind == 'rsi':
            if (A['rsi'][k] < 40) if d == 1 else (A['rsi'][k] > 60): pulled = True
            elif pulled and ((A['rsi'][k] > 50) if d == 1 else (A['rsi'][k] < 50)): return entry(s, cfg, k, A, c_, ext)
        elif kind == 'mss':   # quét: tạo đáy mới dưới giá tín hiệu, rồi nến đóng cửa vượt đỉnh ngay trước cú quét
            if (l_ < ext) if d == 1 else (h_ > ext):
                ext, ext_i = (l_, k) if d == 1 else (h_, k); lb = max(a0 - 6, k - 6)
                sh = A['h'][lb:k].max() if d == 1 else A['l'][lb:k].min()
            elif sh is not None and abs(ext - p0) > 0.1 * r0 and ((c_ > sh) if d == 1 else (c_ < sh)): return entry(s, cfg, k, A, c_, ext)
        ext = min(ext, l_) if (d == 1 and kind != 'mss') else max(ext, h_) if (d == -1 and kind != 'mss') else ext
    return fallback(s, cfg, i1)
def entry(s, cfg, k, A, px, ext):
    d, r0, sl0, tp0 = s['d'], s['r0'], s['p0'] - s['d'] * s['r0'], s['p0'] + 2 * s['d'] * s['r0']
    if cfg['sl'] == 'orig': sl = sl0
    else:
        sl = ext - d * 0.3 * A['atr'][k]
        if abs(px - sl) < 0.2 * r0: sl = px - d * 0.2 * r0            # SL tối thiểu 0.2×ATR D1 để không bị nhiễu quét
    rk = abs(px - sl); tp = tp0 if cfg['tp'] == 'orig' else px + d * cfg['tp'] * rk
    if (tp - px) * d <= 0.3 * rk: return None, 'no_room'
    return m5_at(int(A['end'][k])), px, sl, tp, 'mkt'
def fallback(s, cfg, i1):
    if cfg['fb'] == 'skip': return None, 'no_trigger'
    if i1 >= len(mc): return None, 'end'
    d, p0, r0 = s['d'], s['p0'], s['r0']; sl0, tp0 = p0 - d * r0, p0 + 2 * d * r0; px = mc[i1 - 1]
    if (px - sl0) * d <= 0 or (tp0 - px) * d <= 0: return None, 'moved'
    return i1, px, sl0, tp0, 'mkt'

def manage(j, e, sl, tp, d, kind, s):
    """Quản lý trên M5 từ nến j (limit: nến khớp cũng kiểm tra SL). Tối đa 7 ngày tính từ lúc vào."""
    end = int(np.searchsorted(mt, mt[min(j, len(mt) - 1)] + 7 * 86400, side='left')); end = min(end, len(mt) - 1)
    st = j if kind == 'lmt' else j
    H_, L_ = mh[st:end + 1], ml[st:end + 1]
    hs = np.where(L_ <= sl)[0] if d == 1 else np.where(H_ >= sl)[0]
    ht = np.where(H_ >= tp)[0] if d == 1 else np.where(L_ <= tp)[0]
    if kind == 'lmt' and len(ht) and ht[0] == 0: ht = ht[1:]           # TP không tính trong chính nến khớp limit
    a = hs[0] if len(hs) else 10 ** 9; b = ht[0] if len(ht) else 10 ** 9
    if a == b == 10 ** 9: x, px, why = end, mc[end], 'time'
    elif a <= b: x, px, why = st + a, sl, 'SL'
    else: x, px, why = st + b, tp, 'TP'
    nights = int((mt[x] - mt[j]) // 86400); cost = msp[j] + SLIP + SWAP * nights
    pnl = (px - e) * d - cost
    return {'R': round(pnl / abs(e - sl), 3), 'Rb': round(pnl / s['r0'], 3), 'why': why, 'tx': int(mt[x]), 'te': int(mt[j]), 'e': round(e, 2), 'sl': round(sl, 2), 'tp': round(tp, 2), 'risk': round(abs(e - sl), 2)}

def run(sigs, cfg):
    out = []; miss = {}; busy = 0
    for s in sigs:
        if s['ts'] < busy: continue
        r = refine(s, cfg)
        if r[0] is None:
            miss[r[1]] = miss.get(r[1], 0) + 1
            busy = s['ts'] + cfg.get('W', 0) * 3600 if cfg['kind'] != 'market' else s['ts']; continue
        j, e, sl, tp, kind = r
        if j >= len(mt) - 2: continue
        m = manage(j, e, sl, tp, s['d'], kind, s); m.update(d=s['d'], y=s['y'], ts=s['ts'], r0=s['r0'], p0=s['p0']); out.append(m); busy = m['tx']
    return out, miss

def st(tr, key='R'):
    if not tr: return {'n': 0, 'exp': 0, 'tot': 0, 'wr': 0, 'dd': 0, 'totb': 0}
    R = np.array([x[key] for x in tr]); Rb = np.array([x['Rb'] for x in tr]); eq = np.cumsum(R)
    return {'n': len(R), 'exp': round(float(R.mean()), 3), 'tot': round(float(R.sum()), 2), 'wr': round(float((R > 0).mean() * 100), 1),
            'dd': round(float(np.max(np.maximum.accumulate(eq) - eq)), 2), 'totb': round(float(Rb.sum()), 2), 'expb': round(float(Rb.mean()), 3),
            'ms': max_streak(R), 'risk_ratio': round(float(np.median([x['risk'] / x['r0'] for x in tr])), 2), 'hold_h': round(float(np.median([(x['tx'] - x['te']) / 3600 for x in tr])), 1),
            'gain_vs_p0': round(float(np.median([(x['p0'] - x['e']) * x['d'] / x['r0'] for x in tr])), 3)}
def max_streak(R):
    m = c = 0
    for x in R: c = c + 1 if x < 0 else 0; m = max(m, c)
    return m

CFGS = [{'kind': 'market', 'name': 'GỐC: vào market khi nến H1 đóng'}] + [{'kind': 'delay', 'W': w, 'sl': 'orig', 'tp': 'orig', 'fb': 'market'} for w in (1, 2, 4, 8)]
for W in (4, 8, 24):
    for fb in ('skip', 'market'):
        for k in (0.15, 0.3, 0.5):
            for tp in ('orig', 2):
                CFGS.append({'kind': 'limit', 'k': k, 'W': W, 'fb': fb, 'tp': tp, 'sl': 'orig'})
        for tf in ('M15', 'M5'):
            for kind in ('ema', 'rsi', 'mss'):
                for sl in ('orig', 'ltf'):
                    for tp in ('orig', 2, 3):
                        if sl == 'orig' and tp == 3: continue
                        CFGS.append({'kind': kind, 'tf': tf, 'W': W, 'fb': fb, 'sl': sl, 'tp': tp})
def cname(c):
    if c['kind'] == 'market': return c['name']
    if c['kind'] == 'delay': return f'ĐỐI CHỨNG: chỉ chờ {c["W"]}h rồi vào market · SL/TP gốc'
    tpn = 'TP gốc (giá TP của tín hiệu)' if c['tp'] == 'orig' else f'TP {c["tp"]}R theo SL mới'
    fb = 'hết giờ thì bỏ lệnh' if c['fb'] == 'skip' else 'hết giờ thì vào market'
    if c['kind'] == 'limit': return f'Limit chờ giá hồi {c["k"]}×ATR D1 trong {c["W"]}h · SL gốc · {tpn} · {fb}'
    trig = {'ema': f'EMA9 {c["tf"]} hồi xuống dưới EMA21 rồi cắt lên lại', 'rsi': f'RSI {c["tf"]} hồi < 40 rồi vượt lại 50', 'mss': f'{c["tf"]}: quét đáy mới rồi MSS (đóng cửa qua đỉnh trước cú quét)'}[c['kind']]
    sl = 'SL gốc (1×ATR D1)' if c['sl'] == 'orig' else f'SL dưới đáy hồi {c["tf"]} −0.3ATR (tối thiểu 0.2×ATR D1)'
    return f'{trig} trong {c["W"]}h · {sl} · {tpn} · {fb}'
for c in CFGS: c['name'] = cname(c)

BASES = {'pick': dict(), 'lo35': dict(lo=35), 'lo45': dict(lo=45), 'trend50_200': dict(trend='ema50_200'), 'trigEMA': dict(trig='ema'), 'win12': dict(win=12)}
res = {'n_cfg': len(CFGS), 'bases': {}}
ALL = {}
for bk, bp in BASES.items():
    sigs = base_signals(**bp); rows = []
    for ci, c in enumerate(CFGS):
        tr, miss = run(sigs, c); S = st(tr); S['ys'] = {y: [sum(1 for x in tr if x['y'] == y), round(sum(x['R'] for x in tr if x['y'] == y), 2)] for y in YEARS}
        S['miss'] = miss; S['id'] = ci; rows.append(S)
        if bk == 'pick': ALL[ci] = tr
    ALL_rows = rows; res['bases'][bk] = rows
    b = rows[0]; best = max(rows, key=lambda r: r['tot'])
    print(f"[{bk}] tín hiệu {len(sigs)} · GỐC n={b['n']} exp={b['exp']} tổng={b['tot']}R · TỐT NHẤT {best['tot']}R ({CFGS[best['id']]['name'][:90]}) {time.time()-T0:.0f}s", flush=True)

# ---------- walk-forward chọn cách vào lệnh (trên phương pháp chính) ----------
P = res['bases']['pick']
def wf(rows):
    folds = []; on = os_ = 0
    for Y in YEARS[2:]:
        trn = [y for y in YEARS if y < Y]; best = max(rows, key=lambda r: sum(r['ys'][y][1] for y in trn))
        tn, ts_ = best['ys'][Y]; b0 = rows[0]['ys'][Y]
        folds.append({'test': Y, 'pick': CFGS[best['id']]['name'], 'n': tn, 'R': ts_, 'base_n': b0[0], 'base_R': b0[1]}); on += tn; os_ += ts_
    return {'folds': folds, 'oos_R': round(os_, 2), 'oos_n': on, 'base_oos_R': round(sum(f['base_R'] for f in folds), 2), 'base_oos_n': sum(f['base_n'] for f in folds)}
res['wf'] = wf(P)
sub = lambda f: [P[0]] + [P[i] for i, c in enumerate(CFGS) if i and f(c)]
res['wf_orig'] = wf(sub(lambda c: c['kind'] not in ('delay',) and (c.get('sl') == 'orig')))
res['wf_tight'] = wf(sub(lambda c: c.get('sl') == 'ltf'))
res['wf_delay'] = wf(sub(lambda c: c['kind'] == 'delay'))
res['all'] = [{'id': i, 'name': c['name'], 'kind': c['kind'], 'tf': c.get('tf'), 'sl': c.get('sl'), **{k: P[i].get(k) for k in ('n', 'exp', 'tot', 'wr', 'dd', 'ms', 'totb', 'risk_ratio')}} for i, c in enumerate(CFGS)]
# độ bền: mỗi cách vào lệnh giúp được bao nhiêu phương pháp gốc (so với vào market của chính nó)
rob = []
for ci, c in enumerate(CFGS):
    wins = sum(1 for bk in BASES if res['bases'][bk][ci]['tot'] > res['bases'][bk][0]['tot']); avg = np.mean([res['bases'][bk][ci]['tot'] - res['bases'][bk][0]['tot'] for bk in BASES])
    rob.append({'id': ci, 'name': c['name'], 'better_in': wins, 'avg_gain': round(float(avg), 2), **{k: P[ci].get(k) for k in ('n', 'exp', 'tot', 'wr', 'dd', 'totb', 'expb', 'ms', 'risk_ratio', 'hold_h', 'gain_vs_p0')}, 'sl': c.get('sl'), 'kind': c['kind'], 'tf': c.get('tf'), 'W': c.get('W'), 'fb': c.get('fb'), 'tp': c.get('tp'), 'ys': P[ci]['ys'], 'miss': P[ci]['miss']})
rob.sort(key=lambda r: (-r['better_in'], -r['avg_gain']))
# nhóm theo kiểu vào lệnh
fam = {}
for r, c in zip(P, CFGS):
    k = c['kind'] if c['kind'] in ('market', 'limit', 'delay') else f"{c['kind']}_{c['tf']}_{c['sl']}"
    fam.setdefault(k, []).append(r['tot'] - P[0]['tot'])
res['family'] = {k: {'n_cfg': len(v), 'avg_gain': round(float(np.mean(v)), 2), 'pct_better': round(100 * float(np.mean([x > 0 for x in v])), 0)} for k, v in fam.items()}
res['base'] = {k: P[0][k] for k in ('n', 'exp', 'tot', 'wr', 'dd', 'totb', 'ms', 'risk_ratio', 'hold_h')}; res['base']['ys'] = P[0]['ys']
res['top'] = rob[:12]; res['top_origsl'] = [r for r in rob if r['sl'] == 'orig' or r['kind'] == 'limit'][:8]; res['n_bases'] = len(BASES)
best_id = rob[0]['id']; res['best'] = rob[0]; res['best_trades'] = ALL[best_id][-10:]; res['base_trades'] = ALL[0][-10:]
for bk in BASES: pass
def pick_id(f): ids = [i for i, c in enumerate(CFGS) if f(c)]; return max(ids, key=lambda i: P[i]['tot']) if ids else 0
KEY = {'base': 0, 'delay4': pick_id(lambda c: c['kind'] == 'delay' and c['W'] == 4),
       'm15_orig': pick_id(lambda c: c.get('tf') == 'M15' and c.get('sl') == 'orig' and c['kind'] != 'delay'),
       'm5_orig': pick_id(lambda c: c.get('tf') == 'M5' and c.get('sl') == 'orig' and c['kind'] != 'delay'),
       'limit': pick_id(lambda c: c['kind'] == 'limit'),
       'sniper': pick_id(lambda c: c['kind'] == 'ema' and c.get('tf') == 'M5' and c.get('sl') == 'ltf' and c.get('tp') == 'orig' and c.get('W') == 8 and c.get('fb') == 'skip'),
       'm15_tight': pick_id(lambda c: c.get('tf') == 'M15' and c.get('sl') == 'ltf')}
res['key'] = {k: {'name': CFGS[i]['name'], **{q: P[i].get(q) for q in ('n', 'exp', 'tot', 'wr', 'dd', 'ms', 'totb', 'risk_ratio', 'hold_h', 'gain_vs_p0', 'miss')}, 'ys': P[i]['ys'],
                  'better_in': sum(1 for bk in BASES if res['bases'][bk][i]['tot'] > res['bases'][bk][0]['tot'])} for k, i in KEY.items()}
res['sniper_trades'] = ALL[KEY['sniper']][-12:]
del res['bases']
res['secs'] = round(time.time() - T0)
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else (int(o) if isinstance(o, np.integer) else str(o)))
print('WF', res['wf']); print('FAMILY', res['family'])
print('BASE', res['base']); print('WF_ORIG', {k: v for k, v in res['wf_orig'].items() if k != 'folds'}, [f['pick'][:60] for f in res['wf_orig']['folds']]); print('WF_TIGHT', {k: v for k, v in res['wf_tight'].items() if k != 'folds'}); print('WF_DELAY', {k: v for k, v in res['wf_delay'].items() if k != 'folds'})
for r in res['all'][:5]: print('CTRL', r)
for r in res['top_origsl'][:6]: print('ORIG', r['better_in'], r['avg_gain'], r['n'], r['exp'], r['tot'], r['wr'], r['dd'], r['ms'], r['totb'], r['gain_vs_p0'], r['name'])
for r in rob[:8]: print(r['ms'], r['risk_ratio'], r['gain_vs_p0'], r['better_in'], r['avg_gain'], r['n'], r['exp'], r['tot'], r['wr'], r['dd'], r['totb'], r['name'])
