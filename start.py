"""
start.py  —  FYPulse unified launcher
Run from the project root:
    py start.py
Starts backend (8000), ml_service (8001), and frontend (5173) in parallel.
Press Ctrl+C to stop everything.
"""
import subprocess
import sys
import os
import time
import signal
import threading

ROOT = os.path.dirname(os.path.abspath(__file__))

SERVICES = [
    {
        "name":    "Backend  ",
        "color":   "\033[94m",   # blue
        "cmd":     [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
        "cwd":     os.path.join(ROOT, "backend"),
    },
    {
        "name":    "ML Svc   ",
        "color":   "\033[95m",   # magenta
        "cmd":     [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8001"],
        "cwd":     os.path.join(ROOT, "ml_service"),
    },
    {
        "name":    "Frontend ",
        "color":   "\033[92m",   # green
        "cmd":     ["npm", "run", "dev"],
        "cwd":     os.path.join(ROOT, "frontend"),
        "shell":   True,         # needed on Windows for npm
    },
]

RESET  = "\033[0m"
BOLD   = "\033[1m"
RED    = "\033[91m"

processes = []


def stream(proc, name, color):
    """Stream a process's stdout+stderr with a colored prefix."""
    for line in iter(proc.stdout.readline, b""):
        try:
            text = line.decode("utf-8", errors="replace").rstrip()
            print(f"{color}[{name}]{RESET} {text}")
        except Exception:
            pass


def start_services():
    for svc in SERVICES:
        use_shell = svc.get("shell", False)
        cmd = svc["cmd"] if not use_shell else " ".join(svc["cmd"])

        proc = subprocess.Popen(
            cmd,
            cwd=svc["cwd"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=use_shell,
        )
        processes.append(proc)

        t = threading.Thread(target=stream, args=(proc, svc["name"], svc["color"]), daemon=True)
        t.start()

        print(f"{svc['color']}{BOLD}[{svc['name']}]{RESET} Started (pid {proc.pid})")
        time.sleep(1.5)   # stagger starts slightly


def stop_all():
    print(f"\n{RED}{BOLD}Stopping all services...{RESET}")
    for proc in processes:
        try:
            proc.terminate()
        except Exception:
            pass
    for proc in processes:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    print(f"{RED}All services stopped.{RESET}")


if __name__ == "__main__":
    print(f"\n{BOLD}{'─'*52}{RESET}")
    print(f"{BOLD}  FYPulse — Starting all services{RESET}")
    print(f"{BOLD}{'─'*52}{RESET}")
    print(f"  {'Backend':12}  http://localhost:8000")
    print(f"  {'ML Service':12}  http://localhost:8001")
    print(f"  {'Frontend':12}  http://localhost:5173")
    print(f"{BOLD}{'─'*52}{RESET}\n")

    try:
        start_services()
        print(f"\n{BOLD}All services running. Press Ctrl+C to stop.{RESET}\n")
        # Keep main thread alive
        while True:
            time.sleep(1)
            # If any process died unexpectedly, report it
            for i, proc in enumerate(processes):
                if proc.poll() is not None:
                    print(f"{RED}[{SERVICES[i]['name']}] Exited with code {proc.returncode}{RESET}")
    except KeyboardInterrupt:
        stop_all()
