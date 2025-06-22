# MCP Prompts TypeScript Implementation

Tento repozitář obsahuje hlavní TypeScript implementaci MCP Prompts serveru. Poskytuje kompletní HTTP API pro správu a používání promptů, workflow a šablon.

## Účel

- **HTTP Server**: Poskytuje REST API pro MCP Prompts
- **Prompt Management**: Správa promptů, workflow a šablon
- **Template Engine**: Pokročilý templating systém
- **Storage Adapters**: Podpora pro různé úložiště (soubory, PostgreSQL)
- **SSE Support**: Server-Sent Events pro real-time komunikaci

## Funkce

- **Prompt API**: CRUD operace pro prompty
- **Workflow Engine**: Spouštění a správa workflow
- **Template Processing**: Zpracování šablon s proměnnými
- **Storage Adapters**: Souborový systém a PostgreSQL
- **Validation**: Zod schémata pro validaci
- **Error Handling**: Komplexní error handling
- **Logging**: Strukturované logování

## Instalace

```bash
npm install @sparesparrow/mcp-prompts
```

## Použití

```bash
# Vývoj
npm install
npm run dev

# Produkce
npm run build
npm start

# Testy
npm test
```

## API Endpoints

- `GET /prompts` - Seznam všech promptů
- `POST /prompts` - Vytvoření nového promptu
- `GET /prompts/:id` - Získání promptu
- `PUT /prompts/:id` - Aktualizace promptu
- `DELETE /prompts/:id` - Smazání promptu
- `POST /workflows` - Spuštění workflow
- `GET /templates` - Seznam šablon

## Konfigurace

```json
{
  "port": 3000,
  "storage": {
    "type": "file",
    "path": "./data"
  },
  "templates": {
    "delimiters": ["{{", "}}"]
  }
}
```

## Závislosti

- `@sparesparrow/mcp-prompts-contracts` - API definice
- `@sparesparrow/mcp-prompts-collection` - Prompt sbírka
