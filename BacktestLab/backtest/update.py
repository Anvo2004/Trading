"""Cập nhật dữ liệu Exness mới nhất → train lại (opt.py, walk-forward) → xuất data/opt.js cho trang Báo cáo.
Dùng:  python update.py            (chỉ cập nhật trên máy)
       python update.py --push     (cập nhật + commit + push data/opt.js, data/mtf.js lên GitHub để web tự đổi)
       python update.py --no-mtf   (bỏ qua train đa khung H4/H1/M15/M5, ~1–1.5 giờ)
       python update.py --export-only   (chỉ xuất lại data/mtf.js từ các file Data/mtf_*.json đã có)
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

def export_mtf():
    out = {}
    for tf in ('H4', 'H1', 'M15', 'M5'):
        f = os.path.join(DATA, f'mtf_{tf}.json')
        if os.path.exists(f): out[tf] = json.load(open(f, encoding='utf-8'))
    out['updated'] = time.strftime('%Y-%m-%d %H:%M')
    open(os.path.join(SITE, 'data', 'mtf.js'), 'w', encoding='utf-8').write('window.MTF = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    log('Đã xuất data/mtf.js:', ', '.join(f"{k} WF {v['wf']['oos_exp']:+.3f}R" for k, v in out.items() if k != 'updated'))
def export_ref():
    r = json.load(open(os.path.join(DATA, 'refine.json'), encoding='utf-8'))
    r2 = {k: r[k] for k in ('n_cfg', 'n_bases', 'wf', 'wf_orig', 'wf_tight', 'wf_delay', 'family', 'base', 'key', 'sniper_trades', 'all', 'secs') if k in r}
    open(os.path.join(SITE, 'data', 'refine.js'), 'w', encoding='utf-8').write('window.REF = ' + json.dumps(r2, ensure_ascii=False) + ';\n')
    log('Đã xuất data/refine.js')
if '--export-only' in sys.argv: export_mtf(); export_ref(); raise SystemExit

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

# 3) train đa khung (khung vào lệnh H4 / H1 / M15 / M5)
if '--no-mtf' not in sys.argv:
    for tf in ('H4', 'H1', 'M15', 'M5'):
        log('Train đa khung', tf, '…'); out = run([PY, 'mtf.py', CSV, tf, os.path.join(DATA, f'mtf_{tf}.json')]); log(out.strip().splitlines()[-1][:300])
    export_mtf()
    log('Tinh chỉnh entry M5/M15 …'); run([PY, 'refine.py', CSV, os.path.join(DATA, 'refine.json')]); export_ref()

# 4) đẩy lên GitHub để web cập nhật
if '--push' in sys.argv:
    g = lambda *a: subprocess.run(['git', *a], cwd=SITE, capture_output=True, text=True, encoding='utf-8')
    g('add', 'data/opt.js', 'data/mtf.js', 'data/refine.js')
    if g('diff', '--cached', '--quiet').returncode:
        msg = f"Tự động train lại trên dữ liệu Exness tới {time.strftime('%d/%m/%Y')}"
        c = g('commit', '-m', msg); p = g('push')
        log('git commit/push:', 'OK' if not c.returncode and not p.returncode else (c.stderr + p.stderr)[-500:])
    else: log('opt.js không đổi, không push')
