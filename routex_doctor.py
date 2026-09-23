import os
import re
import subprocess
import sys
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
        warn_check(
            "Environment",
            "Missing variable name(s): "
            + ", ".join(missing_env)
            + "\nValues were NOT displayed."
        )
    else:
        pass_check(
            "Environment",
            "Required variable names found. Values hidden."
        )

else:
    warn_check(
        "Environment",
        "backend/.env was not found."
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