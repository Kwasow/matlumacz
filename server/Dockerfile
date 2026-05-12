FROM python:3.14-slim

# Prepare project files
WORKDIR /server
COPY . /server

# Prepare env
RUN apt update
RUN apt install -y gcc g++ pkg-config cmake libcairo2-dev libpango1.0-dev ffmpeg
RUN pip install --no-cache-dir -r /server/requirements.txt

# Prepare server ports
EXPOSE 8000

# Start command
CMD ["fastapi", "dev", "/server/main.py", "--host", "0.0.0.0", "--port", "8000"]

