"""Quét NHIỀU THỊ TRƯỜNG mỗi giờ bằng đúng phương pháp gốc (dùng trong live.py).
Chỉ quét các thị trường ĐẠT CHUẨN trong kiểm tra 2021–2026 (BacktestLab/data/markets.js do workflow markets.yml tạo mỗi tuần):
≥ 30 lệnh, kỳ vọng ≥ +0.10R/lệnh, PF ≥ 1.2, có lãi ≥ 4 năm. Vàng được quét riêng trong live.py.
Dữ liệu trực tuyến: Binance (crypto) / Yahoo Finance (ngoại hối, chỉ số, dầu, bạc) — giá lệch CFD Exness một chút, dùng KHOẢNG CÁCH SL/TP.
"""
import os, json, time, datetime as dt
import live as L

NAMES = {'XAGUSDm': 'Bạc XAGUSD', 'EURUSDm': 'EURUSD', 'GBPUSDm': 'GBPUSD', 'USDJPYm': 'USDJPY', 'AUDUSDm': 'AUDUSD', 'USDCADm': 'USDCAD',
         'EURJPYm': 'EURJPY', 'GBPJPYm': 'GBPJPY', 'BTCUSDm': 'Bitcoin BTCUSD', 'ETHUSDm': 'Ethereum ETHUSD', 'USTECm': 'Nasdaq 100 (USTEC)',
         'US30m': 'Dow Jones (US30)', 'US500m': 'S&P 500 (US500)', 'USOILm': 'Dầu WTI (USOIL)', 'UKOILm': 'Dầu Brent (UKOIL)', 'DE30m': 'DAX (DE30)', 'JP225m': 'Nikkei (JP225)'}
YAHOO = {'XAGUSDm': 'SI=F', 'EURUSDm': 'EURUSD=X', 'GBPUSDm': 'GBPUSD=X', 'USDJPYm': 'JPY=X', 'AUDUSDm': 'AUDUSD=X', 'USDCADm': 'CAD=X', 'EURJPYm': 'EURJPY=X',
         'GBPJPYm': 'GBPJPY=X', 'USTECm': 'NQ=F', 'US30m': 'YM=F', 'US500m': 'ES=F', 'USOILm': 'CL=F', 'UKOILm': 'BZ=F', 'DE30m': '^GDAXI', 'JP225m': '^N225'}
BINANCE = {'BTCUSDm': 'BTCUSDT', 'ETHUSDm': 'ETHUSDT'}
HERE = os.path.dirname(os.path.abspath(__file__))

def passed(d):
    return d.get('n', 0) >= 30 and d.get('exp', 0) >= 0.10 and d.get('pf', 0) >= 1.2 and d.get('pos_years', 0) >= 4
def load_markets():
    f = os.path.join(HERE, '..', 'data', 'markets.js')
    if not os.path.exists(f): return {}
    s = open(f, encoding='utf-8').read().strip(); return json.loads(s[len('window.MK = '):].rstrip(';'))['markets']

def h1_bars(sym):
    if sym in BINANCE:
        out, end = [], int(time.time() * 1000)
        while len(out) < 6000:
            k = L.get(f'https://data-api.binance.vision/api/v3/klines?symbol={BINANCE[sym]}&interval=1h&limit=1000&endTime={end}')
            if not k: break
            out = [{'t': a[0] // 1000, 'o': float(a[1]), 'h': float(a[2]), 'l': float(a[3]), 'c': float(a[4]), 'v': float(a[5])} for a in k] + out
            end = k[0][0] - 1
            if len(k) < 1000: break
        src = f'{BINANCE[sym]} (Binance)'
    else:
        j = None
        for host in ('query1', 'query2'):
            try: j = L.get(f'https://{host}.finance.yahoo.com/v8/finance/chart/{YAHOO[sym]}?interval=1h&range=730d')['chart']['result'][0]; break
            except Exception as e: err = e
        if j is None: raise err
        q = j['indicators']['quote'][0]; out = []
        for i, t in enumerate(j['timestamp']):
            o, h, l, c = q['open'][i], q['high'][i], q['low'][i], q['close'][i]
            if None in (o, h, l, c): continue
            out.append({'t': (t // 3600) * 3600, 'o': o, 'h': h, 'l': l, 'c': c, 'v': q['volume'][i] or 0})
        src = f'{YAHOO[sym]} (Yahoo)'
    return [b for b in out if not L.closed(b['t'])], src

def days(H):
    """Nến D1 theo ngày giao dịch bắt đầu 17:00 New York (giống MT5 và dữ liệu đã kiểm tra)."""
    out = []
    for b in H:
        k = (dt.datetime.fromtimestamp(b['t'], L.NY) + dt.timedelta(hours=7)).date()
        if out and out[-1]['k'] == k:
            D = out[-1]; D['h'] = max(D['h'], b['h']); D['l'] = min(D['l'], b['l']); D['c'] = b['c']; D['end'] = b['t'] + 3600
        else: out.append({'k': k, 't': b['t'], 'o': b['o'], 'h': b['h'], 'l': b['l'], 'c': b['c'], 'v': 0, 'end': b['t'] + 3600})
    for i, D in enumerate(out):     # ngày đã đóng = có ngày sau nó; ngày cuối dùng thời điểm đóng ước tính
        D['close_t'] = out[i + 1]['t'] if i + 1 < len(out) else D['t'] + 23 * 3600
    return out

def status(M, prev_pos):
    trades, pos, s = M
    if pos and (not prev_pos or prev_pos['t'] != pos['t']): return 'SIGNAL'
    if pos: return 'HOLD'
    if prev_pos and any(x['t'] == prev_pos['t'] for x in trades): return 'CLOSED'
    if not s or not s['trD']: return 'NOTRADE'
    if not s['pulled'] or s['side'] != s['trD']: return 'WAIT'
    return 'READY'

def scan(prev):
    mk = load_markets(); out = {}
    for sym, d in sorted(mk.items()):
        if sym == 'XAUUSDm' or not passed(d) or (sym not in YAHOO and sym not in BINANCE): continue
        try:
            H, src = h1_bars(sym)
            if len(H) < 400: raise ValueError('ít dữ liệu')
            D = days(H)
            M = L.main_method(H, D, gen=True)
            pp = (prev.get(sym) or {}).get('pos')
            st = status(M, pp); s = M[2] or {}
            closed = next((x for x in M[0] if pp and x['t'] == pp['t']), None) if st == 'CLOSED' else None
            out[sym] = {'name': NAMES.get(sym, sym), 'src': src, 'px': H[-1]['c'], 'act': st, 'pos': M[1], 'closed': closed, 'state': s,
                        'trades': M[0][-6:], 'bt': {k: d.get(k) for k in ('n', 'wr', 'exp', 'pf', 'pos_years', 'n_years')}}
        except Exception as e:
            out[sym] = {'name': NAMES.get(sym, sym), 'act': 'ERROR', 'err': str(e)[:160], 'bt': {k: d.get(k) for k in ('n', 'wr', 'exp', 'pf', 'pos_years', 'n_years')}}
        time.sleep(1)
    return out

def summary_line(ms):
    dw = lambda d: 'MUA' if d == 1 else 'BÁN'
    sig = [f"{m['name']} {dw(m['pos']['d'])}" for m in ms.values() if m['act'] == 'SIGNAL']
    hold = [f"{m['name']} {dw(m['pos']['d'])}" for m in ms.values() if m['act'] == 'HOLD']
    ready = [f"{m['name']} ({dw(m['state']['trD'])})" for m in ms.values() if m['act'] == 'READY']
    parts = []
    if sig: parts.append('🔔 TÍN HIỆU MỚI: ' + ', '.join(sig))
    if hold: parts.append('🟢 đang giữ: ' + ', '.join(hold))
    if ready: parts.append('🟠 sẵn sàng (chờ RSI H1 cắt 50): ' + ', '.join(ready))
    return ('Thị trường khác — ' + ' · '.join(parts) + '.') if parts else (f'Thị trường khác ({len(ms)} thị trường đạt chuẩn): chưa có setup sẵn sàng.' if ms else None)
