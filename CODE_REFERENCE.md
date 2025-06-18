# Code Reference Guide for Claude Code Implementation

## **Original Code Analysis**

### **Current Architecture Problem**
The original `src/index.ts` runs BOTH HTTP and stdio transports simultaneously:
- Lines 1-54: HTTP/Express server setup
- Lines 56-61: Stdio transport setup  
- **Issue:** Both transports connect to same McpServer instance causing conflicts

### **Solution: Conditional Transport Selection**
Modify to run ONLY ONE transport based on environment variable.

## **Exact Code Changes Required**

### **File: `src/index.ts`**

**Current Code Structure:**
```typescript
async function main() {
  const app = express();
  // ... express setup (lines 15-25)
  
  const apiKey = process.env.ALLORA_API_KEY || "UP-86455f53320d4ee48a958cc0";
  // ... API client setup (lines 27-35)
  
  const server = await createServer(alloraClient);
  
  // HTTP/SSE Transport Setup (lines 37-54)
  const transports: { [sessionId: string]: SSEServerTransport } = {};
  app.get("/sse", async (_req, res) => { ... });
  app.post("/messages", async (_req, res) => { ... });
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => { ... });
  
  // Stdio Transport Setup (lines 56-61)  
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}
```

**Required Modification Pattern:**
```typescript
async function main() {
  // Add transport selection logic
  const transportMode = process.env.MCP_TRANSPORT || 'stdio';
  
  if (!['http', 'stdio'].includes(transportMode)) {
    console.error('Invalid MCP_TRANSPORT. Use "http" or "stdio"');
    process.exit(1);
  }
  
  console.log(`Starting Allora MCP Server in ${transportMode} mode`);
  
  // Common setup (keep existing)
  const apiKey = process.env.ALLORA_API_KEY || "UP-86455f53320d4ee48a958cc0";
  if (!apiKey) {
    console.error("Error: ALLORA_API_KEY environment variable is required");
    process.exit(1);
  }

  const alloraClient = new AlloraAPIClient({
    chainSlug: ChainSlug.TESTNET,
    apiKey,
  });
  const server = await createServer(alloraClient);
  
  // Conditional transport setup
  if (transportMode === 'http') {
    await startHttpServer(server);
  } else if (transportMode === 'stdio') {
    await startStdioServer(server);
  }
}

// Extract HTTP logic to separate function
async function startHttpServer(server) {
  const app = express();
  
  app.use(function (req, _res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  
  // Add health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      mode: 'http', 
      timestamp: new Date().toISOString() 
    });
  });
  
  // Move existing SSE/HTTP setup here
  const transports: { [sessionId: string]: SSEServerTransport } = {};
  
  app.get("/sse", async (_req, res) => { ... });
  app.post("/messages", async (_req, res) => { ... });
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
}

// Extract stdio logic to separate function  
async function startStdioServer(server) {
  const stdioTransport = new StdioServerTransport();
  console.error("Initializing stdio transport...");
  await server.connect(stdioTransport);
  console.error("Allora MCP stdio server started and connected.");
  console.error("Server is now ready to receive stdio requests.");
}
```

### **Key Modification Points:**

1. **Add at top of main():**
   ```typescript
   const transportMode = process.env.MCP_TRANSPORT || 'stdio';
   ```

2. **Add validation:**
   ```typescript
   if (!['http', 'stdio'].includes(transportMode)) {
     console.error('Invalid MCP_TRANSPORT. Use "http" or "stdio"');
     process.exit(1);
   }
   ```

3. **Wrap HTTP code:**
   Move lines 15-25 and 37-54 into `if (transportMode === 'http')` block

4. **Wrap stdio code:**
   Move lines 56-61 into `if (transportMode === 'stdio')` block

5. **Add health endpoint:**
   ```typescript
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', mode: 'http', timestamp: new Date().toISOString() });
   });
   ```

## **Docker Configuration Templates**

### **Dockerfile Template**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port (only used in HTTP mode)
EXPOSE 3001

# Health check (works for both modes)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed'); process.exit(0)" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

### **docker-compose.yml Template**
```yaml
version: '3.8'

services:
  allora-mcp:
    build: .
    ports:
      - "3001:3001"
    environment:
      # Will be set via SecretVM private env upload
      - MCP_TRANSPORT=${MCP_TRANSPORT}
      - ALLORA_API_KEY=${ALLORA_API_KEY}
      - ALLORA_CHAIN_SLUG=${ALLORA_CHAIN_SLUG:-TESTNET}
      - PORT=${PORT:-3001}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health check'); process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### **.dockerignore Template**
```
# Dependencies
node_modules/
npm-debug.log*

# Build output (will be built in container)
dist/

# Environment files
.env*

# Git
.git/
.gitignore

# Documentation
*.md
docs/

# IDE
.vscode/
.idea/

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
```

## **Environment Variable Reference**

### **Required Variables**
- `ALLORA_API_KEY` - API key for Allora network access
- `MCP_TRANSPORT` - Transport mode: 'http' or 'stdio'

### **Optional Variables**  
- `ALLORA_CHAIN_SLUG` - 'TESTNET' or 'MAINNET' (default: TESTNET)
- `PORT` - HTTP port number (default: 3001, HTTP mode only)
- `NODE_ENV` - Node environment (set to 'production' for SecretVM)

### **SecretVM Environment Upload**

**HTTP Mode Configuration:**
```
MCP_TRANSPORT=http
ALLORA_API_KEY=UP-86455f53320d4ee48a958cc0
ALLORA_CHAIN_SLUG=TESTNET  
PORT=3001
NODE_ENV=production
```

**Stdio Mode Configuration:**
```
MCP_TRANSPORT=stdio
ALLORA_API_KEY=UP-86455f53320d4ee48a958cc0
ALLORA_CHAIN_SLUG=TESTNET
NODE_ENV=production
```

## **Testing Commands Reference**

### **Local Testing**
```bash
# Test stdio mode
MCP_TRANSPORT=stdio ALLORA_API_KEY=test npm run dev

# Test HTTP mode  
MCP_TRANSPORT=http ALLORA_API_KEY=test npm run dev

# In another terminal (HTTP mode)
curl http://localhost:3001/health
curl http://localhost:3001/sse

# Test invalid mode (should fail)
MCP_TRANSPORT=invalid ALLORA_API_KEY=test npm run dev
```

### **Docker Testing**
```bash
# Build image
docker build -t allora-mcp-secretvm .

# Test HTTP mode
docker run -e MCP_TRANSPORT=http -e ALLORA_API_KEY=test -p 3001:3001 allora-mcp-secretvm

# Test stdio mode
docker run -e MCP_TRANSPORT=stdio -e ALLORA_API_KEY=test allora-mcp-secretvm

# Test with real API key
docker run -e MCP_TRANSPORT=http -e ALLORA_API_KEY=UP-86455f53320d4ee48a958cc0 -p 3001:3001 allora-mcp-secretvm
```

### **SecretVM Testing**
```bash
# Deploy
secretvm-cli vm create --name "allora-mcp-poc" --type "small" --docker-compose "./docker-compose.yml"

# Monitor
secretvm-cli vm logs <vm-id>

# Test endpoints
curl http://<vm-ip>:3001/health
curl http://<vm-ip>:3001/sse

# Attestation
curl http://<vm-ip>:29343/cpu.html
```

## **Critical Implementation Notes**

### **DO NOT CHANGE:**
- `src/mcp-server.ts` - Keep business logic unchanged
- `src/allora-client.ts` - Keep API wrapper unchanged  
- `src/types.ts` - Keep type definitions unchanged
- Core MCP tool definitions and Allora SDK usage

### **MUST CHANGE:**
- `src/index.ts` - Add transport selection logic only
- Add Docker configuration files
- Update package.json with Docker scripts

### **VALIDATION CHECKLIST:**
- [ ] Both transport modes start without errors
- [ ] HTTP mode serves health endpoint
- [ ] Stdio mode connects properly
- [ ] Environment validation works
- [ ] Docker builds successfully
- [ ] All existing MCP tools still work

This reference guide provides Claude Code with the exact patterns and templates needed for successful implementation.
