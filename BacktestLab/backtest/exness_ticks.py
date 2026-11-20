"""Tải dữ liệu tick công khai của Exness (ticks.ex2archive.com) và dựng nến M5.
Cột ra: time (unix UTC, mở nến), open, high, low, close (giá BID), volume (số tick), spread (Ask-Bid trung bình), spmax.
Dùng: python exness_ticks.py <thư mục ra> [SYMBOL=XAUUSDm] [từ=2021-01] [đến=2026-11]
"""
import os, sys, time, zipfile, urllib.request
import pandas as pd

out_dir = sys.argv[1]; sym = sys.argv[2] if len(sys.argv) > 2 else 'XAUUSDm'
y0, m0 = map(int, (sys.argv[3] if len(sys.argv) > 3 else '2021-01').split('-'))
y1, m1 = map(int, (sys.argv[4] if len(sys.argv) > 4 else time.strftime('%Y-%m')).split('-'))
os.makedirs(out_dir, exist_ok=True)
part_dir = os.path.join(out_dir, f'_{sym}_parts'); os.makedirs(part_dir, exist_ok=True)

def months():
    y, m = y0, m0
    while (y, m) <= (y1, m1):
        yield y, m
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)

for y, m in months():
    part = os.path.join(part_dir, f'{y}_{m:02d}.csv')
    if os.path.exists(part): continue
    url = f'https://ticks.ex2archive.com/ticks/{sym}/{y}/{m:02d}/Exness_{sym}_{y}_{m:02d}.zip'
    zp = os.path.join(part_dir, f'{y}_{m:02d}.zip'); t0 = time.time()
    for k in range(4):
        try:
            urllib.request.urlretrieve(url, zp); break
        except Exception as e:
            print('retry', y, m, e, flush=True); time.sleep(5)
    else:
        print('FAILED', y, m, flush=True); continue
    with zipfile.ZipFile(zp) as z:
        df = pd.read_csv(z.open(z.namelist()[0]), usecols=['Timestamp', 'Bid', 'Ask'])
    df['t'] = pd.to_datetime(df.Timestamp, format='ISO8601', utc=True)
    df = df.set_index('t'); df['sp'] = df.Ask - df.Bid
    r = df.Bid.resample('5min').ohlc()
    r['volume'] = df.Bid.resample('5min').count(); r['spread'] = df.sp.resample('5min').mean(); r['spmax'] = df.sp.resample('5min').max()
    r = r.dropna(subset=['open'])
    r.insert(0, 'time', ((r.index - pd.Timestamp('1970-01-01', tz='UTC')) // pd.Timedelta('1s')).astype('int64'))
    r.round(3).to_csv(part, index=False)
    os.remove(zp)
    print(f'{y}-{m:02d}: {len(df):,} tick → {len(r):,} nến M5, spread TB {df.sp.mean():.3f} ({time.time()-t0:.0f}s)', flush=True)

files = sorted(f for f in os.listdir(part_dir) if f.endswith('.csv'))
allp = pd.concat([pd.read_csv(os.path.join(part_dir, f)) for f in files]).drop_duplicates('time').sort_values('time')
dst = os.path.join(out_dir, f'{sym}_M5_exness.csv'); allp.to_csv(dst, index=False)
print('DONE', dst, len(allp), flush=True)
