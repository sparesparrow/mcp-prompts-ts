# MCP Prompts - TypeScript Implementation

This repository contains the TypeScript implementation of the MCP Prompts server.

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

### 3. Build from source with Docker

If you want to build the Docker image from source, note that the Dockerfiles are located in the `docker/` subdirectory. For example:

- For development:
  ```bash
  cd mcp-prompts-ts
  docker build -f docker/Dockerfile.development -t mcp-prompts:dev .
  docker run -p 3003:3003 mcp-prompts:dev
  ```
- For production:
  ```bash
  cd mcp-prompts-ts
  docker build -f docker/Dockerfile.prod -t mcp-prompts:prod .
  docker run -p 3003:3003 mcp-prompts:prod
  ```

### 4. Run with Docker Compose (PostgreSQL storage)

You can use the provided Docker Compose files in `docker/compose/` for advanced setups. Example for PostgreSQL:

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

Or use a prepared compose file:

```bash
cd mcp-prompts-ts
docker compose -f docker/compose/docker-compose.development.yml up -d
```

Health-check:

```bash
curl http://localhost:3003/health
```

Expect `{ "status": "ok" }`.

---

For more configuration options, see `docs/02-configuration.md` or the [Configuration Guide](mcp-prompts/docs/02-configuration.md).

## Troubleshooting

### Docker build fails with missing package.json or source files
- Make sure you are running the build command from the `mcp-prompts-ts` directory.
- Ensure the Dockerfile copies `package.json` and source files (see Dockerfile examples).
- If you see `npm error enoent Could not read package.json`, your Dockerfile is missing a `COPY` step for `package.json`.

### Docker run fails with port already in use
- Make sure no other process is using the port (default 3003).
- You can change the port mapping with `-p`.

### Health check fails
- Check logs with `docker compose logs` or `docker logs <container>`.
- Make sure the server is running and accessible at the expected port.

## Monorepo Docker Build Notes

If you are building the Docker image in a monorepo setup (with `mcp-prompts-ts` and `mcp-prompts-catalog` as sibling directories), you must:

- Run Docker build commands from the monorepo root (not just `mcp-prompts-ts`).
- Ensure the Docker build context includes both `mcp-prompts-ts` and `mcp-prompts-catalog`.
- Update your Dockerfile to copy the catalog package:
  ```dockerfile
  COPY ../mcp-prompts-catalog ./mcp-prompts-catalog
  ```
- If you see errors like `Cannot find module '../../../mcp-prompts-catalog'`, it means the catalog package is missing from the build context.

## Docker Build in Monorepo Context

When building the Docker image from the monorepo root (recommended for multi-repo setups), you must update Dockerfile paths to reference files inside the `mcp-prompts-ts` directory. For example:

- `COPY package.json ./` → `COPY mcp-prompts-ts/package.json ./`
- `COPY docker/health-check.sh /health-check.sh` → `COPY mcp-prompts-ts/docker/health-check.sh /health-check.sh`

This ensures all required files are available in the build context and resolves errors when copying from outside the context.

## Prompt Management API Examples

### List all prompts
```bash
curl http://localhost:3003/prompts
```

### Add a prompt
```bash
curl -X POST http://localhost:3003/api/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prompt",
    "content": "This is a test prompt.",
    "isTemplate": false,
    "description": "A prompt for testing",
    "tags": ["test"]
  }'
```

### Update a prompt
```bash
curl -X PATCH "http://localhost:3003/api/v1/prompts/<id>?version=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prompt Updated",
    "content": "This is an updated test prompt.",
    "description": "Updated description"
  }'
```

### Verify prompt in filesystem
- Prompts are stored as JSON files in `data/prompts/` (e.g., `<id>.v<version>.json`).
- The index file is `index.json` in the same directory.

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

## Migration Guide

### Why migrate?
- Improved modularity and scalability
- Separate versioning and CI/CD for each component
- Fine-grained access control and easier collaboration

### New Structure
- Each major component (e.g., contracts, catalog, server) is now in its own repository
- This repository acts as the meta-repo, tracking and coordinating the ecosystem

### Migration Steps
1. **Clone the new repositories** for each component you need (see MIGRATION.md for links)
2. **Update your dependencies** to use the new NPM packages (e.g., `@sparesparrow/mcp-prompts-contracts`, `@sparesparrow/mcp-prompts-catalog`)
3. **Update import paths** in your code to reference the new packages
4. **Migrate any local data or configuration** as described in the [MIGRATION.md](MIGRATION.md)
5. **Test your setup** using the new multi-repo structure and report any issues

### Best Practices
- Migrate incrementally: you can move one component at a time
- Use version tags and releases to coordinate changes across repos
- Set up CI/CD for each repo to automate testing and publishing
- Use the meta-repo for coordination, documentation, and cross-repo issues

For full details and troubleshooting, see [MIGRATION.md](MIGRATION.md).

## JSON-RPC 2.0 API

The MCP Prompts server supports a JSON-RPC 2.0 API at the `/rpc` endpoint. All protocol-relevant actions (prompt management, workflows, tool discovery, consent, etc.) can be accessed via JSON-RPC methods.

### Endpoint

```
POST /rpc
Content-Type: application/json
```

### Example: getCapabilities

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getCapabilities",
  "params": {}
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "server": "mcp-prompts",
    "version": "1.0.0",
    "features": ["prompts.list", "prompts.get", ...],
    "methods": ["getCapabilities", "prompts.list", ...],
    "protocol": "MCP"
  }
}
```

### Example: prompts.list

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "prompts.list",
  "params": {}
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": []
}
```

### Example: prompts.create

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "prompts.create",
  "params": {
    "name": "Example",
    "content": "Hello, {{name}}!",
    "isTemplate": true,
    "tags": ["test"]
  }
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "id": "example-id",
    "name": "Example",
    "content": "Hello, {{name}}!",
    ...
  }
}
```

### Example: tools.list (Tool/Resource Discovery)

Returns a list of available tools/resources dynamically discovered from the prompt catalog. Each tool includes metadata such as id, name, description, variables (arguments), tags, and category.

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools.list",
  "params": {}
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "result": [
    {
      "id": "project-analysis-assistant",
      "name": "Project Analysis Assistant",
      "description": "A comprehensive template for analyzing project structure and codebase with filesystem resource integration",
      "tags": ["development", "project-analysis", "architecture", "resource-enabled", "code-quality"],
      "variables": ["language", "project_path", "specific_focus", "additional_context"],
      "metadata": { ... },
      "category": "general"
    },
    ...
  ]
}
```

### Example: tools.invoke (Tool/Resource Invocation)

Invokes a tool by ID, passing arguments as required by the tool's variables. Only template-based tools are currently invokable; workflows and multi-step tools will return a not-implemented error.

Request:
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "tools.invoke",
  "params": {
    "tool": "project-analysis-assistant",
    "args": {
      "language": "TypeScript",
      "project_path": "src/",
      "specific_focus": "API design",
      "additional_context": "Focus on REST endpoints."
    }
  }
}
```
Response:
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "result": {
    "content": "You are an advanced project analysis assistant examining a TypeScript project. The project is located at @resource://filesystem/src/.\n\n**Project Analysis Instructions:**\n..."
  }
}
```

If the tool is not found or not invokable, an error is returned:
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "error": { "code": -32004, "message": "Tool not found" }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "error": { "code": -32001, "message": "Tool is not a template or cannot be invoked directly" }
}
```

**Note:** Tools are dynamically discovered from the prompt catalog. Only template-based tools can currently be invoked; support for workflows and multi-step tools is planned for future releases.

### Error Handling
All errors are returned in the JSON-RPC error envelope:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": { "code": -32601, "message": "Method not found" }
}
```

### Automated Test Coverage
The JSON-RPC API is covered by integration tests in `tests/integration/rpc-endpoint.integration.test.ts`, ensuring protocol compliance and regression protection for all core methods.
