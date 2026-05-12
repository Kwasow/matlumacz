from fastapi import BackgroundTasks, FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import uuid
import asyncio
from pathlib import Path
import shutil

STATIC_DIR: str = "res"
MANIM_QUALITY: str = "-ql"  # Low quality for faster rendering
MANIM_TIMEOUT: float = 180.0  # seconds

app = FastAPI()
app.mount(f"/{STATIC_DIR}", StaticFiles(directory=STATIC_DIR), name=STATIC_DIR)

# :)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodePostData(BaseModel):
    code: str


async def _render_manim(request_uuid: str, code: str) -> None:
    static_dir = Path(STATIC_DIR)
    script_path = static_dir / f"{request_uuid}.py"
    media_dir = static_dir / f".media_{request_uuid}"
    output_mp4 = static_dir / f"{request_uuid}.mp4"
    fail_path = static_dir / f"{request_uuid}.fail"

    def fail(mess: str) -> None:
        try:
            fail_path.write_text(mess, encoding="utf-8")
        except Exception:
            pass

    try:
        script_path.write_text(code, encoding="utf-8")
        proc = await asyncio.create_subprocess_exec(
            "manim",
            MANIM_QUALITY,
            "-a",
            "--media_dir",
            str(media_dir),
            str(script_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout_b, stderr_b = await asyncio.wait_for(
                proc.communicate(),
                timeout=MANIM_TIMEOUT,
            )
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            fail(f"manim render timed out after {MANIM_TIMEOUT:.0f}s")
            return

        stdout = stdout_b.decode("utf-8", errors="replace")
        stderr = stderr_b.decode("utf-8", errors="replace")

        if proc.returncode != 0:
            fail(
                f"manim exited with code {proc.returncode}\n\n"
                f"--- STDOUT ---\n{stdout}\n\n"
                f"--- STDERR ---\n{stderr}"
            )
            return

        # Manim succeeded, locate the mp4.
        # Manim writes renders to
        #   {media_dir}/videos/{script_stem}/{quality}/{SceneName}.mp4
        # and intermediates to .../partial_movie_files/ which we ignore.
        candidates = [
            p for p in media_dir.rglob("*.mp4") if "partial_movie_files" not in p.parts
        ]

        if not candidates:
            fail(
                "manim reported success but produced no .mp4 file\n\n"
                f"--- STDOUT ---\n{stdout}\n\n"
                f"--- STDERR ---\n{stderr}"
            )
            return

        # Take the newest scene if the LLM produces multiple scenes.
        # In practice the LLM should emit a single Scene.
        candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        shutil.move(str(candidates[0]), str(output_mp4))

    except FileNotFoundError:
        # The `manim` binary itself is missing.
        fail(
            "Could not find the `manim` executable. Make sure the server is "
            "started inside a venv that has manim installed."
        )
    except Exception as exc:
        fail(f"Unexpected server error: {type(exc).__name__}: {exc}")
    finally:
        # Remove the media but keep {uuid}.py and {uuid}.fail
        if media_dir.exists():
            shutil.rmtree(media_dir, ignore_errors=True)


@app.post("/api/compile")
async def compile_manim(
    data: CodePostData,
    background_tasks: BackgroundTasks,
) -> str:
    request_uuid = str(uuid.uuid4())
    background_tasks.add_task(_render_manim, request_uuid, data.code)
    return request_uuid
