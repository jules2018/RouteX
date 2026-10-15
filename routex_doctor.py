"""RouteX Doctor 4.2 — read-only application and JWT security diagnostics.
Run from project root: py routex_doctor.py [--quick] [--offline]
Does not create bookings, change driver state, or send credentials.
"""
from __future__ import annotations
import argparse
import datetime as dt
import html
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / 'frontend'
BACKEND = ROOT / 'backend'
SERVER = BACKEND / 'server.js'
BOOKING = FRONTEND / 'app/bookings/page.tsx'
PASSENGER = FRONTEND / 'app/passenger-portal/page.tsx'
DRIVER = FRONTEND / 'app/driver-portal/page.tsx'
LOGIN = FRONTEND / 'app/driver-login/page.tsx'
API = FRONTEND / 'app/lib/api.ts'
PKG = BACKEND / 'package.json'
LOCK = BACKEND / 'package-lock.json'
PROD_FRONT = 'https://routex-frontend.onrender.com'
PROD_BACK = 'https://routex-1-z1hf.onrender.com'
CHECKS = []

def read(path):
    try: return path.read_text(encoding='utf-8')
    except (OSError, UnicodeError): return ''

def check(name, ok, failure, location='', critical=False, detail='Supporting source pattern found (static check only)'):
    status = 'PASS' if ok else ('CRITICAL' if critical else 'WARNING')
    add(status, name, detail if ok else failure, location)

def add(status, name, detail, location='', advice=''):
    item = {'status': status, 'check': name, 'detail': detail, 'location': location}
    if status in ('WARNING', 'CRITICAL'):
        item['recommended_change'] = advice or 'Inspect the indicated code or service; verify with a controlled manual test.'
        item['confidence'] = 'static inspection or observed command result; root cause not established'
    CHECKS.append(item)
    print(f'[{status:10}] {name}: {detail}')

def command(args, cwd, timeout=180):
    try:
        result = subprocess.run(args, cwd=cwd, capture_output=True, text=True,
                                timeout=timeout, shell=False, errors='replace')
        return result.returncode, (result.stdout + '\n' + result.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as exc:
        return -1, type(exc).__name__

def route_block(source, method, route):
    # Match Express route registration and inspect only until the next route.
    pattern = r'\bapp\.' + re.escape(method) + r'\s*\(\s*[\'\"]' + re.escape(route) + r'[\'\"]'
    match = re.search(pattern, source)
    if not match: return '', 0, ''
    next_route = re.search(r'\n\s*app\.(?:post|get|put|patch|delete)\s*\(', source[match.end():])
    end = match.end() + next_route.start() if next_route else len(source)
    return source[match.start():end], source.count('\n', 0, match.start()) + 1, source[match.start():match.end()+120]

def endpoint_safeguards(server):
    specs = [
        ('Accept ride', 'post', '/trip-requests/:id/accept', True),
        ('Start ride', 'post', '/trip-requests/:id/start', True),
        ('Complete ride', 'post', '/trip-requests/:id/complete', True),
        ('Driver status', 'post', '/drivers/:id/status', True),
        ('Driver heartbeat', 'post', '/drivers/:id/heartbeat', True),
        ('Driver GPS location', 'post', '/drivers/:id/location', True),
        ('Driver photo upload', 'post', '/driver/upload-photo', False),
    ]
    for label, method, path, path_id in specs:
        block, line, signature = route_block(server, method, path)
        loc = f'backend/server.js:{line}' if line else 'backend/server.js'
        if not block:
            add('CRITICAL', label + ' route', 'Expected route not found', loc)
            continue
        check(label + ' requires JWT middleware',
              bool(re.search(r'\bauthenticateDriver\b', signature)),
              'authenticateDriver not found in route registration', loc, critical=True)
        if path_id:
            check(label + ' enforces token driver ID',
                  'req.authenticatedDriverId' in block and
                  bool(re.search(r'\b(?:req\.params\.id|driverId)\b', block)),
                  'Cannot confirm route compares requested driver with authenticated driver', loc,
                  critical=True)
        else:
            check(label + ' enforces token driver ID',
                  'req.authenticatedDriverId' in block and 'driverId' in block,
                  'Cannot confirm upload belongs to authenticated driver', loc, critical=True)
    for label, route in [('Accept', '/trip-requests/:id/accept'),
                         ('Start', '/trip-requests/:id/start'),
                         ('Complete', '/trip-requests/:id/complete')]:
        block, line, _ = route_block(server, 'post', route)
        check(label + ' uses assigned-driver database constraint',
              'assigned_driver_id' in block if label == 'Accept' else 'assigned_driver_id = $2' in block,
              'Review booking assignment and driver ID constraint', f'backend/server.js:{line}')
    accept, line, _ = route_block(server, 'post', '/trip-requests/:id/accept')
    for name, required in [
        ('Accept transaction', ['pool.connect()', 'BEGIN', 'COMMIT', 'ROLLBACK', 'client.release()']),
        ('Accept conditional claim', ["booking_status = 'Waiting'", 'assigned_driver_id IS NULL', 'RETURNING']),
        ('Accept driver row lock', ['FOR UPDATE']),
    ]:
        check(name, bool(accept) and all(s in accept for s in required),
              'Expected transaction/locking/conditional SQL pattern not confirmed', f'backend/server.js:{line}')
    complete, line, _ = route_block(server, 'post', '/trip-requests/:id/complete')
    check('Complete transaction', bool(complete) and all(s in complete for s in
          ('pool.connect()', 'BEGIN', 'COMMIT', 'ROLLBACK', 'client.release()')),
          'Completion transaction pattern not confirmed', f'backend/server.js:{line}')

def jwt_checks(server, login, driver, pkg, lock):
    check('JWT package declared', bool(re.search(r'"jsonwebtoken"\s*:', pkg)),
          'jsonwebtoken missing from backend/package.json', 'backend/package.json', critical=True)
    check('JWT lockfile includes dependency', 'node_modules/jsonwebtoken' in lock,
          'jsonwebtoken not found in backend/package-lock.json', 'backend/package-lock.json', critical=True)
    check('JWT signing on driver login', 'jwt.sign(' in server and 'DRIVER_JWT_SECRET' in server,
          'Cannot confirm signed driver token', 'backend/server.js', critical=True)
    check('JWT verification uses HS256', bool(re.search(r'jwt\.verify\s*\(', server)) and
          'HS256' in server and 'req.authenticatedDriverId' in server,
          'JWT verification, algorithm restriction, or identity binding not confirmed',
          'backend/server.js', critical=True)
    check('Driver JWT expiration', bool(re.search(r'expiresIn\s*:\s*[\'\"]7d[\'\"]', server)),
          'Token expiry not confirmed; review jwt.sign options', 'backend/server.js')
    check('Driver login returns token', bool(re.search(r'\btoken\b', route_block(server, 'post', '/driver-login')[0])),
          'Login route token response not confirmed', 'backend/server.js', critical=True)
    check('Frontend stores driver JWT', 'sessionStorage.setItem("driverToken"' in login,
          'Login page does not appear to store token', 'frontend/app/driver-login/page.tsx', critical=True)
    check('Portal requires driver token', 'sessionStorage.getItem("driverToken"' in driver and
          'window.location.replace("/driver-login")' in driver,
          'Portal token guard not confirmed', 'frontend/app/driver-portal/page.tsx')
    check('Login redirect checks token', 'sessionStorage.getItem("driverToken"' in login and
          'if (!storedDriver || !token)' in login,
          'Old sessions may redirect between login and portal without a token',
          'frontend/app/driver-login/page.tsx')
    for label, path in [('Accept ride', '/accept'), ('Start ride', '/start'), ('Complete ride', '/complete'),
                        ('Driver status', '/status'), ('Driver heartbeat', '/heartbeat'),
                        ('Driver GPS', '/location'), ('Photo upload', '/driver/upload-photo')]:
        # Narrow around each fetch call rather than accepting Authorization anywhere in the file.
        candidates = [m.start() for m in re.finditer(re.escape(path), driver)]
        found = any('Authorization' in driver[max(0, pos-180):pos+350] for pos in candidates)
        check(label + ' frontend Bearer header', found,
              'Cannot confirm Bearer token is sent with this request', 'frontend/app/driver-portal/page.tsx')
    check('Backend secret configured locally', bool(os.environ.get('DRIVER_JWT_SECRET')) or
          bool(re.search(r'^\s*DRIVER_JWT_SECRET\s*=\s*\S+', read(BACKEND/'.env'), re.M)),
          'Local backend JWT secret not detected; Render secret cannot be checked from here',
          'backend/.env')
    add('NOT_TESTED', 'Production JWT secret', 'Render environment variable presence cannot be verified without authorized access')
    add('NOT_TESTED', 'Live driver JWT ride actions', 'No live bookings or driver status changes performed')

def http_check(name, url):
    started = time.monotonic()
    try:
        with urlopen(Request(url, headers={'User-Agent':'RouteX-Doctor/4.2',
                                          'Accept':'text/html,application/json'}), timeout=18) as response:
            response.read(512)
            duration = round(time.monotonic() - started, 2)
            add('WARNING' if duration > 10 else 'PASS', name,
                f'HTTP {response.status}; {duration}s', url)
    except HTTPError as exc: add('CRITICAL', name, f'HTTP {exc.code}', url)
    except (URLError, TimeoutError, OSError) as exc:
        add('WARNING', name, 'Unavailable or timed out: ' + type(exc).__name__, url)

def reports():
    counts = {status: sum(x['status'] == status for x in CHECKS)
              for status in ('PASS', 'WARNING', 'CRITICAL', 'SKIPPED', 'NOT_TESTED')}
    now = dt.datetime.now()
    report = {'tool':'RouteX Doctor 4.2', 'timestamp':now.isoformat(timespec='seconds'),
              'project':str(ROOT), 'summary':counts, 'checks':CHECKS,
              'note':'Read-only static diagnostics and HTTP GET reachability. No bookings, account changes or secret values printed.'}
    folder = ROOT/'doctor_reports'
    folder.mkdir(exist_ok=True)
    stem = folder/('routex_doctor_'+now.strftime('%Y%m%d_%H%M%S'))
    json_path = stem.with_suffix('.json')
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    findings = [x for x in CHECKS if x['status'] in ('WARNING', 'CRITICAL')]
    lines = ['ROUTEX DOCTOR 4.2 — ACTION PLAN', 'Generated: '+report['timestamp'],
             'Static checks do not establish the cause of a failure.', '']
    for i, item in enumerate(findings, 1):
        lines.extend([f'{i}. [{item["status"]}] {item["check"]}',
                      'LOCATION: '+item['location'], 'OBSERVED: '+item['detail'],
                      'ACTION: '+item.get('recommended_change','Inspect and retest'), ''])
    if not findings: lines.append('No warnings or critical findings. Controlled live testing may still be required.')
    txt_path = stem.with_suffix('.txt')
    txt_path.write_text('\n'.join(lines), encoding='utf-8')
    esc = lambda x: html.escape(str(x or ''))
    cards = ''.join('<article><b>'+esc(x['status'])+' — '+esc(x['check'])+'</b><p>'+esc(x['detail'])+
                    '</p><small>'+esc(x['location'])+'</small></article>' for x in CHECKS)
    css = '<style>body{background:#101216;color:#eee;font:15px system-ui;max-width:1050px;margin:auto;padding:30px}h1{color:#ff754d}article{background:#202329;border:1px solid #393d46;border-radius:14px;padding:16px;margin:12px 0}p,small{color:#bbc0ca}</style>'
    html_path = stem.with_suffix('.html')
    html_path.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>RouteX Doctor 4.2</title>'+css+
                         '<h1>RouteX Doctor 4.2</h1><p>'+esc(report['timestamp'])+' | '+esc(counts)+'</p>'+cards+'</html>', encoding='utf-8')
    print('\nSUMMARY:', ', '.join(f'{k}={v}' for k,v in counts.items()))
    print('Reports:', json_path, txt_path, html_path, sep='\n  ')
    print('STATUS:', 'BLOCK DEPLOYMENT' if counts['CRITICAL'] else 'REVIEW WARNINGS / MANUAL TESTS')
    return 1 if counts['CRITICAL'] else 0

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--quick', action='store_true', help='Skip frontend build')
    parser.add_argument('--offline', action='store_true', help='Skip production reachability')
    args = parser.parse_args()
    print('\nROUTEX DOCTOR 4.2 | READ-ONLY |', dt.datetime.now().strftime('%Y-%m-%d %H:%M'))
    print('Project:', ROOT, '\n')
    for path in (SERVER, BOOKING, PASSENGER, DRIVER, LOGIN, API, PKG, LOCK):
        check('Required file: '+str(path.relative_to(ROOT)), path.is_file(),
              'File is missing', str(path.relative_to(ROOT)), critical=True, detail='Present')
    server, booking, passenger, driver, login, api, pkg, lock = map(read,
        (SERVER, BOOKING, PASSENGER, DRIVER, LOGIN, API, PKG, LOCK))
    if SERVER.exists():
        rc, output = command(['node', '--check', 'server.js'], BACKEND, 35)
        add('PASS' if rc == 0 else 'CRITICAL', 'Backend JavaScript syntax',
            'Syntax valid' if rc == 0 else output[-800:], 'backend/server.js')
    if args.quick:
        add('SKIPPED', 'Frontend production build', 'Skipped (--quick)')
    elif FRONTEND.exists():
        rc, output = command(['npm.cmd' if os.name == 'nt' else 'npm', 'run', 'build'], FRONTEND, 300)
        add('PASS' if rc == 0 else 'CRITICAL', 'Frontend production build',
            'Build successful' if rc == 0 else output[-1000:], 'frontend')
    base_checks = [
        ('Backend fare endpoint', '/calculate-fare' in server, 'backend/server.js'),
        ('Road distance pricing', 'distance_km' in server and 'osrm' in server.lower(), 'backend/server.js'),
        ('Out-of-town fee', 'out_of_town_fee' in server, 'backend/server.js'),
        ('Long-distance fare allowance', bool(re.search(r'longDistance|long_distance|extraDistance|longOutOfTown|distanceBeyond',server)), 'backend/server.js'),
        ('Long out-of-town pickup waiver', 'isLongOutOfTownRide' in server and 'pickupSurcharge' in server, 'backend/server.js'),
        ('Flexible pickup selection', all(x in booking for x in ('setSelectedPickup','useCurrentPickupLocation','searchPickupAddress','reverseMapLocation')), 'frontend/app/bookings/page.tsx'),
        ('Scheduled selected pickup', 'selectedPickup' in booking and 'scheduled' in booking, 'frontend/app/bookings/page.tsx'),
        ('Scheduled release', 'releaseScheduledBookings' in server, 'backend/server.js'),
        ('Driver matching', '/trip-requests' in server and 'assigned_driver_id' in server, 'backend/server.js'),
        ('Busy-driver protection', 'Busy' in server and 'is_online' in server, 'backend/server.js'),
        ('Driver GPS freshness', 'last_online_at' in server, 'backend/server.js'),
        ('Driver location coordinates', 'current_lat' in server and 'current_lng' in server, 'backend/server.js'),
        ('Pickup search limit', 'calculateRouteXPickupDistance' in server, 'backend/server.js'),
        ('Live passenger tracking', 'trip_bookings' in passenger or 'tracking' in passenger.lower(), 'frontend/app/passenger-portal/page.tsx'),
        ('Scheduled driver details', 'assigned_driver_id' in server and 'driver_name' in server, 'backend/server.js'),
        ('Promotion fields', all(x in server for x in ('discount_amount','passenger_amount','promo_code')), 'backend/server.js'),
        ('WhatsApp integration', 'sendWhatsApp' in server, 'backend/server.js'),
        ('API URL configuration', 'NEXT_PUBLIC_API_URL' in api, 'frontend/app/lib/api.ts'),
    ]
    for label, ok, location in base_checks:
        check(label, ok, 'Expected source pattern not confirmed; inspect implementation', location)
    endpoint_safeguards(server)
    jwt_checks(server, login, driver, pkg, lock)
    allcode = '\n'.join((server, booking, passenger, driver, login, api))
    check('No old development backend URL', 'routex-development.onrender.com' not in allcode,
          'Old development backend URL found', 'frontend/backend')
    check('No hardcoded localhost in application source', not bool(re.search(r'https?://localhost:\d+', allcode)),
          'Found localhost URL in source; verify production fallback', 'frontend/backend')
    env = read(FRONTEND/'.env.local')
    if re.search(r'^\s*NEXT_PUBLIC_API_URL\s*=\s*http://localhost', env, re.M):
        add('WARNING', 'Local frontend environment', 'Local API URL points to localhost', 'frontend/.env.local')
    else:
        add('PASS', 'Local frontend environment', 'No localhost API override detected')
    rc, output = command(['git','status','--porcelain'], ROOT, 20)
    if rc == 0:
        changed = [line for line in output.splitlines() if line.strip()]
        add('WARNING' if changed else 'PASS', 'Git working tree',
            f'{len(changed)} modified/untracked file(s); review before deployment' if changed else 'Clean', 'project root')
    else:
        add('WARNING', 'Git working tree', 'Unable to inspect git status', 'project root')
    if args.offline:
        add('SKIPPED', 'Production reachability', 'Skipped (--offline)')
    else:
        http_check('Production backend reachability', PROD_BACK)
        http_check('Production frontend reachability', PROD_FRONT)
    for label, note in [
        ('Real booking lifecycle', 'No real bookings created'),
        ('Database load / concurrency', 'Requires controlled load testing'),
        ('WhatsApp delivery', 'Code presence does not verify delivery'),
        ('Groblershoop service area', 'Town-specific fares and matching not tested')]:
        add('NOT_TESTED', label, note)
    return reports()

if __name__ == '__main__':
    sys.exit(main())
