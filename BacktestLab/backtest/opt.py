"""Tối ưu ("train") phương pháp SWING trên dữ liệu Exness + kiểm tra walk-forward.
Dùng: python opt.py <file M5 csv có cột spread> <file json ra> [file json scalp từ run.py]
- Lưới tham số: xu hướng D1 × độ hồi RSI H4 × cửa sổ × tín hiệu H1 × kiểu SL × kiểu thoát × thời gian giữ.
- Chi phí: spread thật tại nến vào + 0.05$ trượt giá + swap SWAP $/oz mỗi đêm.
- Walk-forward: chọn cấu hình tốt nhất trên các năm TRƯỚC, chấm điểm trên năm SAU (chưa thấy) → ghép lại = kết quả thật của việc "train".
"""
import sys, os, json, itertools, time
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eng import load, htf, sim, stats

T0 = time.time()
SRC, OUT = sys.argv[1], sys.argv[2]; SCALP = sys.argv[3] if len(sys.argv) > 3 else None
SWAP = float(os.environ.get('SWAP', 0.5)); SLIP = 0.05
df = load(SRC, '2020-01-01')   # 2020 chỉ để khởi động EMA200 D1; kết quả tính từ 2021
H1, H4, D1 = htf(df, 'b_h1'), htf(df, 'b_h4'), htf(df, 'b_d1')
sp = df['spread'].fillna(df['spread'].median()).values.astype(float)
A = H1; n = len(A['c']); t = A['end']; cost = sp[A['i1']] + SLIP
yr = pd.to_datetime(t - 1, unit='s').year.values
YEARS = list(range(2021, int(yr.max()) + 1))   # tự mở rộng khi có dữ liệu năm mới
id1 = np.searchsorted(D1['end'], t, side='right') - 1; ih4 = np.searchsorted(H4['end'], t, side='right') - 1
valid = (id1 >= 200) & (ih4 >= 50) & (yr >= 2021)
g = lambda X, I, k, lag=0: X[k][np.clip(I - lag, 0, None)]
dc, e21, e50, e200, datr = g(D1, id1, 'c'), g(D1, id1, 'e21'), g(D1, id1, 'e50'), g(D1, id1, 'e200'), g(D1, id1, 'atr')
e50_5, e21_3 = g(D1, id1, 'e50', 5), g(D1, id1, 'e21', 3)
sgn = lambda up, dn: np.where(up, 1, np.where(dn, -1, 0))
TREND = {
    'D1: giá > EMA50 > EMA200': sgn((dc > e50) & (e50 > e200), (dc < e50) & (e50 < e200)),
    'D1: giá > EMA50, EMA50 dốc lên 5 ngày': sgn((dc > e50) & (e50 > e50_5), (dc < e50) & (e50 < e50_5)),
    'D1: giá > EMA21, EMA21 dốc lên 3 ngày': sgn((dc > e21) & (e21 > e21_3), (dc < e21) & (e21 < e21_3)),
}
h4r = pd.Series(g(H4, ih4, 'rsi'))
cross = lambda a, b: (np.r_[False, (a[1:] > b[1:]) & (a[:-1] <= b[:-1])], np.r_[False, (a[1:] < b[1:]) & (a[:-1] >= b[:-1])])
TRIG = {'EMA9 cắt EMA21 H1': cross(A['e9'], A['e21']), 'MACD H1 cắt Signal': cross(A['hist'], np.zeros(n)), 'RSI H1 cắt 50': cross(A['rsi'], np.full(n, 50.0))}
lo_l = pd.Series(A['l']); hi_l = pd.Series(A['h'])
SWL = {k: (lo_l.rolling(k, min_periods=1).min().values, hi_l.rolling(k, min_periods=1).max().values) for k in (12, 24, 48)}
h4c, h4e21 = g(H4, ih4, 'c'), g(H4, ih4, 'e21')
TRAIL = (h4c < h4e21, h4c > h4e21)  # thoát lệnh mua khi nến H4 đóng dưới EMA21 H4 (ngược lại cho bán)

GRID = dict(trend=list(TREND), lo=[30, 35, 40, 45, 50], win=[6, 12, 24], trig=list(TRIG), sl=[('swing', 12), ('swing', 24), ('swing', 48), ('atrD', 1.0), ('atrD', 1.5), ('atrD', 2.0)],
            ex=[1.5, 2, 3, 4, 'trail'], hold=[3, 5, 7], h4f=[False, True])
keys = list(GRID); combos = list(itertools.product(*GRID.values()))
print('Exness H1 bars', n, 'combos', len(combos), flush=True)
rows = []; TRADES = {}
for ci, cb in enumerate(combos):
    P = dict(zip(keys, cb))
    tr_ = TREND[P['trend']]; mn = h4r.rolling(4 * P['win'], min_periods=1).min().values; mx = h4r.rolling(4 * P['win'], min_periods=1).max().values
    up, dn = TRIG[P['trig']]
    L = valid & (((tr_ == 1) & (mn < P['lo']) & up & (~TRAIL[0] if P['h4f'] else True)) | ((tr_ == -1) & (mx > 100 - P['lo']) & dn & (~TRAIL[1] if P['h4f'] else True)))
    idx = np.where(L)[0]; sig = []
    for i in idx:
        d = int(tr_[i]); e = A['c'][i]
        if P['sl'][0] == 'swing': lw, hh = SWL[P['sl'][1]]; sl = (lw[i] - 0.3 * A['atr'][i]) if d == 1 else (hh[i] + 0.3 * A['atr'][i])
        else: sl = e - d * P['sl'][1] * datr[i]
        r = abs(e - sl)
        if r < 0.3 * A['atr'][i]: continue
        rr = 50 if P['ex'] == 'trail' else P['ex']
        sig.append({'i': int(i), 'd': d, 'entry': e, 'sl': sl, 'tp': e + d * rr * r})
    tr = sim(sig, A, cost, P['hold'] * 24, T=t, swap=SWAP, exitarr=TRAIL if P['ex'] == 'trail' else None)
    R = np.array([x['R'] for x in tr]); Y = yr[[x['i'] for x in tr]] if tr else np.array([], int)
    S = stats(tr); S.update({k: (list(v) if isinstance(v, tuple) else v) for k, v in P.items()})
    S['ys'] = {int(y): [int((Y == y).sum()), round(float(R[Y == y].sum()), 2)] for y in YEARS}
    S['long'] = round(float(R[[x['d'] == 1 for x in tr]].mean()), 3) if any(x['d'] == 1 for x in tr) else 0
    S['short'] = round(float(R[[x['d'] == -1 for x in tr]].mean()), 3) if any(x['d'] == -1 for x in tr) else 0
    S['id'] = ci; rows.append(S); TRADES[ci] = [(int(t[x['f']]), int(t[x['x']]), x['d'], x['R'], round(float(A['c'][x['i']]), 2), x['r']) for x in tr]
    S.setdefault('exp', 0); S.setdefault('wr', 0); S.setdefault('pf', 0); S.setdefault('dd', 0); S.setdefault('ms', 0)
    if ci % 1000 == 0: print(f'{ci}/{len(combos)} {time.time()-T0:.0f}s', flush=True)

def name(r):
    ex = 'thoát khi H4 đóng ngược EMA21 H4' if r['ex'] == 'trail' else f'TP {r["ex"]}R'
    sl = f'SL đáy/đỉnh {r["sl"][1]} nến H1 ±0.3ATR' if r['sl'][0] == 'swing' else f'SL {r["sl"][1]}×ATR D1'
    return f'{r["trend"]} · RSI H4 hồi <{r["lo"]} (>{100 - r["lo"]} khi bán) trong {r["win"]} nến H4 · {r["trig"]}{" (chỉ khi nến H4 gần nhất đóng cùng phía EMA21 H4)" if r["h4f"] else ""} · {sl} · {ex} · giữ ≤{r["hold"]} ngày'
for r in rows: r['name'] = name(r)
score = lambda n_, s_: (s_ / n_) * np.sqrt(n_) if n_ >= 30 else -9   # ≈ t-stat: lợi nhuận TB × căn số lệnh
def agg(r, ys):
    nn = sum(r['ys'][y][0] for y in ys); ss = sum(r['ys'][y][1] for y in ys); return nn, ss

# ---------- walk-forward ----------
def wf(rows_, test_years=None):
    test_years = test_years or YEARS[2:]
    folds = []; on = 0; os_ = 0.0
    for Y in test_years:
        tr_y = [y for y in range(2021, Y)]
        best = max(rows_, key=lambda r: score(*agg(r, tr_y)))
        nn, ss = agg(best, tr_y); tn, ts = best['ys'].get(Y, best['ys'].get(str(Y), [0, 0]))
        folds.append({'test': Y, 'train': f'2021–{Y - 1}', 'pick': best['name'], 'train_n': nn, 'train_exp': round(ss / max(nn, 1), 3), 'test_n': tn, 'test_R': ts, 'test_exp': round(ts / tn, 3) if tn else 0})
        on += tn; os_ += ts
    return {'folds': folds, 'oos_n': on, 'oos_R': round(os_, 2), 'oos_exp': round(os_ / on, 3) if on else 0}
WF = wf(rows)
print(json.dumps(WF, ensure_ascii=False, indent=1))
# ---------- chọn phương pháp cuối: mạnh trên cả 6 năm + ổn định từng năm ----------
def yexp(r, y): n_, s_ = r['ys'][y]; return s_ / n_ if n_ else 0
def robust(r):
    pos = sum(1 for y in YEARS if r['ys'][y][0] and yexp(r, y) > 0)
    worst = min(yexp(r, y) for y in YEARS if r['ys'][y][0]) if r['n'] else -9
    return pos, worst
cand = [r for r in rows if r['n'] >= 60]
for r in cand: r['pos_years'], r['worst_year'] = robust(r); r['score'] = round(score(r['n'], r['n'] * r['exp']), 2)
stable = sorted([r for r in cand if r['pos_years'] >= 4 and r['worst_year'] > -0.5], key=lambda r: (-r['pos_years'], -r['score']))
best_all = sorted(cand, key=lambda r: -r['score'])[:15]
pick = stable[0] if stable else best_all[0]
# độ "nhạy": các cấu hình hàng xóm (khác đúng 1 tham số) có còn dương không
def neigh(r):
    out = []
    for o in rows:
        diff = sum(1 for k in keys if (o[k] if not isinstance(o[k], list) else tuple(o[k])) != (r[k] if not isinstance(r[k], list) else tuple(r[k])))
        if diff == 1 and o['n'] >= 30: out.append(o['exp'])
    return round(float(np.mean([x > 0 for x in out])) * 100, 0) if out else 0
pick['neighbors_pos_pct'] = neigh(pick)
# ảnh hưởng của từng tham số (TB kỳ vọng trên mọi tổ hợp)
marg = {k: {str(v): round(float(np.mean([r['exp'] for r in rows if (tuple(r[k]) if isinstance(r[k], list) else r[k]) == v and r['n'] >= 30] or [0])), 3) for v in GRID[k]} for k in keys}
eq = TRADES[pick['id']]
res = {'n_combos': len(rows), 'n_trades_total': int(sum(r['n'] for r in rows)), 'wf': WF, 'pick': pick, 'stable_top': stable[:10], 'top': best_all, 'marg': marg, 'pick_trades': eq,
       'pct_positive': round(100 * np.mean([r['exp'] > 0 for r in rows if r['n'] >= 30]), 1), 'swap': SWAP, 'spread_mean': round(float(sp.mean()), 3)}
if SCALP and os.path.exists(SCALP):
    sc = json.load(open(SCALP, encoding='utf-8'))
    srows = [r for r in sc['res'] if r['group'] == 'scalp' and r.get('ys')]
    for r in srows: r['ys'] = {int(k): v for k, v in r['ys'].items()}
    for r in srows:
        for y in YEARS: r['ys'].setdefault(y, [0, 0])
    res['scalp_wf'] = wf(srows); res['scalp_total'] = int(sum(r['n'] for r in sc['res'])); res['scalp_rows'] = [{k: r[k] for k in ('name', 'n', 'wr', 'exp', 'pf', 'dd', 'is', 'oos', 'long', 'short', 'years') if k in r} for r in sc['res']]
    res['scalp_now'] = sc.get('now')
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
hh = np.array([(x[1] - x[0]) / 3600 for x in eq]); RR_ = np.array([x[3] for x in eq])
res['pick_hold_med_h'] = float(np.median(hh)) if len(hh) else 0; res['pick_avg_win'] = float(RR_[RR_ > 0].mean()) if (RR_ > 0).any() else 0; res['pick_avg_loss'] = float(RR_[RR_ < 0].mean()) if (RR_ < 0).any() else 0
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
print('hold median h', res['pick_hold_med_h'], 'avg win', res['pick_avg_win'], 'avg loss', res['pick_avg_loss'])
print('PICK', pick['name'], {k: pick[k] for k in ('n', 'wr', 'exp', 'pf', 'dd', 'ms', 'pos_years', 'worst_year', 'neighbors_pos_pct', 'long', 'short')}, pick['ys'])
print('pct positive', res['pct_positive'], 'total trades', res['n_trades_total'], f'{time.time()-T0:.0f}s')
