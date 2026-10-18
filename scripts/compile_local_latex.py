#!/usr/bin/env python3
"""Compile any LaTeX entry point in this repository."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUXILIARY_SUFFIXES = (
    ".aux",
    ".fdb_latexmk",
    ".fls",
    ".log",
    ".out",
    ".synctex.gz",
    ".toc",
)


def resolve_target(value: str) -> Path:
    """Resolve a target supplied as a repository-relative or absolute path."""
    candidate = Path(value).expanduser()
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    return candidate.resolve()


def clean_auxiliary_files(target_dir: Path) -> int:
    removed = 0
    for path in target_dir.iterdir():
        if path.is_file() and path.name.endswith(AUXILIARY_SUFFIXES):
            path.unlink()
            removed += 1
    return removed


def run_pdflatex(target: Path) -> str:
    executable = shutil.which("pdflatex")
    if executable is None:
        raise RuntimeError(
            "'pdflatex' was not found on PATH. Install MiKTeX or add it to PATH."
        )

    command = [
        executable,
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        target.name,
    ]
    result = subprocess.run(
        command,
        cwd=target.parent,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        output = result.stdout.rstrip()
        if output:
            print(output, file=sys.stderr)
        raise RuntimeError(f"Compilation failed with exit code {result.returncode}.")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "target",
        help="path to a .tex entry point, relative to the repository root or absolute",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="remove auxiliary files from the target directory before compiling",
    )
    parser.add_argument(
        "--passes",
        type=int,
        default=2,
        help="number of pdflatex passes (default: 2)",
    )
    args = parser.parse_args()

    target = resolve_target(args.target)
    if target.suffix.lower() != ".tex":
        print(f"Target must be a .tex file: {target}", file=sys.stderr)
        return 1
    if not target.is_file():
        print(f"File not found: {target}", file=sys.stderr)
        return 1
    if args.passes < 1:
        print("--passes must be at least 1.", file=sys.stderr)
        return 1

    if args.clean:
        removed = clean_auxiliary_files(target.parent)
        print(f"Removed {removed} auxiliary file(s).")

    try:
        for pass_number in range(1, args.passes + 1):
            print(f"Running pdflatex pass {pass_number}/{args.passes}: {target}")
            run_pdflatex(target)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1

    output_pdf = target.with_suffix(".pdf")
    print(f"Compilation completed: {output_pdf}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
