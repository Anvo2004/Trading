import json, urllib.request, time, sys
out = sys.argv[1]
def get(u):
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent':'Mozilla/5.0'}), timeout=30))
        except Exception as e: time.sleep(2)
    raise
# PAXG 5m full history (with volume)
t = int(time.mktime((2020,9,1,0,0,0,0,0,0)))*1000; end = int(time.time()*1000); rows=[]
while t < end:
    k = get(f'https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval=5m&startTime={t}&limit=1000')
    if not k: break
    rows += [f'{a[0]//1000},{a[1]},{a[2]},{a[3]},{a[4]},{a[5]}' for a in k]; t = k[-1][0] + 300000
open(f'{out}/PAXG_5m_all.csv','w').write('time,open,high,low,close,volume\n'+'\n'.join(rows)); print('PAXG all', len(rows), flush=True)
for iv, rg in [('1d','max'),('1h','730d'),('5m','60d'),('15m','60d')]:
    j = get(f'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval={iv}&range={rg}')['chart']['result'][0]
    q = j['indicators']['quote'][0]; rr=[]
    for i, ts in enumerate(j['timestamp']):
        v=[q[x][i] for x in ('open','high','low','close','volume')]
        if None in v[:4]: continue
        rr.append(f'{ts},{v[0]:.2f},{v[1]:.2f},{v[2]:.2f},{v[3]:.2f},{v[4] or 0}')
    open(f'{out}/GCv_{iv}.csv','w').write('time,open,high,low,close,volume\n'+'\n'.join(rr)); print('GC', iv, len(rr), flush=True)
