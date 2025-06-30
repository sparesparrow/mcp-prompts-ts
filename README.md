# MCP Prompts - TypeScript Implementation

This repository will contain the TypeScript implementation of the MCP Prompts server.

## Usage Examples

### 1. Run with NPX (local file storage)

```bash
npx -y @sparesparrow/mcp-prompts
# open a new terminal
docker run -d --name mcp-server -p 3003:3003 -v $(pwd)/data:/app/data sparesparrow/mcp-prompts:latest
curl http://localhost:3003/health  # → { "status": "ok" }
```

### 2. Run with Docker (file storage)

```bash
docker run -d --name mcp-prompts \
  -p 3003:3003 \
  -e HTTP_SERVER=true \
  -e STORAGE_TYPE=file \
  -v $(pwd)/data:/app/data \
  sparesparrow/mcp-prompts:latest
```

### 3. Run with Docker Compose (PostgreSQL storage)

Create a `docker-compose.yml`:

```yaml
version: '3'
services:
  prompts:
    image: sparesparrow/mcp-prompts:latest
    environment:
      HTTP_SERVER: 'true'
      STORAGE_TYPE: 'postgres'
      POSTGRES_CONNECTION_STRING: 'postgresql://postgres:password@db:5432/mcp_prompts'
    depends_on: [db]
    ports: ['3003:3003']
    volumes:
      - prompts-data:/app/data
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pg-data:/var/lib/postgresql/data

volumes:
  prompts-data:
  pg-data:
```

Start services:

```bash
docker compose up -d
```

Health-check:

```bash
curl http://localhost:3003/health
```

Expect `{ "status": "ok" }`.

---

For more configuration options, see `docs/02-configuration.md` or the [Configuration Guide](mcp-prompts/docs/02-configuration.md).

## Configuration

MCP Prompts is configured via environment variables. Here are the most important options:

| Variable        | Default        | Description                                  |
| -------------- | -------------- | -------------------------------------------- |
| `PORT`         | `3003`         | HTTP port                                    |
| `STORAGE_TYPE` | `file`         | Storage backend: file, postgres, memory, etc.|
| `PROMPTS_DIR`  | `./data/prompts`| Directory for prompt files                   |
| `LOG_LEVEL`    | `info`         | Log level: debug, info, warn, error          |
| `HTTP_SERVER`  | `true`         | Enable HTTP server                           |
| `HOST`         | `localhost`    | Hostname                                     |

For advanced options (Postgres, ElasticSearch, SSE, ElevenLabs, etc.), see the [full configuration guide](mcp-prompts/docs/02-configuration.md).

All variables are validated at startup. If any required variable is missing or invalid, the server will print a clear error and exit.
