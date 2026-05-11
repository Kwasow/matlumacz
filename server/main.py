from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import uuid

STATIC_DIR: str = "res"

app = FastAPI()
app.mount(f"/{STATIC_DIR}", StaticFiles(directory=STATIC_DIR), name=STATIC_DIR)

class CodePostData(BaseModel):
  code: str

@app.post("/api/compile")
async def compile_manim(data: CodePostData):
  request_uuid = uuid.uuid4()
  print(data.code)

  # TODO:
  # 1. Save code as {uuid}.py in STATIC_DIR
  # 2. Run manim asynchronously (assume you're running in a venv with manim)
  # 3. If running manim succeeded, add the resulting movie as {uuid}.mp4 - or whatever format manim generates
  # 4. If running manim failed, add a {uuid}.fail file with whatever content

  return str(request_uuid)
