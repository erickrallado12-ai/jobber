import subprocess, sys, os, pathlib

ROOT = pathlib.Path(__file__).parent
PROTO = ROOT.parent / "proto" / "resume.proto"
GEN = ROOT / "generated"

def generate():
    GEN.mkdir(exist_ok=True)
    subprocess.check_call([
        sys.executable, "-m", "grpc_tools.protoc",
        f"-I{ROOT.parent / 'proto'}",
        f"--python_out={GEN}",
        f"--grpc_python_out={GEN}",
        str(PROTO),
    ])
    (GEN / "__init__.py").touch(exist_ok=True)
    print("✓ Protobuf stubs generated")

def run():
    generate()
    subprocess.check_call([sys.executable, "-m", "app.main"])

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "generate"
    {"generate": generate, "run": run}[cmd]()
