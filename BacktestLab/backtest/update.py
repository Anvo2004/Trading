"""Cập nhật dữ liệu Exness mới nhất → train lại (opt.py, walk-forward) → xuất data/opt.js cho trang Báo cáo.
Dùng:  python update.py            (chỉ cập nhật trên máy)
       python update.py --push     (cập nhật + commit + push data/opt.js lên GitHub để web tự đổi)
Được Task Scheduler gọi mỗi tuần (xem README trong báo cáo). Dữ liệu gốc ở D:/VoNguyenAn/TRADING/Data (không đẩy lên GitHub).
"""
import os, sys, json, time, subprocess, datetime
sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE); ROOT = os.path.dirname(SITE)
DATA = os.path.join(ROOT, 'Data'); PARTS = os.path.join(DATA, '_XAUUSDm_parts'); PY = sys.executable
CSV, OPT, SCALP = os.path.join(DATA, 'XAUUSDm_M5_exness.csv'), os.path.join(DATA, 'opt_exness.json'), os.path.join(DATA, 'scalp_exness.json')
LOG = open(os.path.join(DATA, 'update.log'), 'a', encoding='utf-8')
def log(*a):
    s = f'[{datetime.datetime.now():%Y-%m-%d %H:%M}] ' + ' '.join(map(str, a)); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()
def run(args):
    env = dict(os.environ, PYTHONIOENCODING='utf-8')
    p = subprocess.run(args, cwd=HERE, env=env, capture_output=True, text=True, encoding='utf-8')
    LOG.write(p.stdout[-4000:] + p.stderr[-4000:]); LOG.flush()
    if p.returncode: raise SystemExit(f'Lỗi khi chạy {args[1]}: {p.stderr[-800:]}')
    return p.stdout

T0 = time.time()
# 1) tải lại tháng gần nhất (file tháng hiện tại trong kho Exness được bổ sung mỗi ngày) + các tháng mới
os.makedirs(PARTS, exist_ok=True)
parts = sorted(f for f in os.listdir(PARTS) if f.endswith('.csv'))
start = parts[-1][:7].replace('_', '-') if parts else '2020-01'
for f in parts:
    if f[:7].replace('_', '-') >= start: os.remove(os.path.join(PARTS, f))
log('Tải tick Exness từ', start, 'tới', time.strftime('%Y-%m'))
out = run([PY, 'exness_ticks.py', DATA, 'XAUUSDm', start, time.strftime('%Y-%m')])
log(out.strip().splitlines()[-1] if out.strip() else 'không có dòng nào')

# 2) train lại toàn bộ lưới tham số + walk-forward
old = json.load(open(OPT, encoding='utf-8'))['pick']['name'] if os.path.exists(OPT) else None
log('Train lại opt.py …')
run([PY, 'opt.py', CSV, OPT, SCALP])
r = json.load(open(OPT, encoding='utf-8'))
keep = ('name', 'n', 'wr', 'exp', 'pf', 'dd', 'ms', 'pos_years', 'worst_year', 'long', 'short', 'ys', 'score')
r['stable_top'] = [{k: x.get(k) for k in keep} for x in r['stable_top']]
r['top'] = [{k: x.get(k) for k in keep} for x in r['top']]
r['updated'] = time.strftime('%Y-%m-%d %H:%M'); r['prev_pick'] = old
open(os.path.join(SITE, 'data', 'opt.js'), 'w', encoding='utf-8').write('window.OPT = ' + json.dumps(r, ensure_ascii=False) + ';\n')
P = r['pick']; changed = old and old != P['name']
log(f"Xong: {P['n']} lệnh, {P['exp']:+.3f}R/lệnh, walk-forward {r['wf']['oos_exp']:+.3f}R ({r['wf']['oos_n']} lệnh)",
    '· PHƯƠNG PHÁP ĐỔI: ' + P['name'] if changed else '· phương pháp giữ nguyên', f'({time.time() - T0:.0f}s)')

# 3) đẩy lên GitHub để web cập nhật
if '--push' in sys.argv:
    g = lambda *a: subprocess.run(['git', *a], cwd=SITE, capture_output=True, text=True, encoding='utf-8')
    g('add', 'data/opt.js')
    if g('diff', '--cached', '--quiet').returncode:
        msg = f"Tự động train lại trên dữ liệu Exness tới {time.strftime('%d/%m/%Y')}"
        c = g('commit', '-m', msg); p = g('push')
        log('git commit/push:', 'OK' if not c.returncode and not p.returncode else (c.stderr + p.stderr)[-500:])
    else: log('opt.js không đổi, không push')
