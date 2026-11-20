"""Nhận định XAUUSD tự động MỖI GIỜ — chạy trên GitHub Actions (.github/workflows/live.yml), không cần mở máy.
Dùng: python live.py <live.json cũ hoặc ''> <thư mục ra>
- Dữ liệu: PAXG/USDT (Binance, 1 token = 1 oz vàng ≈ XAUUSD); dự phòng Yahoo GC=F nếu Binance lỗi.
- Phương pháp CHÍNH (đã train trên tick Exness 2021–2026, walk-forward +0.57R): giống hệt Plan.method() trong plan.js.
- Phương pháp DỰ PHÒNG H4 (mtf.py, walk-forward +0.24R).
- Thêm: chỉ báo đa khung, mức thanh khoản, cấu trúc ICT (BOS/MSS, FVG, CRT H4), tin đỏ USD (ForexFactory).
Chỉ dùng thư viện chuẩn của Python.
"""
import json, sys, os, time, math, urllib.request, datetime as dt
from zoneinfo import ZoneInfo

NY, VN = ZoneInfo('America/New_York'), dt.timezone(dt.timedelta(hours=7))
UA = {'User-Agent': 'Mozilla/5.0 (ict-gold-lab hourly bot)'}
KEEP_NOTES = 24 * 10          # giữ 10 ngày nhận định

def get(url, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            err = e; time.sleep(3 * (k + 1))
    raise err

def nyoff(t): return int(dt.datetime.fromtimestamp(t, NY).utcoffset().total_seconds() // 3600)
def closed(t):    # thị trường vàng nghỉ: Thứ 6 sau 17:00 NY → Chủ nhật 18:00 NY
    d = dt.datetime.fromtimestamp(t, NY); w = d.weekday()
    return w == 5 or (w == 4 and d.hour >= 17) or (w == 6 and d.hour < 18)
def fmt(t, date=True): return dt.datetime.fromtimestamp(t, VN).strftime('%d/%m %H:%M' if date else '%H:%M')
WD = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

# ---------------- dữ liệu ----------------
def binance(iv, total):
    out, end = [], int(time.time() * 1000)
    while len(out) < total:
        k = get(f'https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval={iv}&limit=1000&endTime={end}')
        if not k: break
        out = [{'t': a[0] // 1000, 'o': float(a[1]), 'h': float(a[2]), 'l': float(a[3]), 'c': float(a[4]), 'v': float(a[5])} for a in k] + out
        end = k[0][0] - 1
        if len(k) < 1000: break
    return [b for b in out if not closed(b['t'])]
def yahoo(iv, rng):
    j = get(f'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval={iv}&range={rng}')['chart']['result'][0]
    q = j['indicators']['quote'][0]; out = []
    for i, t in enumerate(j['timestamp']):
        if None in (q['open'][i], q['high'][i], q['low'][i], q['close'][i]): continue
        out.append({'t': t, 'o': q['open'][i], 'h': q['high'][i], 'l': q['low'][i], 'c': q['close'][i], 'v': q['volume'][i] or 0})
    return [b for b in out if not closed(b['t'])]
def load():
    try: return binance('1h', 6000), binance('1d', 400), 'PAXG/USDT (Binance) ≈ XAUUSD'
    except Exception as e:
        print('Binance lỗi, dùng Yahoo:', e)
        return yahoo('1h', '730d'), yahoo('1d', '2y'), 'Vàng tương lai COMEX GC=F (Yahoo) — lệch XAUUSD vài chục $'

# ---------------- chỉ báo (giống hệt plan.js) ----------------
def ema(a, n):
    k = 2 / (n + 1); o = []
    for i, v in enumerate(a): o.append(v if i == 0 else v * k + o[-1] * (1 - k))
    return o
def rsi(c, n=14):
    up = dn = 0.0; o = [50.0]
    for i in range(1, len(c)):
        d = c[i] - c[i - 1]; up = (up * (n - 1) + max(d, 0)) / n; dn = (dn * (n - 1) + max(-d, 0)) / n
        o.append(100 - 100 / (1 + up / dn) if dn else 100.0)
    return o
def ind(B):
    c = [b['c'] for b in B]; e12, e26 = ema(c, 12), ema(c, 26); m = [a - b for a, b in zip(e12, e26)]; sg = ema(m, 9)
    tr = [B[0]['h'] - B[0]['l']] + [max(b['h'] - b['l'], abs(b['h'] - B[i]['c']), abs(b['l'] - B[i]['c'])) for i, b in enumerate(B[1:])]
    atr = []
    for i, x in enumerate(tr): atr.append(x if i == 0 else (atr[-1] * 13 + x) / 14)
    return {'c': c, 'e9': ema(c, 9), 'e21': ema(c, 21), 'e50': ema(c, 50), 'e200': ema(c, 200), 'rsi': rsi(c), 'macd': m, 'sig': sg, 'hist': [a - b for a, b in zip(m, sg)], 'atr': atr}
def bucket(t, tf):
    if tf < 3600: return t - t % tf
    o = nyoff(t); return t - ((t + (o + 7) * 3600) % tf + tf) % tf
def agg(B, tf):
    out = []
    for b in B:
        k = bucket(b['t'], tf)
        if out and out[-1]['t'] == k: L = out[-1]; L['h'] = max(L['h'], b['h']); L['l'] = min(L['l'], b['l']); L['c'] = b['c']; L['v'] += b['v']
        else: out.append({'t': k, 'o': b['o'], 'h': b['h'], 'l': b['l'], 'c': b['c'], 'v': b['v']})
    return out

# ---------------- mô phỏng lệnh ----------------
def exit_check(pos, b, t_end, trades):
    d = pos['d']; px = why = None
    if (b['l'] <= pos['sl']) if d == 1 else (b['h'] >= pos['sl']): px, why = pos['sl'], 'SL'
    elif (b['h'] >= pos['tp']) if d == 1 else (b['l'] <= pos['tp']): px, why = pos['tp'], 'TP'
    elif t_end - pos['t'] >= 7 * 86400: px, why = b['c'], '7 ngày'
    if px is None: return False
    nights = (t_end - pos['t']) // 86400; cost = 0.35 + 0.5 * nights
    trades.append({**pos, 'xt': t_end, 'xp': round(px, 2), 'why': why, 'R': round(((px - pos['e']) * d - cost) / pos['r'], 2)}); return True

def main_method(Hall, D):
    """① D1 giá vs EMA50 + EMA50 so với 5 ngày trước ② RSI H4 <40 / >60 trong 24 nến H4 ③ RSI H1 cắt 50 + nến H4 gần nhất cùng phía EMA21 H4. SL 1×ATR D1, TP 2R, tối đa 7 ngày."""
    H = Hall[:-1]; n = len(H); I = ind(H); Di = ind(D); H4 = agg(H, 14400); I4 = ind(H4)
    trades = []; pos = None; qd = q4 = -1; st = None
    for j in range(1, n):
        te = H[j]['t'] + 3600
        while qd + 1 < len(D) and D[qd + 1]['t'] + 86400 <= te: qd += 1
        while q4 + 1 < len(H4) and H4[q4 + 1]['t'] + 14400 <= te: q4 += 1
        if pos and exit_check(pos, H[j], te, trades): pos = None
        if qd < 60 or q4 < 24: continue
        c, e50, e50p = Di['c'][qd], Di['e50'][qd], Di['e50'][qd - 5]
        trD = 1 if c > e50 and e50 > e50p else -1 if c < e50 and e50 < e50p else 0
        w = I4['rsi'][q4 - 23:q4 + 1]; rmin, rmax = min(w), max(w); side = 1 if H4[q4]['c'] > I4['e21'][q4] else -1
        pulled = rmin < 40 if trD == 1 else rmax > 60 if trD == -1 else False
        if j == n - 1: st = {'trD': trD, 'rmin': rmin, 'rmax': rmax, 'side': side, 'pulled': pulled, 'rsi': I['rsi'][j], 'rsi_prev': I['rsi'][j - 1], 'datr': Di['atr'][qd], 'dc': c, 'e50': e50, 'e50p': e50p, 'h4e21': I4['e21'][q4], 'h4c': H4[q4]['c']}
        if pos or not trD or not pulled or side != trD: continue
        if (I['rsi'][j] > 50 and I['rsi'][j - 1] <= 50) if trD == 1 else (I['rsi'][j] < 50 and I['rsi'][j - 1] >= 50):
            e = H[j]['c']; r = Di['atr'][qd]; pos = {'d': trD, 't': te, 'e': round(e, 2), 'sl': round(e - trD * r, 2), 'tp': round(e + 2 * trD * r, 2), 'r': round(r, 2)}
    if pos:
        b = Hall[-1]
        if exit_check(pos, b, b['t'] + 3600, trades): pos = None
    return trades, pos, st

def h4_method(Hall, D):
    """Dự phòng: D1 giá vs EMA50 dốc 5 ngày → RSI H4 <45 / >55 trong 12 nến H4 → EMA9 cắt EMA21 H4. SL đáy/đỉnh 12 nến H4 ±0.3 ATR H4, TP 2R, tối đa 7 ngày."""
    H4 = agg(Hall, 14400); last_closed = Hall[-1]['t'] + 3600 >= H4[-1]['t'] + 14400
    B = H4 if last_closed else H4[:-1]; I = ind(B); Di = ind(D); n = len(B)
    trades = []; pos = None; qd = -1; st = None
    for j in range(1, n):
        te = B[j]['t'] + 14400
        while qd + 1 < len(D) and D[qd + 1]['t'] + 86400 <= te: qd += 1
        if pos and exit_check(pos, B[j], te, trades): pos = None
        if qd < 60 or j < 24: continue
        c, e50, e50p = Di['c'][qd], Di['e50'][qd], Di['e50'][qd - 5]
        trD = 1 if c > e50 and e50 > e50p else -1 if c < e50 and e50 < e50p else 0
        w = I['rsi'][j - 11:j + 1]; pulled = min(w) < 45 if trD == 1 else max(w) > 55 if trD == -1 else False
        x = (I['e9'][j] > I['e21'][j] and I['e9'][j - 1] <= I['e21'][j - 1]) if trD == 1 else (I['e9'][j] < I['e21'][j] and I['e9'][j - 1] >= I['e21'][j - 1]) if trD == -1 else False
        if j == n - 1: st = {'trD': trD, 'pulled': pulled, 'rmin': min(w), 'rmax': max(w), 'e9': I['e9'][j], 'e21': I['e21'][j], 'next': B[j]['t'] + 28800}
        if pos or not (trD and pulled and x): continue
        lo = min(b['l'] for b in B[j - 11:j + 1]); hi = max(b['h'] for b in B[j - 11:j + 1]); e = B[j]['c']
        sl = lo - 0.3 * I['atr'][j] if trD == 1 else hi + 0.3 * I['atr'][j]; r = abs(e - sl)
        if r < 0.3 * I['atr'][j]: continue
        pos = {'d': trD, 't': te, 'e': round(e, 2), 'sl': round(sl, 2), 'tp': round(e + 2 * trD * r, 2), 'r': round(r, 2)}
    if pos:
        b = Hall[-1]
        if exit_check(pos, b, b['t'] + 3600, trades): pos = None
    return trades, pos, st

# ---------------- ICT (giống ict.js) ----------------
def swings(B, n):
    out = []
    for i in range(n, len(B) - n):
        h = all(B[j]['h'] < B[i]['h'] for j in range(i - n, i + n + 1) if j != i); l = all(B[j]['l'] > B[i]['l'] for j in range(i - n, i + n + 1) if j != i)
        if h: out.append({'i': i, 'p': B[i]['h'], 'k': 'H', 'conf': i + n})
        if l: out.append({'i': i, 'p': B[i]['l'], 'k': 'L', 'conf': i + n})
    return out
def structure(B, n=3):
    sw = swings(B, n); ev = []; trend = 0; k = 0; Hs = Ls = None
    for j, b in enumerate(B):
        while k < len(sw) and sw[k]['conf'] <= j:
            s = dict(sw[k]); k += 1
            if s['k'] == 'H': Hs = s
            else: Ls = s
        if Hs and not Hs.get('used') and b['c'] > Hs['p']: ev.append({'type': 'MSS' if trend == -1 else 'BOS', 'dir': 1, 'p': Hs['p'], 't': b['t']}); Hs['used'] = True; trend = 1
        if Ls and not Ls.get('used') and b['c'] < Ls['p']: ev.append({'type': 'MSS' if trend == 1 else 'BOS', 'dir': -1, 'p': Ls['p'], 't': b['t']}); Ls['used'] = True; trend = -1
    return ev, trend
def fvgs(B):
    rng = sum(b['h'] - b['l'] for b in B[-100:]) / max(1, min(100, len(B))); mn = rng * 0.15; out = []
    for i in range(2, len(B)):
        a, c = B[i - 2], B[i]
        if c['l'] - a['h'] > mn: out.append({'i0': i - 1, 'top': c['l'], 'bot': a['h'], 'up': 1, 't': B[i - 1]['t']})
        elif a['l'] - c['h'] > mn: out.append({'i0': i - 1, 'top': a['l'], 'bot': c['h'], 'up': 0, 't': B[i - 1]['t']})
    for f in out:
        f['filled'] = any((B[j]['l'] <= f['bot']) if f['up'] else (B[j]['h'] >= f['top']) for j in range(f['i0'] + 2, len(B)))
    return out
def crt(H4, Bh, closed_last):
    out = []
    for k in range(1, len(H4)):
        c1, c2 = H4[k - 1], H4[k]; d = 0
        if c2['h'] > c1['h'] and c1['l'] < c2['c'] < c1['h']: d = -1
        elif c2['l'] < c1['l'] and c1['l'] < c2['c'] < c1['h']: d = 1
        if not d: continue
        x = {'d': d, 'hi': c1['h'], 'lo': c1['l'], 'ext': c2['h'] if d == -1 else c2['l'], 'target': c1['l'] if d == -1 else c1['h'], 't': c1['t'], 'live': k == len(H4) - 1 and not closed_last, 'res': ''}
        if not x['live']:
            for b in (b for b in Bh if b['t'] >= c2['t'] + 14400):
                if (b['h'] > x['ext']) if d == -1 else (b['l'] < x['ext']): x['res'] = 'fail'; break
                if (b['l'] <= x['target']) if d == -1 else (b['h'] >= x['target']): x['res'] = 'hit'; break
        out.append(x)
    return out

# ---------------- mức thanh khoản (giống plan.js: ngày bắt đầu 20:00 NY, phiên Á 20:00–24:00 NY, London 02:00–05:00 NY) ----------------
def levels(H):
    days = {}
    for b in H:
        d = dt.datetime.fromtimestamp(b['t'], NY); k = (d + dt.timedelta(hours=4)).date(); m = d.hour * 60 + d.minute
        D = days.setdefault(k, {'h': -1e9, 'l': 1e9, 'aH': -1e9, 'aL': 1e9, 'lH': -1e9, 'lL': 1e9, 'mo': None})
        D['h'] = max(D['h'], b['h']); D['l'] = min(D['l'], b['l'])
        if m >= 1200: D['aH'] = max(D['aH'], b['h']); D['aL'] = min(D['aL'], b['l'])
        elif m < 1080:
            if D['mo'] is None and m < 60: D['mo'] = b['o']
            if 120 <= m < 300: D['lH'] = max(D['lH'], b['h']); D['lL'] = min(D['lL'], b['l'])
    ks = sorted(days); D, P = days[ks[-1]], days[ks[-2]]
    out = [('PDH', P['h']), ('PDL', P['l'])]
    if D['aH'] > 0: out += [('Đỉnh Á', D['aH']), ('Đáy Á', D['aL'])]
    if D['lH'] > 0: out += [('Đỉnh London', D['lH']), ('Đáy London', D['lL'])]
    if D['mo']: out.append(('Midnight Open', D['mo']))
    return [{'n': a, 'p': round(b, 2)} for a, b in out]

def news():
    try: ev = get('https://nfs.faireconomy.media/ff_calendar_thisweek.json', 2)
    except Exception as e: print('Không lấy được lịch tin:', e); return None
    now = time.time(); out = []
    for e in ev:
        if e.get('country') != 'USD' or e.get('impact') != 'High': continue
        try: t = dt.datetime.fromisoformat(e['date']).timestamp()
        except Exception: continue
        if now - 3 * 3600 <= t <= now + 36 * 3600: out.append({'t': int(t), 'title': e.get('title', ''), 'fc': e.get('forecast', ''), 'prev': e.get('previous', '')})
    return sorted(out, key=lambda x: x['t'])

# ---------------- viết nhận định ----------------
def f2(x): return f'{x:,.2f}'
def write_note(now_t, H, D, src, M, H4m, ict, lv, nw, prev_pos, prev_h4pos):
    trades, pos, s = M; t4, pos4, s4 = H4m
    px = H[-1]['c']; p1 = H[-2]['c'] if len(H) > 1 else px; p24 = H[-25]['c'] if len(H) > 25 else px
    dw = lambda d: 'MUA' if d == 1 else 'BÁN'
    lines = []; act = 'WAIT'
    # trạng thái phương pháp chính
    just_closed = [x for x in trades if prev_pos and x['t'] == prev_pos['t']]
    if pos and (not prev_pos or prev_pos['t'] != pos['t']):
        act = 'SIGNAL'; R = (px - pos['e']) * pos['d'] / pos['r']
        title = f"🔔 TÍN HIỆU {dw(pos['d'])} — Entry {f2(pos['e'])} · SL {f2(pos['sl'])} · TP {f2(pos['tp'])}"
        lines.append(f"Phương pháp chính vừa cho tín hiệu lúc {fmt(pos['t'])}. Vào {dw(pos['d'])} 0.01 lot (tài khoản Cent), đặt NGAY SL {f2(pos['sl'])} và TP {f2(pos['tp'])} (SL cách {pos['r']:.1f}$). Có thể vào trễ tới 8 giờ, giữ nguyên SL/TP này; nếu giá đã chạm SL hoặc TP trước khi bạn vào thì bỏ qua.")
    elif pos:
        act = 'HOLD'; R = (px - pos['e']) * pos['d'] / pos['r']
        title = f"🟢 ĐANG GIỮ LỆNH {dw(pos['d'])} — hiện {R:+.2f}R"
        lines.append(f"Lệnh {dw(pos['d'])} từ {fmt(pos['t'])} ở {f2(pos['e'])}, SL {f2(pos['sl'])}, TP {f2(pos['tp'])}. Giá {f2(px)} = {R:+.2f}R. Giữ nguyên, KHÔNG dời SL, đóng chậm nhất {fmt(pos['t'] + 7 * 86400)}.")
    elif just_closed:
        x = just_closed[-1]; act = 'CLOSED'
        title = f"🏁 ĐÓNG LỆNH {dw(x['d'])} — {x['why']} = {x['R']:+.2f}R"
        lines.append(f"Lệnh {dw(x['d'])} vào {fmt(x['t'])} ở {f2(x['e'])} đã đóng lúc {fmt(x['xt'])} ({x['why']}) = {x['R']:+.2f}R. Không có lệnh mới — tiếp tục theo dõi.")
    elif not s or not s['trD']:
        act = 'NOTRADE'; title = '⚪ ĐỨNG NGOÀI — D1 chưa có xu hướng rõ'
        if s: lines.append(f"D1: giá {f2(s['dc'])} so với EMA50 {f2(s['e50'])} (5 ngày trước {f2(s['e50p'])}) — không thỏa luật ① nên phương pháp không giao dịch.")
    else:
        need = 'dưới 40' if s['trD'] == 1 else 'trên 60'; got = s['rmin'] if s['trD'] == 1 else s['rmax']
        if not s['pulled']:
            act = 'WAIT'; title = f"🟡 CHỜ HỒI — D1 {'TĂNG' if s['trD'] == 1 else 'GIẢM'}, chỉ tìm lệnh {dw(s['trD'])}"
            lines.append(f"② RSI H4 {'thấp' if s['trD'] == 1 else 'cao'} nhất 4 ngày qua = {got:.1f}, cần {need}. Giá chưa {'giảm' if s['trD'] == 1 else 'hồi lên'} đủ sâu → KHÔNG vào, không {'mua' if s['trD'] == 1 else 'bán'} đuổi. Vùng {'hỗ trợ' if s['trD'] == 1 else 'kháng cự'} để chờ: EMA21 H4 {f2(s['h4e21'])}.")
        elif s['side'] != s['trD']:
            act = 'WAIT'; title = '🟡 ĐÃ HỒI — chờ nến H4 đóng lại đúng phía EMA21'
            lines.append(f"② ✅ RSI H4 đã {'xuống' if s['trD'] == 1 else 'lên'} {got:.1f}. ③ ❌ Nến H4 gần nhất đóng {f2(s['h4c'])} {'dưới' if s['trD'] == 1 else 'trên'} EMA21 H4 {f2(s['h4e21'])} → chờ nến H4 đóng {'TRÊN' if s['trD'] == 1 else 'DƯỚI'} EMA21.")
        else:
            act = 'READY'; gap = 50 - s['rsi'] if s['trD'] == 1 else s['rsi'] - 50
            title = f"🟠 SẴN SÀNG {dw(s['trD'])} — chờ RSI H1 cắt {'LÊN' if s['trD'] == 1 else 'XUỐNG'} 50 (đang {s['rsi']:.1f})"
            lines.append(f"①②③ đã đủ trừ bước cuối: RSI H1 = {s['rsi']:.1f} (giờ trước {s['rsi_prev']:.1f}), còn cách 50 khoảng {max(gap, 0):.1f} điểm. Khi một nến H1 đóng với RSI {'trên' if s['trD'] == 1 else 'dưới'} 50 → vào {dw(s['trD'])}, SL ≈ {s['datr']:.1f}$ (1×ATR D1), TP ≈ {2 * s['datr']:.1f}$.")
    # bối cảnh giá
    lines.append(f"Giá {f2(px)} ({px - p1:+.1f}$ so với 1 giờ trước, {px - p24:+.1f}$ so với 24 giờ trước). RSI: D1 {ind(D[:-1])['rsi'][-1]:.0f} · H1 {s['rsi']:.0f}." if s else f"Giá {f2(px)}.")
    near = sorted(lv, key=lambda L: abs(L['p'] - px))[:3]
    if near: lines.append('Mức thanh khoản gần: ' + ' · '.join(f"{L['n']} {f2(L['p'])} ({L['p'] - px:+.1f}$)" for L in near) + '.')
    if ict: lines.append(ict)
    if s4:
        if pos4: lines.append(f"Phương pháp dự phòng H4: đang có lệnh {dw(pos4['d'])} từ {fmt(pos4['t'])} ở {f2(pos4['e'])}, SL {f2(pos4['sl'])}, TP {f2(pos4['tp'])}.")
        elif not s4['trD']: lines.append('Phương pháp dự phòng H4: D1 không rõ xu hướng → đứng ngoài.')
        else: lines.append(f"Phương pháp dự phòng H4: {'đã hồi ✅' if s4['pulled'] else 'chưa hồi ❌'} (RSI H4 {'thấp' if s4['trD'] == 1 else 'cao'} nhất 12 nến = {s4['rmin'] if s4['trD'] == 1 else s4['rmax']:.1f}), EMA9 H4 {'trên' if s4['e9'] > s4['e21'] else 'dưới'} EMA21 → {'chờ EMA9 cắt ' + ('LÊN' if s4['trD'] == 1 else 'XUỐNG') + ' EMA21 H4' if s4['pulled'] else 'chưa có setup'}.")
    if nw:
        up = [e for e in nw if e['t'] >= now_t - 1800][:4]
        if up: lines.append('⚠️ Tin đỏ USD sắp tới: ' + ' · '.join(f"{fmt(e['t'])} {e['title']}" for e in up) + ' — không mở lệnh mới trong 30 phút trước/sau tin.')
    return {'t': now_t, 'bar': H[-1]['t'], 'px': round(px, 2), 'act': act, 'title': title, 'lines': lines}

def ict_text(Hh, H4, last_closed4):
    B = Hh[-300:]; ev, trend = structure(B, 3); fv = [f for f in fvgs(B) if not f['filled']]; px = B[-1]['c']
    cr = crt([b for b in H4 if b['t'] >= B[0]['t']], B, last_closed4)
    parts = [f"ICT H1: cấu trúc {'TĂNG' if trend == 1 else 'GIẢM' if trend == -1 else 'chưa rõ'}"]
    if ev: e = ev[-1]; parts.append(f"{e['type']} {'tăng' if e['dir'] == 1 else 'giảm'} gần nhất lúc {fmt(e['t'])} (qua {f2(e['p'])})")
    up = sorted([f for f in fv if f['bot'] > px], key=lambda f: f['bot'])[:1]; dn = sorted([f for f in fv if f['top'] < px], key=lambda f: -f['top'])[:1]
    if up: parts.append(f"FVG chưa lấp phía trên {f2(up[0]['bot'])}–{f2(up[0]['top'])}")
    if dn: parts.append(f"FVG chưa lấp phía dưới {f2(dn[0]['bot'])}–{f2(dn[0]['top'])}")
    if cr:
        c = cr[-1]; parts.append(f"CRT H4 {fmt(c['t'])}: {'quét đáy → mục tiêu lên' if c['d'] == 1 else 'quét đỉnh → mục tiêu xuống'} {f2(c['target'])} ({'nến 2 chưa đóng' if c['live'] else 'đã đạt' if c['res'] == 'hit' else 'đã hỏng' if c['res'] == 'fail' else 'đang chờ'})")
    summary = {'trend': trend, 'last': ev[-1] if ev else None, 'last_mss': next((e for e in reversed(ev) if e['type'] == 'MSS'), None),
               'fvg_up': up[0] if up else None, 'fvg_dn': dn[0] if dn else None, 'crt': cr[-1] if cr else None}
    return ' · '.join(parts) + '.', summary

def table(H, D):
    rows = []
    for name, B in (('D1', D[:-1]), ('H4', agg(H[:-1], 14400)), ('H1', H[:-1])):
        I = ind(B); k = len(B) - 1; c = I['c'][k]
        tr = 1 if c > I['e50'][k] > I['e200'][k] else -1 if c < I['e50'][k] < I['e200'][k] else 0
        rows.append({'tf': name, 'c': round(c, 2), 'e21': round(I['e21'][k], 2), 'e50': round(I['e50'][k], 2), 'e200': round(I['e200'][k], 2), 'rsi': round(I['rsi'][k], 1), 'hist': round(I['hist'][k], 2), 'hist_prev': round(I['hist'][k - 1], 2), 'trend': tr})
    return rows

def run(prev_path, out_dir):
    prev = {}
    if prev_path and os.path.exists(prev_path):
        try: prev = json.load(open(prev_path, encoding='utf-8'))
        except Exception: prev = {}
    H, D, src = load()
    now_t = int(time.time())
    M = main_method(H, D); M4 = h4_method(H, D)
    H4 = agg(H, 14400); lc4 = H[-1]['t'] + 3600 >= H4[-1]['t'] + 14400
    ictS, ictO = ict_text(H, H4, lc4); lv = levels(H); nw = news()
    note = write_note(now_t, H, D, src, M, M4, ictS, lv, nw, prev.get('pos'), prev.get('pos4'))
    J = {str(x['t']): x for x in prev.get('journal', [])}; J.update({str(x['t']): x for x in M[0]})
    J4 = {str(x['t']): x for x in prev.get('journal4', [])}; J4.update({str(x['t']): x for x in M4[0]})
    notes = [x for x in prev.get('notes', []) if x.get('bar') != note['bar']] + [note]
    out = {'updated': now_t, 'src': src, 'px': round(H[-1]['c'], 2), 'bar': H[-1]['t'], 'note': note, 'notes': notes[-KEEP_NOTES:],
           'pos': M[1], 'state': M[2], 'pos4': M4[1], 'state4': M4[2], 'journal': sorted(J.values(), key=lambda x: x['t']), 'journal4': sorted(J4.values(), key=lambda x: x['t']),
           'levels': lv, 'ind': table(H, D), 'ict': ictO, 'news': nw, 'from': H[0]['t']}
    os.makedirs(out_dir, exist_ok=True)
    json.dump(out, open(os.path.join(out_dir, 'live.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(note['title']); [print(' -', l) for l in note['lines']]

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    run(sys.argv[1] if len(sys.argv) > 1 else '', sys.argv[2] if len(sys.argv) > 2 else '.')
