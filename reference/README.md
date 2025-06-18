# Original Allora MCP Server

This is a copy of the original Allora MCP Server implementation from the arbitrum-vibekit repository.

**Source Location:** `F:\coding\arbitrum-vibekit-main\typescript\lib\mcp-tools\allora-mcp-server\`

## Files in this reference:

- `original_index.ts` - Original main entry point with dual transport (HTTP + stdio)
- `original_mcp.ts` - Core MCP server logic (keep unchanged in new implementation)
- `original_package.json` - Original dependencies and scripts

## Key Problem with Original Implementation:

**Lines 15-61 in `original_index.ts`:**
```typescript
// HTTP/Express setup (lines 15-54)
const app = express();
// ... HTTP/SSE transport setup

// Stdio setup (lines 56-61)  
const stdioTransport = new StdioServerTransport();
await server.connect(stdioTransport);
```

**Issue:** Both transports run simultaneously, causing connection conflicts with Claude Desktop.

## Solution: Conditional Transport Selection

Modify `src/index.ts` to run ONLY ONE transport based on `MCP_TRANSPORT` environment variable:

```typescript
const transportMode = process.env.MCP_TRANSPORT || 'stdio';

if (transportMode === 'http') {
  // Run HTTP/SSE server only
} else if (transportMode === 'stdio') {
  // Run stdio server only  
}
```

This eliminates the dual transport conflicts while maintaining all existing functionality.
