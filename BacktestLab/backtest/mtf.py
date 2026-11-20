"""Backtest/train ĐA KHUNG trên dữ liệu Exness: cùng logic "xu hướng khung lớn → nhịp hồi khung giữa → điểm vào khung nhỏ",
nhưng khung vào lệnh lần lượt là H4, H1, M15, M5.
Dùng: python mtf.py <M5 csv có cột spread> <H4|H1|M15|M5> <json ra>      (LIMIT=n để chạy thử n tổ hợp)
Chống nhìn trước: giá trị khung lớn = nến khung lớn ĐÃ ĐÓNG gần nhất tại lúc nến vào lệnh đóng.
Chi phí: spread thật của Exness tại nến vào + 0.05$ trượt giá + swap SWAP $/oz mỗi đêm. SL & TP cùng nến → tính SL.
"""
import sys, os, json, itertools, time, gc
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eng import load, htf, sim, stats
sys.stdout.reconfigure(encoding='utf-8')
T0 = time.time()
SRC, TF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SWAP = float(os.environ.get('SWAP', 0.5)); SLIP = 0.05; LIMIT = int(os.environ.get('LIMIT', 0))
SEC = {'M5': 300, 'M15': 900, 'H1': 3600, 'H4': 14400, 'D1': 86400}
# khung giữa (đo nhịp hồi + bộ lọc) và các khung xu hướng được thử cho từng khung vào lệnh
CFG = {
    'H4': dict(M='H4', T=['D1'], hold=[3, 5, 7], sess=['all']),
    'H1': dict(M='H4', T=['D1'], hold=[3, 5, 7], sess=['all']),
    'M15': dict(M='H1', T=['D1', 'H4'], hold=[0.5, 1, 2], sess=['all', 'kz', 'ldn_ny']),
    'M5': dict(M='M15', T=['D1', 'H4', 'H1'], hold=[0.25, 0.5, 1], sess=['all', 'kz', 'ldn_ny']),
}[TF]
df = load(SRC, '2020-01-01'); df['b_m5'] = df['time']
need = {TF, CFG['M'], *CFG['T']}
KEY = {'M5': 'b_m5', 'M15': 'b_m15', 'H1': 'b_h1', 'H4': 'b_h4', 'D1': 'b_d1'}
B = {k: htf(df, KEY[k]) for k in need}
sp = df['spread'].fillna(df['spread'].median()).values.astype(float); nym_all = df.nym.values
del df; gc.collect()
A = B[TF]; n = len(A['c']); t = A['end']; cost = sp[A['i1']] + SLIP; nym = nym_all[A['i1']]
yr = pd.to_datetime(t - 1, unit='s').year.values; YEARS = list(range(2021, int(yr.max()) + 1))
mp = lambda X: np.searchsorted(B[X]['end'], t, side='right') - 1
g = lambda X, I, k, lag=0: B[X][k][np.clip(I - lag, 0, None)]
sgn = lambda up, dn: np.where(up, 1, np.where(dn, -1, 0))
TREND = {}
for X in CFG['T']:
    I = mp(X); c_, e21, e50, e200 = g(X, I, 'c'), g(X, I, 'e21'), g(X, I, 'e50'), g(X, I, 'e200'); e50_5, e21_3 = g(X, I, 'e50', 5), g(X, I, 'e21', 3)
    ok = I >= 200
    TREND[f'{X}: giá > EMA50, EMA50 dốc lên'] = np.where(ok, sgn((c_ > e50) & (e50 > e50_5), (c_ < e50) & (e50 < e50_5)), 0)
    TREND[f'{X}: giá > EMA50 > EMA200'] = np.where(ok, sgn((c_ > e50) & (e50 > e200), (c_ < e50) & (e50 < e200)), 0)
    TREND[f'{X}: giá > EMA21, EMA21 dốc lên'] = np.where(ok, sgn((c_ > e21) & (e21 > e21_3), (c_ < e21) & (e21 < e21_3)), 0)
M = CFG['M']; IM = mp(M) if M != TF else np.arange(n)
mr = pd.Series(g(M, IM, 'rsi')); mc, me21, matr = g(M, IM, 'c'), g(M, IM, 'e21'), g(M, IM, 'atr')
MSIDE = (mc < me21, mc > me21)          # nến khung giữa đóng ngược EMA21 → dùng làm bộ lọc và kiểu thoát "trail"
cross = lambda a, b: (np.r_[False, (a[1:] > b[1:]) & (a[:-1] <= b[:-1])], np.r_[False, (a[1:] < b[1:]) & (a[:-1] >= b[:-1])])
TRIG = {f'EMA9 cắt EMA21 {TF}': cross(A['e9'], A['e21']), f'MACD {TF} cắt Signal': cross(A['hist'], np.zeros(n)), f'RSI {TF} cắt 50': cross(A['rsi'], np.full(n, 50.0))}
SESS = {'all': np.ones(n, bool), 'kz': ((nym >= 120) & (nym < 300)) | ((nym >= 420) & (nym < 600)), 'ldn_ny': (nym >= 120) & (nym < 660)}
SESSN = {'all': 'mọi giờ', 'kz': 'chỉ killzone London 14–17h / NY 19–22h VN', 'ldn_ny': 'London→NY 14–23h VN'}
lo_l, hi_l = pd.Series(A['l']), pd.Series(A['h'])
SWL = {k: (lo_l.rolling(k, min_periods=1).min().values - 0.3 * A['atr'], hi_l.rolling(k, min_periods=1).max().values + 0.3 * A['atr']) for k in (12, 24)}
valid = (yr >= 2021) & (IM >= 30)
GRID = dict(trend=list(TREND), lo=[35, 40, 45], win=[6, 12, 24], trig=list(TRIG), sl=[('swing', 12), ('swing', 24), ('atrM', 1.0), ('atrM', 2.0)],
            ex=[1.5, 2, 3, 'trail'], hold=CFG['hold'], mf=[False, True], sess=CFG['sess'])
keys = list(GRID); combos = list(itertools.product(*GRID.values()))
if LIMIT: combos = combos[::max(1, len(combos) // LIMIT)][:LIMIT]
bars_day = 86400 / SEC[TF]
print(f'{TF}: {n} nến, khung giữa {M}, {len(combos)} tổ hợp, nạp xong {time.time()-T0:.0f}s', flush=True)
rows = []; TR = {}
cache_mm = {}
for ci, cb in enumerate(combos):
    P = dict(zip(keys, cb)); tr_ = TREND[P['trend']]
    if P['win'] not in cache_mm:
        w = P['win'] * max(1, int(round(SEC[M] / SEC[TF])))     # cửa sổ tính bằng nến khung giữa → đổi sang nến khung vào
        cache_mm[P['win']] = (mr.rolling(w, min_periods=1).min().values, mr.rolling(w, min_periods=1).max().values)
    mn, mx = cache_mm[P['win']]; up, dn = TRIG[P['trig']]; ss = SESS[P['sess']]
    L = valid & ss & (((tr_ == 1) & (mn < P['lo']) & up & (~MSIDE[0] if P['mf'] else True)) | ((tr_ == -1) & (mx > 100 - P['lo']) & dn & (~MSIDE[1] if P['mf'] else True)))
    idx = np.where(L)[0]; d = tr_[idx]; e = A['c'][idx]
    if P['sl'][0] == 'swing': lw, hh = SWL[P['sl'][1]]; sl = np.where(d == 1, lw[idx], hh[idx])
    else: sl = e - d * P['sl'][1] * matr[idx]
    r = np.abs(e - sl); keep = r >= 0.3 * A['atr'][idx]
    rr = 50 if P['ex'] == 'trail' else P['ex']
    sig = [{'i': int(i), 'd': int(dd), 'entry': ee, 'sl': s_, 'tp': ee + dd * rr * rv} for i, dd, ee, s_, rv in zip(idx[keep], d[keep], e[keep], sl[keep], r[keep])]
    tr = sim(sig, A, cost, int(P['hold'] * bars_day), T=t, swap=SWAP, exitarr=MSIDE if P['ex'] == 'trail' else None)
    R = np.array([x['R'] for x in tr]); Y = yr[[x['i'] for x in tr]] if tr else np.array([], int)
    S = stats(tr); S.setdefault('exp', 0); S.setdefault('wr', 0); S.setdefault('pf', 0); S.setdefault('dd', 0); S.setdefault('ms', 0)
    S.update({k: (list(v) if isinstance(v, tuple) else v) for k, v in P.items()})
    S['ys'] = {int(y): [int((Y == y).sum()), round(float(R[Y == y].sum()), 2)] for y in YEARS}
    S['long'] = round(float(R[[x['d'] == 1 for x in tr]].mean()), 3) if any(x['d'] == 1 for x in tr) else 0
    S['short'] = round(float(R[[x['d'] == -1 for x in tr]].mean()), 3) if any(x['d'] == -1 for x in tr) else 0
    S['id'] = ci; rows.append(S)
    TR[ci] = [(int(t[x['f']]), int(t[x['x']]), x['d'], x['R'], round(float(A['c'][x['i']]), 2), x['r']) for x in tr] if S['exp'] > 0 and S['n'] >= 60 else None
    if ci % 500 == 0: print(f'{ci}/{len(combos)} {time.time()-T0:.0f}s', flush=True)

def name(r):
    ex = f'thoát khi {M} đóng ngược EMA21 {M}' if r['ex'] == 'trail' else f'TP {r["ex"]}R'
    sl = f'SL đáy/đỉnh {r["sl"][1]} nến {TF} ±0.3ATR' if r['sl'][0] == 'swing' else f'SL {r["sl"][1]}×ATR {M}'
    hd = f'{r["hold"]} ngày' if r['hold'] >= 1 else f'{int(r["hold"] * 24)} giờ'
    return (f'{r["trend"]} · RSI {M} hồi <{r["lo"]} (>{100 - r["lo"]} khi bán) trong {r["win"]} nến {M} · {r["trig"]}'
            f'{f" (chỉ khi nến {M} gần nhất đóng cùng phía EMA21 {M})" if r["mf"] else ""} · {sl} · {ex} · giữ ≤{hd} · {SESSN[r["sess"]]}')
for r in rows: r['name'] = name(r)
score = lambda n_, s_: (s_ / n_) * np.sqrt(n_) if n_ >= 30 else -9
agg = lambda r, ys: (sum(r['ys'][y][0] for y in ys), sum(r['ys'][y][1] for y in ys))
def wf(test_years=None):
    test_years = test_years or YEARS[2:]; folds = []; on = 0; os_ = 0.0
    for Y in test_years:
        tr_y = [y for y in YEARS if y < Y]; best = max(rows, key=lambda r: score(*agg(r, tr_y)))
        nn, ss = agg(best, tr_y); tn, ts = best['ys'][Y]
        folds.append({'test': Y, 'train': f'2021–{Y - 1}', 'pick': best['name'], 'train_n': nn, 'train_exp': round(ss / max(nn, 1), 3), 'test_n': tn, 'test_R': ts, 'test_exp': round(ts / tn, 3) if tn else 0})
        on += tn; os_ += ts
    return {'folds': folds, 'oos_n': on, 'oos_R': round(os_, 2), 'oos_exp': round(os_ / on, 3) if on else 0}
WF = wf()
yexp = lambda r, y: r['ys'][y][1] / r['ys'][y][0] if r['ys'][y][0] else 0
cand = [r for r in rows if r['n'] >= 60]
for r in cand:
    r['pos_years'] = sum(1 for y in YEARS if r['ys'][y][0] and yexp(r, y) > 0)
    r['worst_year'] = min((yexp(r, y) for y in YEARS if r['ys'][y][0]), default=-9); r['score'] = round(score(r['n'], r['n'] * r['exp']), 2)
stable = sorted([r for r in cand if r['pos_years'] >= len(YEARS) - 2 and r['worst_year'] > -0.5 and r['exp'] > 0], key=lambda r: (-r['pos_years'], -r['score']))
best_all = sorted(cand, key=lambda r: -r['score'])[:10]
pick = stable[0] if stable else (best_all[0] if best_all else None)
tup = lambda v: tuple(v) if isinstance(v, list) else v
if pick:
    nb = [o['exp'] for o in rows if o['n'] >= 30 and sum(1 for k in keys if tup(o[k]) != tup(pick[k])) == 1]
    pick['neighbors_pos_pct'] = round(float(np.mean([x > 0 for x in nb])) * 100, 0) if nb else 0
marg = {k: {str(v): round(float(np.mean([r['exp'] for r in rows if tup(r[k]) == v and r['n'] >= 30] or [0])), 3) for v in GRID[k]} for k in keys}
keep = ('name', 'n', 'wr', 'exp', 'pf', 'dd', 'ms', 'pos_years', 'worst_year', 'long', 'short', 'ys', 'score', 'neighbors_pos_pct')
valid_rows = [r for r in rows if r['n'] >= 30]
res = {'tf': TF, 'mid': M, 'n_combos': len(rows), 'n_trades_total': int(sum(r['n'] for r in rows)), 'wf': WF,
       'pct_positive': round(100 * float(np.mean([r['exp'] > 0 for r in valid_rows])), 1) if valid_rows else 0,
       'avg_trades': round(float(np.mean([r['n'] for r in rows])), 0), 'pick': {k: pick.get(k) for k in keep} if pick else None,
       'pick_trades': TR.get(pick['id']) if pick else None, 'stable_n': len(stable), 'top': [{k: x.get(k) for k in keep} for x in (stable[:5] or best_all[:5])],
       'marg': marg, 'spread_mean': round(float(cost.mean() - SLIP), 3), 'secs': round(time.time() - T0)}
if pick and res['pick_trades']:
    rs = np.array([x[5] for x in res['pick_trades']]); res['pick_risk_med'] = round(float(np.median(rs)), 2)
    res['pick_hold_med_h'] = round(float(np.median([(x[1] - x[0]) / 3600 for x in res['pick_trades']])), 1)
    res['pick_cost_R'] = round(float(np.median((cost.mean() + 0.0) / rs)), 3)   # chi phí trung bình tính theo R
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
print('WF', TF, WF['oos_n'], WF['oos_exp'], '| %dương', res['pct_positive'], '| stable', len(stable), '| PICK', pick and pick['name'], pick and {k: pick[k] for k in ('n', 'wr', 'exp', 'pf', 'dd', 'pos_years')}, f'{time.time()-T0:.0f}s', flush=True)
