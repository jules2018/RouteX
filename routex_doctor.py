# ROUTEX DOCTOR COMPLETE SCRIPT - PART 1 OF 3
# IMPORTANT: Do NOT run this part by itself.
# Combine Parts 1, 2 and 3 in order into ONE file named routex_doctor.py.
# Remove these three instruction lines after combining if you want.

import os
import re
import subprocess
import sys
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


# ============================================================
# ROUTEX DOCTOR
# ============================================================

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"

PRODUCTION_FRONTEND = "https://routex-frontend.onrender.com"
PRODUCTION_BACKEND = "https://routex-1-z1hf.onrender.com"

results = []
problems = []


def pass_check(name, message=""):
    results.append(("PASS", name, message))


def warn_check(name, message=""):
    results.append(("WARN", name, message))
    if message:
        problems.append(("WARNING", name, message))


def fail_check(name, message=""):
    results.append(("FAIL", name, message))
    if message:
        problems.append(("CRITICAL", name, message))


def run_command(command, cwd=None, timeout=120):
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            shell=True,
            timeout=timeout
        )

        return (
            result.returncode,
            result.stdout.strip(),
            result.stderr.strip()
        )

    except subprocess.TimeoutExpired:
        return 999, "", "Command timed out."

    except Exception as exc:
        return 999, "", str(exc)


def read_text(path):
    try:
        return path.read_text(
            encoding="utf-8",
            errors="ignore"
        )
    except Exception:
        return ""


def source_files():
    extensions = {
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".json"
    }

    ignored = {
        "node_modules",
        ".next",
        ".git",
        "dist",
        "build"
    }

    for base in [FRONTEND, BACKEND]:
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if not path.is_file():
                continue

            if path.suffix.lower() not in extensions:
                continue

            if any(part in ignored for part in path.parts):
                continue

            yield path


def find_in_project(pattern):
    matches = []

    regex = re.compile(
        pattern,
        re.IGNORECASE
    )

    for path in source_files():
        text = read_text(path)

        for line_number, line in enumerate(
            text.splitlines(),
            start=1
        ):
            if regex.search(line):
                matches.append(
                    (
                        path,
                        line_number,
                        line.strip()
                    )
                )

    return matches


def relative(path):
    try:
        return path.relative_to(ROOT)
    except Exception:
        return path


# ============================================================
# HEADER
# ============================================================

print()
print("=" * 64)
print("                      ROUTEX DOCTOR")
print("=" * 64)
print()
print(f"Project: {ROOT}")
print()


# ============================================================
# 1. PROJECT STRUCTURE
# ============================================================

print("Checking RouteX project structure...")

required_paths = [
    FRONTEND,
    BACKEND,
    BACKEND / "server.js",
    FRONTEND / "app",
]

missing = [
    path
    for path in required_paths
    if not path.exists()
]

if missing:
    fail_check(
        "Project structure",
        "Missing: "
        + ", ".join(
            str(relative(path))
            for path in missing
        )
    )
else:
    pass_check("Project structure")


# ============================================================
# 2. IMPORTANT FRONTEND PAGES
# ============================================================

important_pages = {
    "Passenger portal":
        FRONTEND / "app" / "passenger-portal" / "page.tsx",

    "Driver portal":
        FRONTEND / "app" / "driver-portal" / "page.tsx",

    "Booking page":
        FRONTEND / "app" / "bookings" / "page.tsx",
}

for name, path in important_pages.items():
    if path.exists():
        pass_check(name)
    else:
        fail_check(
            name,
            f"Missing {relative(path)}"
        )


# ============================================================
# 3. BACKEND JAVASCRIPT SYNTAX
# ============================================================

server_file = BACKEND / "server.js"

if server_file.exists():

    code, stdout, stderr = run_command(
        'node --check "server.js"',
        cwd=BACKEND,
        timeout=30
    )

    if code == 0:
        pass_check("Backend syntax")
    else:
        fail_check(
            "Backend syntax",
            stderr or stdout
        )

else:
    fail_check(
        "Backend syntax",
        "backend/server.js does not exist."
    )


# ============================================================
# 4. OLD PASSENGER PORTAL REFERENCES
# ============================================================

old_portal = find_in_project(
    r"/passenger-portal-new"
)

if old_portal:

    details = []

    for path, line_number, line in old_portal[:10]:
        details.append(
            f"{relative(path)}:{line_number} -> {line}"
        )

    fail_check(
        "Old test URLs",
        "Found /passenger-portal-new:\n"
        + "\n".join(details)
    )

else:
    pass_check("Old test URLs")


# ============================================================
# 5. LOCALHOST REFERENCES
# ============================================================

localhost_matches = find_in_project(
    r"https?://localhost(?::\d+)?"
)

if localhost_matches:

    details = []

    for path, line_number, line in localhost_matches[:10]:
        details.append(
            f"{relative(path)}:{line_number} -> {line}"
        )

    warn_check(
        "Localhost URLs",
        "Hardcoded localhost reference(s) found:\n"
        + "\n".join(details)
    )

else:
    pass_check("Localhost URLs")


# ============================================================
# 6. DEVELOPMENT RENDER URLS
# ============================================================

development_urls = find_in_project(
    r"routex-development\.onrender\.com"
)

if development_urls:

    details = []

    for path, line_number, line in development_urls[:10]:
        details.append(
            f"{relative(path)}:{line_number} -> {line}"
        )

    fail_check(
        "Development URLs",
        "Old development Render URL found:\n"
        + "\n".join(details)
    )

else:
    pass_check("Development URLs")


# ============================================================
# 7. FRONTEND API CONFIGURATION
# ============================================================

api_url_matches = find_in_project(
    r"\bAPI_URL\b"
)

if api_url_matches:
    pass_check(
        "Frontend API configuration",
        f"API_URL found in {len(api_url_matches)} source location(s)."
    )
else:
    warn_check(
        "Frontend API configuration",
        "No API_URL references were found."
    )


# ============================================================
# 8. REQUIRED BACKEND ENVIRONMENT VARIABLE NAMES
# ============================================================

env_file = BACKEND / ".env"

required_env_names = [
    "WHATSAPP_ACCESS_TOKEN",
]

if env_file.exists():
    env_text = read_text(env_file)

    missing_env = []

    for variable in required_env_names:
        pattern = rf"(?m)^\s*{re.escape(variable)}\s*="

        if not re.search(pattern, env_text):
            missing_env.append(variable)

    if missing_env:
        pass_check(
            "Environment",
            "Local production-only variable(s) not configured: "
            + ", ".join(missing_env)
            + ". Production secrets may be configured directly on Render."
        )
    else:
        pass_check(
            "Environment",
            "Required local variable names found. Values hidden."
        )

else:
    pass_check(
        "Environment",
        "No local backend/.env found. Production secrets may be configured on Render."
    )

# ============================================================
# 9. SCHEDULED RIDE BACKEND CHECKS
# ============================================================

server_text = read_text(server_file)

scheduled_checks = {
    "Scheduled release function":
        "releaseScheduledBookings",

    "Scheduled rides endpoint":
        'app.get("/scheduled-rides"',

    "Passenger scheduled endpoint":
        'app.get("/passenger-scheduled-bookings/:passengerId"',
}

for name, text in scheduled_checks.items():

    if text in server_text:
        pass_check(name)
    else:
        fail_check(
            name,
            f"Could not find: {text}"
        )


# ============================================================
# 10. LIVE REQUEST SEPARATION
# ============================================================

trip_request_position = server_text.find(
    'app.get("/trip-requests"'
)

if trip_request_position != -1:

    section = server_text[
        trip_request_position:
        trip_request_position + 5000
    ]

    if (
        "ride_type = 'now'" in section
        or "ride_type='now'" in section
    ):
        pass_check(
            "Ride Now / Scheduled separation"
        )
    else:
        fail_check(
            "Ride Now / Scheduled separation",
            "/trip-requests does not appear to filter ride_type = 'now'."
        )

else:
    fail_check(
        "Ride Now / Scheduled separation",
        "/trip-requests endpoint not found."
    )


# ============================================================
# 11. SCHEDULED WHATSAPP ALERT
# ============================================================

release_position = server_text.find(
    "async function releaseScheduledBookings"
)

if release_position != -1:

    release_section = server_text[
        release_position:
        release_position + 9000
    ]

    if "sendWhatsAppBookingAlert" in release_section:
        pass_check(
            "Scheduled WhatsApp alerts"
        )
    else:
        warn_check(
            "Scheduled WhatsApp alerts",
            "Scheduled release function does not appear to call "
            "sendWhatsAppBookingAlert()."
        )


# ============================================================
# 12. FRONTEND PRODUCTION BUILD
# ============================================================

print("Running frontend production build...")
# ROUTEX DOCTOR COMPLETE SCRIPT - PART 2 OF 3
# IMPORTANT: Do NOT run this part by itself.
# Combine Parts 1, 2 and 3 in order into ONE file named routex_doctor.py.
# Remove these three instruction lines after combining if you want.

print("This can take a little while.")
print()

if FRONTEND.exists():

    code, stdout, stderr = run_command(
        "npm run build",
        cwd=FRONTEND,
        timeout=240
    )

    if code == 0:
        pass_check("Frontend production build")
    else:

        error_text = stderr or stdout

        if len(error_text) > 3000:
            error_text = error_text[-3000:]

        fail_check(
            "Frontend production build",
            error_text
        )

else:
    fail_check(
        "Frontend production build",
        "Frontend directory not found."
    )


# ============================================================
# 12A. SCHEDULED-RIDE ARCHITECTURE CONTRACT
# ============================================================

passenger_portal_text = read_text(
    FRONTEND / "app" / "passenger-portal" / "page.tsx"
)
driver_portal_text = read_text(
    FRONTEND / "app" / "driver-portal" / "page.tsx"
)

def require_terms(name, source, terms, area, expected):
    missing = [term for term in terms if term not in source]
    if missing:
        fail_check(
            name,
            f"Likely area: {area}\n"
            f"Missing: {', '.join(missing)}\n"
            f"Expected: {expected}"
        )
    else:
        pass_check(name)

# Passenger confirms exact GPS for scheduled pickup.
has_confirmation_route = any(
    term in server_text
    for term in (
        "pickup-location",
        "confirm-pickup",
        "pickup_location_confirmed",
    )
)

if has_confirmation_route and "pickup_lat" in server_text and "pickup_lng" in server_text:
    pass_check("Scheduled pickup GPS endpoint")
else:
    fail_check(
        "Scheduled pickup GPS endpoint",
        "Likely area: backend/server.js\n"
        "Expected a scheduled pickup confirmation endpoint that stores "
        "pickup_lat and pickup_lng. GPS confirmation is for navigation "
        "and must not change the booked fare."
    )

require_terms(
    "Passenger pickup GPS confirmation",
    passenger_portal_text,
    ["navigator.geolocation", "pickup_lat", "pickup_lng"],
    "frontend/app/passenger-portal/page.tsx",
    "Passenger confirms current physical pickup position for a scheduled ride."
)

require_terms(
    "Driver scheduled GPS navigation",
    driver_portal_text,
    ["pickup_lat", "pickup_lng", "google.com/maps/dir"],
    "frontend/app/driver-portal/page.tsx",
    "Navigation must use passenger-confirmed GPS coordinates."
)

if (
    "15 * 60 * 1000" in driver_portal_text
    and "navigateOpensMs" in driver_portal_text
    and "canNavigate" in driver_portal_text
):
    pass_check("Scheduled navigation 15-minute lock")
else:
    fail_check(
        "Scheduled navigation 15-minute lock",
        "Likely area: frontend/app/driver-portal/page.tsx\n"
        "Navigation should unlock 15 minutes before scheduled_pickup_at."
    )

if (
    "scheduled_pickup_at" in driver_portal_text
    and "canStart" in driver_portal_text
    and "startRide" in driver_portal_text
):
    pass_check("Scheduled Start Ride lock")
else:
    fail_check(
        "Scheduled Start Ride lock",
        "Likely area: frontend/app/driver-portal/page.tsx\n"
        "Start Ride should remain disabled until scheduled_pickup_at."
    )

# Passenger scheduled endpoint must expose full assigned-driver details.
pos = server_text.find('app.get("/passenger-scheduled-bookings/:passengerId"')
if pos != -1:
    section = server_text[pos:pos + 7000]
    required = [
        "driver_name", "driver_phone", "driver_profile_image",
        "vehicle_type", "vehicle_color", "license_plate",
        "assigned_driver_id",
    ]
    missing = [field for field in required if field not in section]
    if missing:
        fail_check(
            "Scheduled driver details for passenger",
            "Likely area: backend/server.js -> "
            "GET /passenger-scheduled-bookings/:passengerId\n"
            "Missing: " + ", ".join(missing) + "\n"
            "Expected join: drivers.id = trip_bookings.assigned_driver_id"
        )
    else:
        pass_check("Scheduled driver details for passenger")
else:
    fail_check(
        "Scheduled driver details for passenger",
        "GET /passenger-scheduled-bookings/:passengerId not found."
    )

require_terms(
    "Passenger scheduled driver card",
    passenger_portal_text,
    [
        "driver_name", "driver_phone", "driver_profile_image",
        "vehicle_type", "vehicle_color", "license_plate", "tel:"
    ],
    "frontend/app/passenger-portal/page.tsx",
    "Passenger sees assigned driver identity, vehicle details and Call action."
)

if (
    "passenger_profile_image" in driver_portal_text
    and "tel:" in driver_portal_text
    and ("ride.phone" in driver_portal_text or "passenger_phone" in driver_portal_text)
):
    pass_check("Driver scheduled passenger card")
else:
    fail_check(
        "Driver scheduled passenger card",
        "Likely area: frontend/app/driver-portal/page.tsx\n"
        "Accepted scheduled ride should show passenger details and Call action."
    )

# Start Ride must preserve assigned_driver_id.
pos = server_text.find('"/trip-requests/:id/start"')
if pos != -1:
    section = server_text[pos:pos + 4500]
    if "assigned_driver_id = $2" in section and "trip_status = 'In Progress'" in section:
        pass_check("Assigned driver preserved on Start Ride")
    else:
        fail_check(
            "Assigned driver preserved on Start Ride",
            "Likely area: backend/server.js -> POST /trip-requests/:id/start\n"
            "Start Ride should change status to In Progress while retaining "
            "the same assigned_driver_id."
        )
else:
    fail_check(
        "Assigned driver preserved on Start Ride",
        "POST /trip-requests/:id/start not found."
    )

# Driver data must remain consistent across lifecycle endpoints.
driver_fields = [
    "driver_name", "driver_phone", "driver_profile_image",
    "vehicle_type", "vehicle_color", "license_plate",
]

for endpoint, name in [
    ("/accepted-trips", "Accepted ride driver data"),
    ("/in-progress-trips", "In Progress ride driver data"),
    ("/completed-trips", "Completed ride driver data"),
]:
    pos = server_text.find(f'app.get("{endpoint}"')
    if pos == -1:
        fail_check(name, f"GET {endpoint} not found in backend/server.js.")
        continue
    section = server_text[pos:pos + 6000]
    missing = [field for field in driver_fields if field not in section]
    if missing:
        fail_check(
            name,
            f"{endpoint} missing driver field(s): {', '.join(missing)}\n"
            "Expected consistent driver data through "
            "Accepted -> In Progress -> Completed."
        )
    else:
        pass_check(name)

# Fare protection: GPS confirmation should not visibly recalculate fare.
confirmation_positions = [
    p for p in (
        server_text.find("pickup-location"),
        server_text.find("confirm-pickup"),
        server_text.find("pickup_location_confirmed"),
    )
    if p != -1
]
if confirmation_positions:
    pos = min(confirmation_positions)
    section = server_text[max(0, pos - 1000):pos + 4500]
    suspicious = (
        "fare_amount =" in section
        or "driver_fare =" in section
        or "base_fare =" in section
    )
    if suspicious:
        warn_check(
            "Scheduled GPS fare protection",
            "Fare assignment found near pickup GPS confirmation. Review it: "
            "confirmed GPS should improve navigation without changing the "
            "passenger's booked fare."
        )
    else:
        pass_check("Scheduled GPS fare protection")
else:
    warn_check(
        "Scheduled GPS fare protection",
        "Pickup confirmation section could not be identified for fare review."
    )

if (
    "scheduledRides" in passenger_portal_text
    and "rideNowTrips" in passenger_portal_text
    and "scheduled_pickup_at" in passenger_portal_text
):
    pass_check("Passenger Ride Now / Scheduled separation")
else:
    warn_check(
        "Passenger Ride Now / Scheduled separation",
        "Could not verify separate Ride Now and scheduled collections in "
        "passenger-portal/page.tsx."
    )


# ============================================================
# 13. PRODUCTION BACKEND
# ============================================================

print("Checking production backend...")

try:
    request = Request(
        PRODUCTION_BACKEND,
        headers={
            "User-Agent": "RouteX-Doctor/2.0"
        }
    )

    with urlopen(request, timeout=30) as response:
        status = response.status

        if 200 <= status < 400:
            pass_check(
                "Production backend",
                f"HTTP {status}"
            )
        else:
            warn_check(
                "Production backend",
                f"HTTP {status}"
            )

except HTTPError as exc:
    fail_check(
        "Production backend",
        f"Backend returned HTTP {exc.code}"
    )

except URLError as exc:
    fail_check(
        "Production backend",
        f"Could not connect to backend: {exc.reason}"
    )

except Exception as exc:
    fail_check(
        "Production backend",
        str(exc)
    )
    
    # ============================================================
# 14. LIVE ROUTEX API CHECKS
# ============================================================

def check_live_api(name, endpoint):
    url = f"{PRODUCTION_BACKEND}{endpoint}"

    try:
        request = Request(
            url,
            headers={
                "User-Agent": "RouteX-Doctor/2.0"
            }
        )

        with urlopen(request, timeout=30) as response:
            status = response.status
            body = response.read().decode(
                "utf-8",
                errors="ignore"
            )

            if 200 <= status < 300:
                pass_check(
                    name,
                    f"HTTP {status}"
                )
                return body

            fail_check(
                name,
                f"{endpoint} returned HTTP {status}"
            )

    except HTTPError as exc:
        fail_check(
            name,
            f"{endpoint} returned HTTP {exc.code}"
        )

    except URLError as exc:
        fail_check(
            name,
            f"Could not reach {endpoint}: {exc.reason}"
        )

    except Exception as exc:
        fail_check(
            name,
            str(exc)
        )

    return None


trip_requests_response = check_live_api(
    "Live trip requests API",
    "/trip-requests"
)

scheduled_rides_response = check_live_api(
    "Live scheduled rides API",
    "/scheduled-rides"
)
# ============================================================
# CHECK LIVE REQUEST / SCHEDULED RIDE SEPARATION
# ============================================================

if trip_requests_response is not None:
    try:
        live_rides = json.loads(trip_requests_response)

        scheduled_in_live = [
            ride
            for ride in live_rides
            if str(ride.get("ride_type", "")).lower() == "scheduled"
        ]

        if scheduled_in_live:
            fail_check(
                "Live/Scheduled API separation",
                f"{len(scheduled_in_live)} scheduled ride(s) "
                "were returned by /trip-requests."
            )
        else:
            pass_check(
                "Live/Scheduled API separation"
            )

    except json.JSONDecodeError:
        fail_check(
            "Live/Scheduled API separation",
            "/trip-requests did not return valid JSON."
        )
        # ============================================================
# VALIDATE LIVE API DATA STRUCTURE
# ============================================================

def validate_api_data(name, response_text, required_fields):
    if response_text is None:
        return

    try:
        data = json.loads(response_text)

        if not isinstance(data, list):
            fail_check(
                name,
                "API response is not a JSON list."
            )
            return

        # An empty list is valid. It simply means there are
        # currently no rides of this type.
        if len(data) == 0:
            pass_check(
                name,
                "No current rides to validate."
            )
            return

        missing_by_ride = []

        for ride in data:
            if not isinstance(ride, dict):
                fail_check(
                    name,
                    "API returned an item that is not a JSON object."
                )
                return

            missing = [
                field
                for field in required_fields
                if field not in ride
            ]

            if missing:
                ride_id = ride.get("id", "unknown")

                missing_by_ride.append(
                    f"Ride {ride_id}: {', '.join(missing)}"
                )

        if missing_by_ride:
            fail_check(
                name,
                "Missing required API field(s):\n"
                + "\n".join(missing_by_ride[:10])
            )
        else:
            pass_check(
                name,
                f"{len(data)} ride(s) validated."
            )

    except json.JSONDecodeError:
        fail_check(
            name,
            "API did not return valid JSON."
        )

    except Exception as exc:
        fail_check(
            name,
            str(exc)
        )


# ============================================================
# RIDE NOW DATA
# ============================================================
# ROUTEX DOCTOR COMPLETE SCRIPT - PART 3 OF 3
# IMPORTANT: Do NOT run this part by itself.
# Combine Parts 1, 2 and 3 in order into ONE file named routex_doctor.py.
# Remove these three instruction lines after combining if you want.


validate_api_data(
    "Live request data",
    trip_requests_response,
    [
        "id",
        "passenger_id",
        "fare_amount",
        "pickup_address",
        "dropoff_address",
        "pickup_lat",
        "pickup_lng",
        "destination_lat",
        "destination_lng",
        "trip_status",
        "full_name",
        "phone",
        "passenger_profile_image",
    ]
)


# ============================================================
# SCHEDULED RIDE DATA
# ============================================================

validate_api_data(
    "Scheduled ride data",
    scheduled_rides_response,
    [
        "id",
        "passenger_id",
        "ride_type",
        "fare_amount",
        "pickup_address",
        "dropoff_address",
        "pickup_lat",
        "pickup_lng",
        "destination_lat",
        "destination_lng",
        "trip_status",
        "scheduled_pickup_at",
        "matching_opens_at",
        "passenger_name",
        "passenger_phone",
        "passenger_profile_image",
    ]
)
# ============================================================
# 13. PRODUCTION WEBSITE
# ============================================================

try:

    request = Request(
        PRODUCTION_FRONTEND,
        headers={
            "User-Agent": "RouteX-Doctor/1.0"
        }
    )

    with urlopen(
        request,
        timeout=20
    ) as response:

        status = response.status

        if 200 <= status < 400:
            pass_check(
                "Production website",
                f"HTTP {status}"
            )
        else:
            warn_check(
                "Production website",
                f"HTTP {status}"
            )

except HTTPError as exc:

    fail_check(
        "Production website",
        f"HTTP {exc.code}"
    )

except URLError as exc:

    warn_check(
        "Production website",
        f"Could not connect: {exc.reason}"
    )

except Exception as exc:

    warn_check(
        "Production website",
        str(exc)
    )


# ============================================================
# 14. GIT STATUS
# ============================================================

git_exe = r"C:\Program Files\Git\cmd\git.exe"

if Path(git_exe).exists():

    code, stdout, stderr = run_command(
        f'"{git_exe}" status --porcelain',
        cwd=ROOT,
        timeout=30
    )

    if code == 0:

        if stdout.strip():

            changed_files = [
                line
                for line in stdout.splitlines()
                if line.strip()
            ]

            warn_check(
                "Git working tree",
                f"{len(changed_files)} uncommitted file(s):\n"
                + "\n".join(changed_files[:20])
            )

        else:
            pass_check("Git working tree")

    else:
        warn_check(
            "Git working tree",
            stderr or stdout
        )

else:
    warn_check(
        "Git working tree",
        "Git executable not found at expected Windows location."
    )

# ============================================================
# ROUTEX DIAGNOSIS ENGINE
# ============================================================

def build_diagnosis():
    diagnoses = []

    statuses = {
        name: status
        for status, name, _ in results
    }

    # FRONTEND BUILD
    if statuses.get("Frontend production build") == "FAIL":
        diagnoses.append(
            (
                "Frontend build failure",
                "frontend",
                "Run npm run build inside the frontend folder and inspect "
                "the first compile, TypeScript, or prerender error."
            )
        )

    # PRODUCTION FRONTEND
    if statuses.get("Production website") == "FAIL":
        diagnoses.append(
            (
                "Production website unavailable",
                "Render frontend service",
                "Check the frontend deployment on Render and confirm the "
                "latest main branch deployment completed successfully."
            )
        )

    # BACKEND SYNTAX
    if statuses.get("Backend syntax") == "FAIL":
        diagnoses.append(
            (
                "Backend syntax error",
                "backend/server.js",
                "Run node --check server.js and fix the reported line "
                "before deploying."
            )
        )

    # PRODUCTION BACKEND
    if statuses.get("Production backend") == "FAIL":
        diagnoses.append(
            (
                "Production backend unavailable",
                "Render backend service",
                "Check the backend Render deployment and logs. Confirm "
                "server.js started successfully."
            )
        )

    # LIVE REQUEST API
    if statuses.get("Live trip requests API") == "FAIL":
        diagnoses.append(
            (
                "Live ride requests unavailable",
                "backend/server.js -> GET /trip-requests",
                "Inspect the /trip-requests SQL query and the Render "
                "backend logs."
            )
        )

    # SCHEDULED API
    if statuses.get("Live scheduled rides API") == "FAIL":
        diagnoses.append(
            (
                "Scheduled rides unavailable",
                "backend/server.js -> GET /scheduled-rides",
                "Inspect the /scheduled-rides endpoint and the Render "
                "backend logs."
            )
        )

    # DUPLICATE SCHEDULED / LIVE RIDES
    if statuses.get("Live/Scheduled API separation") == "FAIL":
        diagnoses.append(
            (
                "Scheduled ride leaking into Live Requests",
                "backend/server.js -> GET /trip-requests",
                "Confirm the Waiting-rides query contains "
                "tb.ride_type = 'now'."
            )
        )

    # LIVE REQUEST DATA
    if statuses.get("Live request data") == "FAIL":
        diagnoses.append(
            (
                "Live request data incomplete",
                "backend/server.js -> GET /trip-requests",
                "Compare the missing fields reported by Doctor with the "
                "SELECT list and passenger JOIN in /trip-requests."
            )
        )

    # SCHEDULED DATA
    if statuses.get("Scheduled ride data") == "FAIL":
        diagnoses.append(
            (
                "Scheduled ride data incomplete",
                "backend/server.js -> GET /scheduled-rides",
                "Compare the missing fields reported by Doctor with the "
                "SELECT list and passenger JOIN in /scheduled-rides."
            )
        )

    # SCHEDULED RELEASE
    if statuses.get("Scheduled release function") == "FAIL":
        diagnoses.append(
            (
                "Scheduled ride release logic missing",
                "backend/server.js -> releaseScheduledBookings()",
                "Check the scheduled release function. Scheduled rides "
                "cannot enter driver matching correctly without it."
            )
        )

    # WHATSAPP
    if statuses.get("Scheduled WhatsApp alerts") in ("FAIL", "WARN"):
        diagnoses.append(
            (
                "Scheduled driver notification problem",
                "backend/server.js -> releaseScheduledBookings()",
                "Check that newly released scheduled rides call "
                "sendWhatsAppBookingAlert()."
            )
        )

    # OLD PORTAL
    if statuses.get("Old test URLs") == "FAIL":
        diagnoses.append(
            (
                "Old passenger portal URL detected",
                "frontend",
                "Replace /passenger-portal-new with /passenger-portal."
            )
        )

    # DEVELOPMENT URL
    if statuses.get("Development URLs") == "FAIL":
        diagnoses.append(
            (
                "Development RouteX URL detected",
                "Frontend API configuration",
                "Remove the old development Render URL and use the shared "
                "production API_URL."
            )
        )


    scheduled_contract_diagnoses = {
        "Scheduled pickup GPS endpoint": (
            "Scheduled pickup GPS backend is incomplete",
            "backend/server.js",
            "Restore the pickup confirmation endpoint. Store pickup_lat/lng "
            "for navigation without changing the booked fare."
        ),
        "Passenger pickup GPS confirmation": (
            "Passenger scheduled GPS confirmation is incomplete",
            "frontend/app/passenger-portal/page.tsx",
            "Check browser geolocation and the request that sends confirmed "
            "pickup coordinates to the backend."
        ),
        "Driver scheduled GPS navigation": (
            "Driver navigation is not using confirmed pickup GPS",
            "frontend/app/driver-portal/page.tsx",
            "Navigate using ride.pickup_lat and ride.pickup_lng."
        ),
        "Scheduled navigation 15-minute lock": (
            "Scheduled navigation timing is incorrect",
            "frontend/app/driver-portal/page.tsx",
            "Navigation must unlock 15 minutes before scheduled pickup."
        ),
        "Scheduled Start Ride lock": (
            "Scheduled Start Ride timing is incorrect",
            "frontend/app/driver-portal/page.tsx",
            "Start Ride must unlock at scheduled_pickup_at."
        ),
        "Scheduled driver details for passenger": (
            "Passenger is missing assigned-driver information",
            "backend/server.js -> passenger scheduled bookings",
            "Join drivers through assigned_driver_id and return the complete "
            "driver data contract."
        ),
        "Passenger scheduled driver card": (
            "Passenger driver card is incomplete",
            "frontend/app/passenger-portal/page.tsx",
            "Show driver photo, name, vehicle, registration, phone and Call."
        ),
        "Driver scheduled passenger card": (
            "Driver passenger card is incomplete",
            "frontend/app/driver-portal/page.tsx",
            "Show passenger identity/contact details and Call."
        ),
        "Assigned driver preserved on Start Ride": (
            "Driver assignment lifecycle is broken",
            "backend/server.js -> Start Ride",
            "Transition Accepted to In Progress without losing assigned_driver_id."
        ),
        "Accepted ride driver data": (
            "Accepted API driver contract is incomplete",
            "backend/server.js -> /accepted-trips",
            "Return the complete driver fields."
        ),
        "In Progress ride driver data": (
            "In Progress API driver contract is incomplete",
            "backend/server.js -> /in-progress-trips",
            "Return the same driver fields so details do not disappear."
        ),
        "Completed ride driver data": (
            "Completed API driver contract is incomplete",
            "backend/server.js -> /completed-trips",
            "Keep driver fields consistent through Completed."
        ),
    }

    for check_name, diagnosis in scheduled_contract_diagnoses.items():
        if statuses.get(check_name) == "FAIL":
            diagnoses.append(diagnosis)

    return diagnoses


diagnoses = build_diagnosis()
# ============================================================
# RESULTS
# ============================================================

print()
print("=" * 64)
print("                         RESULTS")
print("=" * 64)
print()

for status, name, message in results:

    dots = "." * max(
        2,
        34 - len(name)
    )

    print(
        f"{name} {dots} {status}"
    )


critical_count = sum(
    1
    for status, _, _ in results
    if status == "FAIL"
)

warning_count = sum(
    1
    for status, _, _ in results
    if status == "WARN"
)


print()
print("-" * 64)

print(
    f"{critical_count} CRITICAL PROBLEM(S)"
)

print(
    f"{warning_count} WARNING(S)"
)

print("-" * 64)


# ============================================================
# PROBLEM DETAILS
# ============================================================

if problems:

    print()
    print("DETAILS")
    print("-" * 64)

    for severity, name, message in problems:

        print()
        print(f"[{severity}] {name}")
        print(message)


print()
# ============================================================
# DIAGNOSIS REPORT
# ============================================================

print()
print("ROUTEX DIAGNOSIS")
print("-" * 64)

if diagnoses:
    for title, area, action in diagnoses:
        print()
        print(f"Problem: {title}")
        print(f"Likely area: {area}")
        print(f"Next action: {action}")
else:
    print("No faults detected in the checks performed.")

print()
print("=" * 64)

if critical_count == 0:

    if warning_count == 0:
        print("ROUTEX STATUS: HEALTHY")
    else:
        print("ROUTEX STATUS: HEALTHY WITH WARNINGS")

else:
    print("ROUTEX STATUS: ATTENTION REQUIRED")

print("=" * 64)
print()

sys.exit(
    1 if critical_count > 0 else 0
)