# Backtest engine XAUUSD — scalp (M5 entry) + swing (H1 entry). No look-ahead: HTF values = last CLOSED HTF bar.
import numpy as np, pandas as pd, json, sys, time
T0 = time.time()

def load(path, start='2021-01-01'):
    df = pd.read_csv(path)
    df['dt'] = pd.to_datetime(df['time'], unit='s', utc=True)
    df = df[df.dt >= pd.Timestamp(start, tz='UTC')]
    ny = df.dt.dt.tz_convert('America/New_York'); wd = ny.dt.weekday; h = ny.dt.hour
    closed = (wd == 5) | ((wd == 4) & (h >= 17)) | ((wd == 6) & (h < 18))
    df = df[~closed.values].reset_index(drop=True)
    ny = df.dt.dt.tz_convert('America/New_York')
    df['nym'] = (ny.dt.hour * 60 + ny.dt.minute).values
    sh = ny + pd.Timedelta(hours=7)                         # ngày giao dịch bắt đầu 17:00 NY (giống nến D1 trên MT5)
    df['day'] = sh.dt.strftime('%Y-%m-%d').values
    df['dow'] = sh.dt.weekday.values
    df['b_h1'] = ny.dt.floor('h').dt.strftime('%Y%m%d%H').values
    df['b_h4'] = sh.dt.floor('4h').dt.strftime('%Y%m%d%H').values
    df['b_m15'] = ny.dt.floor('15min').dt.strftime('%Y%m%d%H%M').values
    df['b_d1'] = df['day']
    df['year'] = df.dt.dt.year.values
    if 'volume' not in df: df['volume'] = 0.0
    return df

def ema(x, n): return pd.Series(x).ewm(span=n, adjust=False).mean().values
def rsi(c, n=14):
    d = np.diff(c, prepend=c[0]); up = pd.Series(np.maximum(d, 0)).ewm(alpha=1 / n, adjust=False).mean(); dn = pd.Series(np.maximum(-d, 0)).ewm(alpha=1 / n, adjust=False).mean()
    return (100 - 100 / (1 + up / dn.replace(0, 1e-9))).values
def atr(h, l, c, n=14):
    pc = np.concatenate([[c[0]], c[:-1]]); tr = np.maximum(h - l, np.maximum(abs(h - pc), abs(l - pc)))
    return pd.Series(tr).ewm(alpha=1 / n, adjust=False).mean().values
def ind(o, h, l, c, v):
    m = ema(c, 12) - ema(c, 26); s = pd.Series(m).ewm(span=9, adjust=False).mean().values
    return dict(o=o, h=h, l=l, c=c, v=v, e5=ema(c, 5), e9=ema(c, 9), e21=ema(c, 21), e50=ema(c, 50), e200=ema(c, 200), rsi=rsi(c), rsi2=rsi(c, 2), macd=m, sig=s, hist=m - s, atr=atr(h, l, c),
                vma=pd.Series(v).rolling(20, min_periods=1).mean().values)

def htf(df, key):
    g = df.groupby(key, sort=False); gi = pd.Series(df.index, index=df.index).groupby(df[key], sort=False)
    a = pd.DataFrame({'o': g.open.first(), 'h': g.high.max(), 'l': g.low.min(), 'c': g.close.last(), 'v': g.volume.sum(), 'end': g.time.max() + 300, 'first': g.time.min(), 'i0': gi.first(), 'i1': gi.last()})
    a = a.sort_values('end').reset_index()
    I = ind(*(a[k].values.astype(float) for k in 'ohlcv')); I.update(end=a.end.values, first=a['first'].values, i0=a.i0.values, i1=a.i1.values, key=a[key].values)
    return I

def mapidx(H, m5_close):  # index of last CLOSED HTF bar at each M5 close
    return np.searchsorted(H['end'], m5_close, side='right') - 1

# ---------------------------------------------------------------- simulator
def sim(sig, A, cost, maxhold, flat_nym=None, nym=None, day=None, T=None, swap=0.0, exitarr=None):
    """cost: số $ hoặc mảng spread theo nến (+trượt giá); swap: $/oz mỗi đêm giữ lệnh; exitarr: (thoát lệnh mua, thoát lệnh bán) theo nến"""
    H, L, C = A['h'], A['l'], A['c']; N = len(C); out = []; busy = -1
    for s in sig:
        i = s['i']
        if i <= busy or i + 1 >= N: continue
        d, e, sl, tp = s['d'], s['entry'], s['sl'], s['tp']; r = abs(e - sl)
        if r <= 0: continue
        j = i + 1; fill = None
        if s.get('kind') == 'lmt':
            exp = s['exp']
            while j < N and j <= exp:
                f = L[j] <= e if d == 1 else H[j] >= e; th = H[j] >= tp if d == 1 else L[j] <= tp
                if not f and th: break
                if f: fill = j; break
                j += 1
            if fill is None: busy = j; continue
            j = fill
        else: fill = i; j = i + 1
        res = None; end = min(N - 1, fill + maxhold)
        k = j
        while k <= end:
            if (L[k] <= sl) if d == 1 else (H[k] >= sl): res = (k, sl, 'SL'); break
            if (k > fill or s.get('kind') != 'lmt') and ((H[k] >= tp) if d == 1 else (L[k] <= tp)): res = (k, tp, 'TP'); break
            if exitarr is not None and k > fill and exitarr[0 if d == 1 else 1][k]: res = (k, C[k], 'Exit'); break
            if flat_nym is not None and k > fill and nym[k] >= flat_nym and nym[k] < 1020 and nym[fill] < flat_nym: res = (k, C[k], 'Time'); break
            k += 1
        if res is None: res = (end, C[end], 'Time')
        k, px, why = res
        c0 = cost[fill] if isinstance(cost, np.ndarray) else cost
        nights = max(0, int(round((T[k] - T[fill]) / 86400))) if (T is not None and swap) else 0
        R = (px - e) * d / r - (c0 + swap * nights) / r
        out.append({'i': i, 'f': fill, 'x': k, 'd': d, 'R': round(R, 3), 'why': why, 'tag': s.get('tag', ''), 'r': round(r, 2)})
        busy = k
    return out

def stats(tr, years=None):
    if not tr: return {'n': 0}
    R = np.array([t['R'] for t in tr]); w = R[R > 0]; lo = R[R < 0]
    eq = np.cumsum(R); dd = float(np.max(np.maximum.accumulate(eq) - eq)) if len(eq) else 0
    st = 0; ms = 0
    for x in R:
        st = st + 1 if x < 0 else 0; ms = max(ms, st)
    return {'n': len(R), 'wr': round(len(w) / len(R) * 100, 1), 'exp': round(R.mean(), 3), 'tot': round(R.sum(), 1), 'pf': round(w.sum() / -lo.sum(), 2) if len(lo) else 99, 'dd': round(dd, 1), 'ms': ms}

def report(name, group, tr, yr, extra=None):
    S = stats(tr); y = np.array([yr[t['i']] for t in tr]) if tr else np.array([])
    S['is'] = stats([t for t, a in zip(tr, y) if a <= 2023]).get('exp', 0)
    S['oos'] = stats([t for t, a in zip(tr, y) if a >= 2024]).get('exp', 0)
    S['n_oos'] = int((y >= 2024).sum()) if len(y) else 0
    S['years'] = {int(k): stats([t for t, a in zip(tr, y) if a == k]).get('exp', 0) for k in sorted(set(y.tolist()))} if len(y) else {}
    S['long'] = stats([x for x in tr if x['d'] == 1]).get('exp', 0); S['short'] = stats([x for x in tr if x['d'] == -1]).get('exp', 0); S['nl'] = sum(1 for x in tr if x['d'] == 1)
    S['ys'] = {int(k): [int((y == k).sum()), round(float(sum(t['R'] for t, a in zip(tr, y) if a == k)), 2)] for k in sorted(set(y.tolist()))} if len(y) else {}
    S['name'] = name; S['group'] = group
    if extra: S.update(extra)
    print(f"{group:6s} {name[:70]:70s} n={S['n']:5d} wr={S.get('wr',0):5.1f} exp={S.get('exp',0):+.3f} pf={S.get('pf',0):5.2f} dd={S.get('dd',0):6.1f} IS={S['is']:+.3f} OOS={S['oos']:+.3f} L={S['long']:+.3f} S={S['short']:+.3f}", flush=True)
    return S
