# **Complete Implementation Plan: Allora MCP Server for SecretVM**

## **Project Overview**

**Objective:** Convert existing Allora MCP server to support conditional transport (HTTP/stdio) and deploy to SecretVM for confidential computing POC.

**Key Requirements:**
- Single codebase with environment-driven transport selection
- `MCP_TRANSPORT=stdio` for Claude Desktop
- `MCP_TRANSPORT=http` for web clients  
- Minimal changes to existing business logic
- SecretVM deployment with private environment variable configuration

## **Architecture Overview**

**Single Codebase, Environment-Driven Transport Selection**
- One Docker image that runs either HTTP or stdio based on `MCP_TRANSPORT` environment variable
- Same business logic, different transport layers
- SecretVM deployment with private environment variable upload for configuration

## **Phase 1: Code Modifications (Minimal Changes)**

### **1.1 Modify `src/index.ts` - Transport Selection Logic**

**Required Changes:**
1. Add environment variable check at the top of `main()` function
2. Wrap existing HTTP server logic in `if (transportMode === 'http')` block
3. Wrap existing stdio server logic in `if (transportMode === 'stdio')` block
4. Add validation for invalid transport modes

**Reference Original Code Location:**
- Original file: `F:\coding\arbitrum-vibekit-main\typescript\lib\mcp-tools\allora-mcp-server\src\index.ts`
- Lines ~30-60: HTTP/SSE setup code
- Lines ~70+: Stdio setup code

**Implementation Notes:**
- Default to 'stdio' if MCP_TRANSPORT not set
- Exit with error for invalid transport values
- Maintain all existing logging and error handling

### **1.2 Keep `src/mcp-server.ts` Unchanged**
- Core MCP server logic and Allora tools remain identical
- No changes needed to business logic
- Same tool definitions work for both transports

### **1.3 Add Health Check Endpoint (HTTP mode only)**
- Add `/health` endpoint when in HTTP mode
- Return JSON with status, mode, and timestamp
- Useful for SecretVM monitoring

### **1.4 Update Environment Variable Handling**
- Ensure all required env vars are validated on startup
- Add clear error messages for missing configuration
- Support both TESTNET and MAINNET chain slugs

## **Phase 2: Docker Configuration**

### **2.1 Create Dockerfile**
**Requirements:**
- Use Node.js 18 Alpine base image
- Multi-stage build for smaller image size
- Non-root user for security
- Expose port 3001 for HTTP mode
- Copy built application files

### **2.2 Create docker-compose.yml for SecretVM**
**Configuration:**
- Single service definition
- Port mapping for HTTP access
- Environment variable placeholders
- Health check configuration
- Logging configuration for SecretVM monitoring
- Restart policy

**Environment Variables:**
- `MCP_TRANSPORT` - Transport mode selection
- `ALLORA_API_KEY` - API key for Allora network
- `ALLORA_CHAIN_SLUG` - Network selection (TESTNET/MAINNET)
- `PORT` - HTTP port (default 3001)
- `NODE_ENV` - Production environment

## **Phase 3: SecretVM Deployment Workflow**

### **3.1 Local Preparation**
1. Apply code modifications to support conditional transport
2. Create Docker configuration files
3. Test both transport modes locally
4. Validate all environment variables work correctly

### **3.2 SecretVM Authentication**
```bash
secretvm-cli auth login --wallet-address <keplr-address>
secretvm-cli status  # Verify login
```

### **3.3 Deploy to SecretVM**
```bash
secretvm-cli vm create \
  --name "allora-mcp-poc" \
  --type "small" \
  --docker-compose "./docker-compose.yml"
```

### **3.4 Private Environment Variable Configuration**

**For HTTP Mode Deployment:**
```
MCP_TRANSPORT=http
ALLORA_API_KEY=<your-actual-api-key>
ALLORA_CHAIN_SLUG=TESTNET
PORT=3001
```

**For Stdio Mode Deployment:**
```
MCP_TRANSPORT=stdio
ALLORA_API_KEY=<your-actual-api-key>
ALLORA_CHAIN_SLUG=TESTNET
```

## **Phase 4: Testing & Validation**

### **4.1 Deployment Verification**
```bash
# Check VM status
secretvm-cli vm list
secretvm-cli vm status <vm-uuid>

# Monitor logs
secretvm-cli vm logs <vm-id>
```

### **4.2 HTTP Mode Testing**
```bash
# Health check
curl http://<vm-ip>:3001/health

# MCP endpoint test
curl http://<vm-ip>:3001/sse

# Tool functionality test
# Use MCP client to test list_all_topics and get_inference_by_topic_id
```

### **4.3 Stdio Mode Testing**
- Local testing with Claude Desktop integration
- Verify MCP configuration works
- Test all Allora tools through Claude interface

## **Phase 5: CPU Attestation & Verification**

### **5.1 Retrieve Attestation Quote**
```bash
curl http://<vm-ip>:29343/cpu.html
```

### **5.2 Verify Attestation**
1. Use SecretAI Portal Verification page
2. Paste attestation quote in "Verify CPU Attestation" tab
3. Confirm validity and note register values
4. Verify TLS certificate fingerprint matches report_data

### **5.3 Optional: Build Verification**
- Use reproduce-mr tool to calculate expected register values
- Compare with attestation quote values
- Confirm VM is running expected code

## **Phase 6: Integration Testing**

### **6.1 End-to-End Testing**
- HTTP mode: Web client → SecretVM → Allora API
- Stdio mode: Claude Desktop → Local process → Allora API
- Verify all MCP tools function correctly
- Test error handling and retry logic

### **6.2 Performance Testing**
- Load testing for HTTP mode
- Response time validation (<5s target)
- Resource usage monitoring
- Network connectivity reliability

## **Phase 7: Production Readiness**

### **7.1 Security Validation**
- API keys stored as environment variables only
- No persistent sensitive data
- TLS for external communications
- CPU attestation verification completed
- Minimal attack surface

### **7.2 Monitoring Setup**
- Health check endpoints
- Log aggregation via SecretVM CLI
- Resource monitoring
- Error alerting

## **Success Criteria**

✅ **Single Codebase:** Same code runs in both HTTP and stdio modes  
✅ **Environment Selection:** Transport controlled by MCP_TRANSPORT  
✅ **SecretVM Deployment:** Successful deployment via docker-compose  
✅ **Private Configuration:** API keys uploaded securely  
✅ **Allora Integration:** All MCP tools function correctly  
✅ **Attestation:** CPU attestation verifies integrity  
✅ **Performance:** Response times under 5 seconds  
✅ **Monitoring:** Logs accessible via SecretVM CLI  

## **Risk Mitigation**

### **Technical Risks**
- Transport configuration errors → Comprehensive testing
- API connectivity issues → Network validation
- Resource constraints → Performance monitoring

### **Operational Risks**
- Environment misconfiguration → Detailed documentation
- Deployment failures → Step-by-step validation
- Monitoring gaps → Automated health checks

## **Files to Create/Modify**

### **New Files:**
- `Dockerfile` - Container build configuration
- `docker-compose.yml` - SecretVM deployment configuration
- `.dockerignore` - Build optimization
- `DEPLOYMENT.md` - Deployment instructions

### **Modified Files:**
- `src/index.ts` - Add transport selection logic
- `package.json` - Add Docker build scripts
- `README.md` - Update with SecretVM deployment info

### **Reference Files:**
- Original implementation: `F:\coding\arbitrum-vibekit-main\typescript\lib\mcp-tools\allora-mcp-server\`
- SecretVM docs: `F:\coding\documents\secretVM\`

## **Implementation Priority**

1. **Critical:** Transport selection logic in src/index.ts
2. **High:** Docker configuration files
3. **Medium:** Testing and validation procedures
4. **Low:** Advanced monitoring and optimization

This plan provides the complete roadmap for Claude Code to implement the conditional transport Allora MCP server with SecretVM integration.
