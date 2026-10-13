"""RouteX Doctor 3.0 — safe, read-only pre-deployment diagnostics.

Run from project root: py routex_doctor.py

Options: --quick (skip frontend build), --offline (skip production requests)

"""

from __future__ import annotations

import argparse

import datetime as dt

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

PROD_FRONT = 'https://routex-frontend.onrender.com'

PROD_BACK = 'https://routex-1-z1hf.onrender.com'

checks = []



def record(level, name, detail, location=''):

    checks.append(dict(status=level, check=name, detail=detail, location=location))

    print(f'[{level:7}] {name}: {detail}')



def read(path):

    try: return path.read_text(encoding='utf-8')

    except (OSError, UnicodeError): return ''



def verify(name, condition, failure, location='', uncertain=True):

    record('PASS' if condition else ('WARNING' if uncertain else 'CRITICAL'), name,

           'Found supporting code (static inspection only)' if condition else failure, location)



def cmd(args, cwd, timeout=180):

    try:

        p = subprocess.run(args, cwd=cwd, capture_output=True, text=True,

                           timeout=timeout, shell=False, errors='replace')

        return p.returncode, (p.stdout + '\n' + p.stderr).strip()

    except (OSError, subprocess.TimeoutExpired) as exc:

        return -1, str(exc)



def http_check(name, url, timeout=18):

    start = time.monotonic()

    try:

        req = Request(url, headers={'User-Agent':'RouteX-Doctor/3.0', 'Accept':'text/html,application/json'})

        with urlopen(req, timeout=timeout) as resp:

            status = resp.status

            resp.read(1024)  # no personal records downloaded or printed

        elapsed = round(time.monotonic()-start, 2)

        if status >= 400: record('CRITICAL',name,f'HTTP {status} ({elapsed}s)',url)

        elif elapsed > 10: record('WARNING',name,f'HTTP {status}; slow response {elapsed}s',url)

        else: record('PASS',name,f'HTTP {status}; {elapsed}s',url)

    except HTTPError as exc: record('CRITICAL',name,f'HTTP {exc.code}',url)

    except (URLError, TimeoutError, OSError) as exc:

        record('WARNING',name,f'Unavailable or timed out: {type(exc).__name__}',url)



def main():

    parser=argparse.ArgumentParser(description=__doc__)

    parser.add_argument('--quick',action='store_true',help='Skip npm production build')

    parser.add_argument('--offline',action='store_true',help='Skip live website checks')

    args=parser.parse_args()

    print('\nROUTEX DOCTOR 3.0 | READ-ONLY |',dt.datetime.now().strftime('%Y-%m-%d %H:%M'))

    print('Project:',ROOT,'\n')

    for path in (SERVER, BOOKING, PASSENGER, DRIVER):

        verify('Required file: '+str(path.relative_to(ROOT)),path.is_file(),

               'File is missing',str(path.relative_to(ROOT)),uncertain=False)

    server,booking,passenger,driver = map(read,(SERVER,BOOKING,PASSENGER,DRIVER))

    if SERVER.exists():

        code,output=cmd(['node','--check','server.js'],BACKEND,35)

        record('PASS' if code==0 else 'CRITICAL','Backend JavaScript syntax',

               'Syntax valid' if code==0 else output[-900:], 'backend/server.js')

    if not args.quick and FRONTEND.exists():

        code,output=cmd(['npm.cmd' if os.name == 'nt' else 'npm','run','build'],FRONTEND,300)

        record('PASS' if code==0 else 'CRITICAL','Frontend production build',

               'Build successful' if code==0 else output[-1600:], 'frontend')

    else: record('SKIPPED','Frontend production build','Skipped (--quick)')

    verify('Backend fare endpoint', ('/calculate-fare' in server and 'app.get' in server),

           'Could not locate GET /calculate-fare','backend/server.js')

    verify('Road distance pricing', 'distance_km' in server and ('OSRM' in server or 'osrm' in server),

           'Review OSRM distance-based fare calculation','backend/server.js')

    verify('Out-of-town fee', 'out_of_town_fee' in server,

           'Could not locate out-of-town fee','backend/server.js')

    verify('Long-distance fare allowance',bool(re.search(r'distance_km|distanceKm',server)) and

           ('longDistance' in server or 'long_distance' in server or 'extraDistance' in server or 'longOutOfTown' in server or 'distanceBeyond' in server),

           'Cannot confirm the new >20 km allowance; inspect fare helper manually','backend/server.js')

    verify('Long out-of-town pickup waiver',

           'isLongOutOfTownRide' in server and 'pickupSurcharge' in server,

           'Cannot confirm Ride Now pickup surcharge waiver for long out-of-town rides','backend/server.js')

    verify('Flexible pickup selection', all((
        'setSelectedPickup' in booking, 'useCurrentPickupLocation' in booking,
        'searchPickupAddress' in booking, 'reverseMapLocation' in booking,
        'pickup_lat: String(selectedPickup.lat)' in booking,
        'pickup_lng: String(selectedPickup.lng)' in booking,
        'pickup_lat: selectedPickup.lat' in booking,
        'pickup_lng: selectedPickup.lng' in booking)),
           'Review pickup selection and coordinate consistency', 'frontend/app/bookings/page.tsx')

    verify('Scheduled selected pickup', 'selectedPickup' in booking and 'scheduled' in booking,

           'Review scheduled pickup source','frontend/app/bookings/page.tsx')

    verify('Scheduled release', 'releaseScheduledBookings' in server,

           'Scheduled release function not identified','backend/server.js')

    verify('Driver matching', '/trip-requests' in server and 'assigned_driver_id' in server,

           'Review matching and driver assignment','backend/server.js')

    verify('Busy-driver protection', 'Busy' in server and 'is_online' in server,

           'Review available/online/busy transitions; static check cannot prove atomicity','backend/server.js')

    verify('Driver GPS freshness', 'last_online_at' in server,

           'Could not find driver heartbeat timestamp checks','backend/server.js')

    verify('Driver location coordinates', 'current_lat' in server and 'current_lng' in server,

           'Could not locate driver location fields','backend/server.js')

    verify('Pickup search limit', 'calculateRouteXPickupDistance' in server,

           'Pickup search function not found; verify current 30 km policy','backend/server.js')

    verify('Live passenger tracking', 'trip_bookings' in passenger or 'tracking' in passenger.lower(),

           'Tracking entry point not identified in passenger portal','frontend/app/passenger-portal/page.tsx')

    verify('Scheduled driver details', 'assigned_driver_id' in server and 'driver_name' in server,

           'Check scheduled passenger API driver details','backend/server.js')

    verify('Promotion fields',all(x in server for x in ('discount_amount','passenger_amount','promo_code')),

           'Check fare/promo consistency across booking lifecycle','backend/server.js')

    verify('WhatsApp integration', 'sendWhatsApp' in server,

           'WhatsApp integration not found (delivery is NOT verified)','backend/server.js')

    verify('API URL configuration', 'API_URL' in booking or 'NEXT_PUBLIC_API_URL' in booking,

           'Review frontend API environment configuration','frontend/app/bookings/page.tsx')

    # Detect risky patterns without printing secret values.

    allcode='\n'.join((server,booking,passenger,driver))

    verify('No old development backend URL', 'routex-development.onrender.com' not in allcode,

           'Old development URL referenced in source','frontend/backend',uncertain=False)

    if re.search(r'https?://localhost:\d+',allcode):

        record('WARNING','Hardcoded localhost','Found localhost in source; confirm production fallback is safe')

    else: record('PASS','Hardcoded localhost','None found in key application files')

    # Local env may legitimately point to localhost during testing; never print contents.

    env=read(FRONTEND/'.env.local')

    if 'NEXT_PUBLIC_API_URL=http://localhost' in env.replace(' ',''):

        record('WARNING','Local frontend environment','Currently points to localhost; do not use for production build/deploy','frontend/.env.local')

    code,output=cmd(['git','status','--porcelain'],ROOT,20)

    if code==0:

        changed=[x for x in output.splitlines() if x.strip()]

        record('WARNING' if changed else 'PASS','Git working tree',

               f'{len(changed)} modified/untracked file(s); inspect git status before deployment' if changed else 'Clean')

    else: record('WARNING','Git working tree','Could not inspect Git status')

    if not args.offline:

        http_check('Production backend reachability',PROD_BACK)

        http_check('Production frontend reachability',PROD_FRONT)

    else: record('SKIPPED','Production HTTP checks','Skipped (--offline)')

    # Do NOT call unauthenticated ride-list APIs: they may expose live passenger data.

    record('NOT_TESTED','Real booking lifecycle', 'Requires controlled test accounts; no bookings created')

    record('NOT_TESTED','Database load / concurrency','Requires database metrics and controlled load test')

    record('NOT_TESTED','WhatsApp delivery','Code presence cannot confirm message delivery')

    record('NOT_TESTED','Groblershoop local service area','Separate town pricing and matching not yet verified')

    totals={s:sum(c['status']==s for c in checks) for s in ('PASS','WARNING','CRITICAL','SKIPPED','NOT_TESTED')}

    report={'tool':'RouteX Doctor 3.0','timestamp':dt.datetime.now().isoformat(timespec='seconds'),

            'project':str(ROOT),'summary':totals,'checks':checks,

            'note':'Static checks are indicators, not proof of production stability. Read-only.'}

    report_dir=ROOT/'doctor_reports'

    report_dir.mkdir(exist_ok=True)

    outfile=report_dir/('routex_doctor_'+dt.datetime.now().strftime('%Y%m%d_%H%M%S')+'.json')

    outfile.write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')

    print('\nSUMMARY:', ', '.join(f'{k}={v}' for k,v in totals.items()))

    print('Report saved:',outfile)

    print('STATUS:', 'BLOCK DEPLOYMENT' if totals['CRITICAL'] else 'REVIEW WARNINGS / MANUAL TESTS')

    return 1 if totals['CRITICAL'] else 0



if __name__=='__main__': sys.exit(main())
