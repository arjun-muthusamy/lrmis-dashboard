# Running LRMIS on Replit

## Development

Install the locked JavaScript dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev -- --host 0.0.0.0 --port 5000
```

The Replit workflow **Start application** runs this command automatically and serves the web preview on port 5000.

## Checks

```bash
bun run build
bun run lint
```

The dashboard currently uses mock data and accepts any username/password in mock login mode. No backend service or additional environment variable is required for the main dashboard preview.