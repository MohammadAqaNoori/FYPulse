"""
start.py  —  FYPulse unified launcher
Run from project root:  py start.py
Press Ctrl+C to stop everything.
"""
import subprocess, sys, os, time, threading

ROOT = os.path.dirname(os.path.abspath(__file__))

SERVICES = [
    {
        "name":  "Backend ",
        "color": "\033[94m",
        "cmd":   [sys.executable, "-m", "uvicorn", "main:app",
                  "--reload", "--port", "8000", "--host", "127.0.0.1"],
        "cwd":   os.path.join(ROOT, "backend"),
        "shell": False,
    },
    {
        "name":  "ML Svc  ",
        "color": "\033[95m",
        # no --reload so new .py files don't trigger restart
        "cmd":   [sys.executable, "-m", "uvicorn", "main:app",
                  "--port", "8001", "--host", "127.0.0.1"],
        "cwd":   os.path.join(ROOT, "ml_service"),
        "shell": False,
    },
    {
        "name":  "Frontend",
        "color": "\033[92m",
        "cmd":   "npm run dev",
        "cwd":   os.path.join(ROOT, "frontend"),
        "shell": True,
    },
]

RESET = "\033[0m"
BOLD  = "\033[1m"
RED   = "\033[91m"
CYAN  = "\033[96m"

processes: list = []
_stopping = False


def stream(proc, name, color):
    try:
        for line in iter(proc.stdout.readline, b""):
            if _stopping:
                break
            try:
                text = line.decode("utf-8", errors="replace").rstrip()
                if text:
                    print(f"{color}[{name}]{RESET} {text}", flush=True)
            except Exception:
                pass
    except Exception:
        pass


def start_all():
    for svc in SERVICES:
        proc = subprocess.Popen(
            svc["cmd"],
            cwd=svc["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=svc.get("shell", False),
        )
        processes.append(proc)
        threading.Thread(target=stream, args=(proc, svc["name"], svc["color"]), daemon=True).start()
        print(f"{svc['color']}{BOLD}[{svc['name']}]{RESET} started (pid {proc.pid})")
        time.sleep(2.5)


def stop_all():
    global _stopping
    _stopping = True
    print(f"\n{RED}{BOLD}Stopping all services…{RESET}")
    for p in processes:
        try: p.terminate()
        except Exception: pass
    for p in processes:
        try: p.wait(timeout=6)
        except subprocess.TimeoutExpired:
            try: p.kill()
            except Exception: pass
    print(f"{RED}Done.{RESET}")


if __name__ == "__main__":
    print(f"\n{BOLD}{CYAN}{'═'*52}{RESET}")
    print(f"{BOLD}{CYAN}  FYPulse — All Services{RESET}")
    print(f"{BOLD}{CYAN}{'═'*52}{RESET}")
    print(f"  Backend    →  http://localhost:8000")
    print(f"  ML Service →  http://localhost:8001")
    print(f"  Frontend   →  http://localhost:5173")
    print(f"  API Docs   →  http://localhost:8000/docs")
    print(f"{BOLD}{CYAN}{'═'*52}{RESET}\n")
    try:
        start_all()
        print(f"\n{BOLD}All services running. Press Ctrl+C to stop.{RESET}\n")
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        stop_all()
