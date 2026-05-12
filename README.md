# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Setup Gemini API Key

This app uses Google's Gemini AI. To use the chat features, you'll need to configure your own API key:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env` file in the root of your project.
3. Add your generated key to the file like so:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

## Get started

```
npm install
npm run web
```

## Running the server

```bash
# Install dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the code
fastapi dev
```

Example request:

```bash
curl -X 'POST' \
        'http://localhost:8000/api/compile' \
        -H 'accept: application/json' \
        -H 'Content-Type: application/json' \
        -d '{"code": "Test code"}'
```

Static file example url: <http://localhost:8000/res/example.txt>

Docs also generated at `localhost:8000/docs`

### Docker server

Rebuild the image (every time requirements change):
```
docker build --tag "matlumacz" . --no-cache
```

Run the server:
```
docker run -p 8000:8000 -v "$PWD":/server
```

