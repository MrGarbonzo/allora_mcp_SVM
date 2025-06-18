# Implementation Checklist for Claude Code

## **Critical Reference Files**

### **Original Allora MCP Server**
**Location:** `F:\coding\arbitrum-vibekit-main\typescript\lib\mcp-tools\allora-mcp-server\`

**Key Files to Reference:**
- `src/index.ts` - Main entry point with dual transport setup
- `src/mcp.ts` - Core MCP server logic (keep unchanged)
- `package.json` - Dependencies and scripts

**Important Code Sections in Original `src/index.ts`:**
- Lines ~30-60: HTTP/SSE server setup code
- Lines ~70+: Stdio transport setup code
- Express app configuration
- Server connection logic

### **SecretVM Documentation**
**Location:** `F:\coding\documents\secretVM\`

**Key Reference Files:**
- `Virtual Machine Commands.txt` - VM deployment commands
- `secretvm-cli-master/src/commands/vm/create.ts` - VM creation process
- `secretVM_full_verification.txt` - Attestation verification process

## **Phase 1: Code Implementation Tasks**

### **Task 1.1: Modify `src/index.ts`**

**Objective:** Add conditional transport selection based on `MCP_TRANSPORT` environment variable

**Required Changes:**
1. **Add environment variable check at top of main():**
   ```typescript
   const transportMode = process.env.MCP_TRANSPORT || 'stdio';
   ```

2. **Wrap existing HTTP server code in conditional:**
   ```typescript
   if (transportMode === 'http') {
     // Move existing Express app and HTTP/SSE setup here
   }
   ```

3. **Wrap existing stdio code in conditional:**
   ```typescript
   if (transportMode === 'stdio') {
     // Move existing stdio transport setup here
   }
   ```

4. **Add validation:**
   ```typescript
   if (!['http', 'stdio'].includes(transportMode)) {
     console.error('Invalid MCP_TRANSPORT. Use "http" or "stdio"');
     process.exit(1);
   }
   ```

**Reference:** Look at original `src/index.ts` to see exact code structure

### **Task 1.2: Add Health Check Endpoint**

**Objective:** Add `/health` endpoint for HTTP mode monitoring

**Implementation:**
- Add to HTTP mode section only
- Return JSON with status, mode, timestamp
- Useful for SecretVM health monitoring

### **Task 1.3: Environment Variable Validation**

**Objective:** Ensure all required env vars are validated on startup

**Required Variables:**
- `ALLORA_API_KEY` (required)
- `MCP_TRANSPORT` (default: 'stdio')
- `ALLORA_CHAIN_SLUG` (default: 'TESTNET')
- `PORT` (default: 3001, HTTP mode only)

## **Phase 2: Docker Configuration Tasks**

### **Task 2.1: Create Dockerfile**

**Requirements:**
- Base image: `node:18-alpine`
- Working directory: `/app`
- Copy package files and install dependencies
- Copy source code and build
- Create non-root user
- Expose port 3001
- CMD: `["node", "dist/index.js"]`

### **Task 2.2: Create docker-compose.yml**

**Requirements:**
- Version 3.8
- Single service: `allora-mcp`
- Port mapping: `"3001:3001"`
- Environment variables with placeholders
- Health check configuration
- Restart policy: `unless-stopped`
- Logging configuration

**Environment Variables to Include:**
```yaml
environment:
  - MCP_TRANSPORT=${MCP_TRANSPORT}
  - ALLORA_API_KEY=${ALLORA_API_KEY}
  - ALLORA_CHAIN_SLUG=${ALLORA_CHAIN_SLUG:-TESTNET}
  - PORT=${PORT:-3001}
  - NODE_ENV=production
```

### **Task 2.3: Create .dockerignore**

**Include:**
- `node_modules`
- `dist`
- `.git`
- `*.log`
- `.env*`
- `README.md`

## **Phase 3: Testing Tasks**

### **Task 3.1: Local Testing**

**Test Scenarios:**
1. **Stdio Mode Test:**
   ```bash
   MCP_TRANSPORT=stdio ALLORA_API_KEY=test npm run dev
   ```

2. **HTTP Mode Test:**
   ```bash
   MCP_TRANSPORT=http ALLORA_API_KEY=test npm run dev
   curl http://localhost:3001/health
   ```

3. **Invalid Mode Test:**
   ```bash
   MCP_TRANSPORT=invalid ALLORA_API_KEY=test npm run dev
   # Should exit with error
   ```

### **Task 3.2: Docker Build Test**

**Test Commands:**
```bash
# Build Docker image
docker build -t allora-mcp-secretvm .

# Test HTTP mode
docker run -e MCP_TRANSPORT=http -e ALLORA_API_KEY=test -p 3001:3001 allora-mcp-secretvm

# Test stdio mode
docker run -e MCP_TRANSPORT=stdio -e ALLORA_API_KEY=test allora-mcp-secretvm
```

## **Phase 4: Documentation Tasks**

### **Task 4.1: Update README.md**

**Add Sections:**
- SecretVM deployment instructions
- Environment variable documentation
- Transport mode explanation
- Docker usage examples

### **Task 4.2: Update package.json**

**Add Scripts:**
```json
{
  "scripts": {
    "docker:build": "docker build -t allora-mcp-secretvm .",
    "docker:run:http": "docker run -e MCP_TRANSPORT=http -e ALLORA_API_KEY=${ALLORA_API_KEY} -p 3001:3001 allora-mcp-secretvm",
    "docker:run:stdio": "docker run -e MCP_TRANSPORT=stdio -e ALLORA_API_KEY=${ALLORA_API_KEY} allora-mcp-secretvm"
  }
}
```

## **Critical Success Factors**

### **Code Quality Checks**
- [ ] TypeScript builds without errors
- [ ] ESLint passes with no warnings
- [ ] Both transport modes start successfully
- [ ] Environment validation works correctly
- [ ] Health endpoint responds in HTTP mode

### **Docker Validation**
- [ ] Docker image builds successfully
- [ ] Container starts in both modes
- [ ] Port 3001 is accessible in HTTP mode
- [ ] Environment variables pass through correctly
- [ ] Health check works

### **Integration Testing**
- [ ] HTTP mode: Can connect via curl/browser
- [ ] Stdio mode: Can integrate with Claude Desktop
- [ ] Allora API calls work from both modes
- [ ] Error handling works properly

## **Common Pitfalls to Avoid**

1. **Don't Change Core Logic:** Keep `src/mcp-server.ts` unchanged
2. **Environment Defaults:** Provide sensible defaults for optional vars
3. **Port Binding:** Only bind ports in HTTP mode
4. **Error Messages:** Provide clear error messages for misconfiguration
5. **Logging:** Maintain existing logging patterns for SecretVM compatibility

## **Reference Commands**

### **SecretVM CLI Commands**
```bash
# Authentication
secretvm-cli auth login --wallet-address <address>
secretvm-cli status

# VM Management
secretvm-cli vm create --name "allora-mcp-poc" --type "small" --docker-compose "./docker-compose.yml"
secretvm-cli vm list
secretvm-cli vm status <vm-uuid>
secretvm-cli vm logs <vm-id>
```

### **Testing Commands**
```bash
# Health check
curl http://<vm-ip>:3001/health

# Attestation
curl http://<vm-ip>:29343/cpu.html
```

## **Files to Create**
- [ ] `Dockerfile`
- [ ] `docker-compose.yml`
- [ ] `.dockerignore`

## **Files to Modify**
- [ ] `src/index.ts` (transport selection logic)
- [ ] `package.json` (add Docker scripts)
- [ ] `README.md` (update with SecretVM info)

This checklist provides Claude Code with all necessary information to successfully implement the conditional transport Allora MCP server for SecretVM deployment.
