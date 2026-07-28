"""Safe approach: only removes whole-line comments, not inline.
"""
import ast
import os
import re
import sys
from pathlib import Path


ROOT = Path(r"C:\Users\erick\OneDrive\Documentos\Default Project")


def strip_py(path: Path) -> str:
    with open(path, encoding="utf-8", errors="replace") as f:
        source = f.read()
    try:
        tree = ast.parse(source)
        doc_nodes: set[int] = set()
        for node in ast.walk(tree):
            if isinstance(node, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                if (node.body and isinstance(node.body[0], ast.Expr) and
                        isinstance(node.body[0].value, ast.Constant) and
                        isinstance(node.body[0].value.value, str)):
                    doc_nodes.add(node.body[0].lineno - 1)
    except SyntaxError:
        doc_nodes = set()

    lines = source.split("\n")
    result: list[str] = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        if i in doc_nodes:
            continue
        result.append(line)
    return "\n".join(result)


def strip_line_comments(path: Path, markers: list[str]) -> str:
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().split("\n")
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        is_comment = False
        for marker in markers:
            if stripped.startswith(marker) and not any(
                stripped.startswith(c) for c in ["http://", "https://"]
            ):
                is_comment = True
                break
        if not is_comment:
            result.append(line)
    return "\n".join(result)


def strip_c_style_comments(path: Path) -> str:
    """Conservative: only removes lines where the entire line is a comment.
    """
    with open(path, encoding="utf-8", errors="replace") as f:
        source = f.read()
    result = re.sub(r'/\*[\s\S]*?\*/', '', source)
    lines = result.split("\n")
    result_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("//"):
            continue
        result_lines.append(line)
    return "\n".join(result_lines)


def strip_hash_comments_yaml(path: Path) -> str:
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().split("\n")
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        result.append(line)
    return "\n".join(result)


def strip_hash_comments(path: Path) -> str:
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().split("\n")
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        result.append(line)
    return "\n".join(result)


def strip_sql_comments(path: Path) -> str:
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().split("\n")
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        result.append(line)
    return "\n".join(result)


def strip_proto_comments(path: Path) -> str:
    return strip_c_style_comments(path)


def process_file(path: Path) -> bool:
    ext = path.suffix.lower()
    handlers = {
        ".py": strip_py,
        ".ts": strip_c_style_comments,
        ".tsx": strip_c_style_comments,
        ".js": strip_c_style_comments,
        ".jsx": strip_c_style_comments,
        ".yaml": strip_hash_comments_yaml,
        ".yml": strip_hash_comments_yaml,
        ".css": strip_c_style_comments,
        ".sql": strip_sql_comments,
        ".proto": strip_proto_comments,
    ".conf": strip_hash_comments,
    ".sh": strip_hash_comments,
    ".txt": strip_hash_comments,
    }
    if path.name == "Dockerfile" or path.name.startswith("Dockerfile."):
        handler = strip_hash_comments
    elif path.name == "Makefile" or path.name == "makefile":
        handler = strip_hash_comments
    elif ext in handlers:
        handler = handlers[ext]
    else:
        return False

    if "generated" in path.parts:
        return False
    if path.name in ("mexico.json", "Mexico.min.json"):
        return False

    original = path.read_text(encoding="utf-8", errors="replace")
    cleaned = handler(path)

    if cleaned != original:
        path.write_text(cleaned, encoding="utf-8")
        return True
    return False


EXCLUDE_DIRS = {"node_modules", "__pycache__", ".git", ".next", ".opencode"}


def main():
    modified = 0
    errors = 0
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.endswith(".egg-info")]
        for file in files:
            path = Path(root) / file
            try:
                if process_file(path):
                    print(f"  MODIFIED: {path.relative_to(ROOT)}")
                    modified += 1
            except Exception as e:
                print(f"  ERROR: {path.relative_to(ROOT)}: {e}", file=sys.stderr)
                errors += 1
    print(f"\nDone. Modified: {modified}, Errors: {errors}")


if __name__ == "__main__":
    main()
