// Patch for missing type declarations in external packages

declare module '@sparesparrow/mcp-prompts-contracts/dist/interfaces' {
  export * from '../../node_modules/@sparesparrow/mcp-prompts-contracts/dist/interfaces';
}
declare module '@sparesparrow/mcp-prompts-contracts/dist/schemas' {
  export * from '../../node_modules/@sparesparrow/mcp-prompts-contracts/dist/schemas';
}
declare module '@modelcontextprotocol/sdk/dist/esm/server' {
  export * from '../../node_modules/@modelcontextprotocol/sdk/dist/esm/server';
}
declare module '@modelcontextprotocol/sdk/dist/esm/server/sse' {
  export * from '../../node_modules/@modelcontextprotocol/sdk/dist/esm/server/sse';
}
declare module '@modelcontextprotocol/sdk/dist/esm/shared/transport' {
  export * from '../../node_modules/@modelcontextprotocol/sdk/dist/esm/shared/transport';
}

// Type patch for MCP SDK ESM import
// Allows TypeScript to resolve types for the ESM import with .js extension

declare module '@modelcontextprotocol/sdk/dist/esm/server/mcp.js' {
  export * from '@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts';
} 