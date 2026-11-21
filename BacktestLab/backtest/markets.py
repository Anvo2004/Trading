"""Áp ĐÚNG phương pháp gốc của vàng (không tối ưu lại) lên thị trường khác — kiểm tra phương pháp có "chạy" ngoài vàng không.
Luật: D1 giá vs EMA50 + EMA50 so với 5 ngày trước → RSI H4 <40 / >60 trong 24 nến H4 → RSI H1 cắt 50 + nến H4 cùng phía EMA21 H4.
SL 1×ATR D1, TP 2R, tối đa 7 ngày (168 nến H1), 1 lệnh/lúc mỗi thị trường.
Phí: spread thật Exness lúc vào + trượt giá 25% spread trung vị; swap ước tính 0.8% ATR D1 mỗi đêm (≈ mức của vàng).
Dùng: python markets.py <M5 csv> <SYMBOL> <json ra>
"""
import sys, os, json, time
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eng import load, htf, sim, stats
SRC, SYM, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T0 = time.time()
df = load(SRC, '2020-01-01')
H1, H4, D1 = htf(df, 'b_h1'), htf(df, 'b_h4'), htf(df, 'b_d1')
sp = df['spread'].fillna(df['spread'].median()).values.astype(float); med = float(np.median(sp))
A = H1; n = len(A['c']); t = A['end']; cost = sp[A['i1']] + 0.25 * med
yr = pd.to_datetime(t - 1, unit='s').year.values; YEARS = list(range(2021, int(yr.max()) + 1))
id1 = np.searchsorted(D1['end'], t, side='right') - 1; ih4 = np.searchsorted(H4['end'], t, side='right') - 1
g = lambda X, I, k, lag=0: X[k][np.clip(I - lag, 0, None)]
dc, e50, e50_5, datr = g(D1, id1, 'c'), g(D1, id1, 'e50'), g(D1, id1, 'e50', 5), g(D1, id1, 'atr')
trd = np.where((dc > e50) & (e50 > e50_5), 1, np.where((dc < e50) & (e50 < e50_5), -1, 0))
h4r = pd.Series(g(H4, ih4, 'rsi')); mn = h4r.rolling(96, min_periods=1).min().values; mx = h4r.rolling(96, min_periods=1).max().values
h4c, h4e21 = g(H4, ih4, 'c'), g(H4, ih4, 'e21'); r_ = A['rsi']
up = np.r_[False, (r_[1:] > 50) & (r_[:-1] <= 50)]; dn = np.r_[False, (r_[1:] < 50) & (r_[:-1] >= 50)]
valid = (id1 >= 60) & (ih4 >= 50) & (yr >= 2021)
L = valid & (((trd == 1) & (mn < 40) & up & (h4c > h4e21)) | ((trd == -1) & (mx > 60) & dn & (h4c < h4e21)))
sig = [{'i': int(i), 'd': int(trd[i]), 'entry': A['c'][i], 'sl': A['c'][i] - trd[i] * datr[i], 'tp': A['c'][i] + 2 * trd[i] * datr[i]} for i in np.where(L)[0] if datr[i] > 0]
tr = sim(sig, A, cost, 168, T=t, swap=0.0)
for x in tr:                                  # swap theo % ATR D1 (r = 1×ATR D1)
    nights = max(0, int(round((t[x['x']] - t[x['f']]) / 86400))); x['R'] = round(x['R'] - 0.008 * nights, 3)
R = np.array([x['R'] for x in tr]); Y = yr[[x['i'] for x in tr]] if tr else np.array([], int)
S = stats(tr) if tr else {'n': 0}
S.update({'sym': SYM, 'ys': {int(y): [int((Y == y).sum()), round(float(R[Y == y].sum()), 2)] for y in YEARS},
          'pos_years': int(sum(1 for y in YEARS if (Y == y).sum() and R[Y == y].sum() > 0)), 'n_years': len(YEARS),
          'long': round(float(R[[x['d'] == 1 for x in tr]].mean()), 3) if any(x['d'] == 1 for x in tr) else 0,
          'short': round(float(R[[x['d'] == -1 for x in tr]].mean()), 3) if any(x['d'] == -1 for x in tr) else 0,
          'spread_med': round(med, 5), 'spread_R': round(float(np.median(cost[[x['f'] for x in tr]] / np.array([x['r'] for x in tr]))), 4) if tr else 0,
          'atr_d1_last': round(float(D1['atr'][-1]), 5), 'px_last': round(float(D1['c'][-1]), 5),
          'trades': [(int(t[x['f']]), int(t[x['x']]), x['d'], x['R']) for x in tr], 'secs': round(time.time() - T0)})
json.dump(S, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else (int(o) if isinstance(o, np.integer) else float(o)))
print(SYM, {k: S.get(k) for k in ('n', 'wr', 'exp', 'tot', 'pf', 'dd', 'pos_years')}, S['ys'])
