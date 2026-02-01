# Orca Memory Embeddings

CPU-friendly embedding service for Orca Memory.

## Endpoints

- `GET /health`
- `POST /embed`

### Example

```bash
curl -s http://localhost:8008/health

curl -s http://localhost:8008/embed \
  -H 'Content-Type: application/json' \
  -d '{"input": ["hello world"], "input_type": "passage"}'
```

Response includes token counts for usage metering.

## Env

- `EMBEDDING_MODEL` (default: `intfloat/e5-base-v2`)
- `EMBEDDING_MAX_BATCH` (default: `32`)

## Docker

```bash
docker build -t orca-embeddings:local .
docker run -p 8008:8008 orca-embeddings:local
```
