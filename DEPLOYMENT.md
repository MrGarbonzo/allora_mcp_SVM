# SecretVM Deployment Instructions

## Prerequisites

1. **SecretVM CLI Setup**
   ```bash
   # Install secretvm-cli globally
   npm install -g secretvm-cli
   
   # Login with Keplr wallet
   secretvm-cli auth login --wallet-address <your-keplr-address>
   
   # Verify authentication
   secretvm-cli status
   ```

2. **Required Files**
   - `Dockerfile` (to be created)
   - `docker-compose.yml` (to be created)
   - Built application in `dist/` directory

## Deployment Steps

### Step 1: Build Application Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test both transport modes locally
MCP_TRANSPORT=stdio ALLORA_API_KEY=test npm start
MCP_TRANSPORT=http ALLORA_API_KEY=test npm start
```

### Step 2: Create VM on SecretVM

```bash
# Deploy to SecretVM
secretvm-cli vm create \
  --name "allora-mcp-poc" \
  --type "small" \
  --docker-compose "./docker-compose.yml"
```

### Step 3: Configure Environment Variables

During VM creation, SecretVM will prompt for private environment variables. Upload:

**For HTTP Mode:**
```
MCP_TRANSPORT=http
ALLORA_API_KEY=UP-86455f53320d4ee48a958cc0
ALLORA_CHAIN_SLUG=TESTNET
PORT=3001
NODE_ENV=production
```

**For Stdio Mode:**
```
MCP_TRANSPORT=stdio
ALLORA_API_KEY=UP-86455f53320d4ee48a958cc0
ALLORA_CHAIN_SLUG=TESTNET
NODE_ENV=production
```

### Step 4: Verify Deployment

```bash
# Get VM details
secretvm-cli vm list
secretvm-cli vm status <vm-uuid>

# Monitor deployment logs
secretvm-cli vm logs <vm-id>

# Test HTTP mode (if deployed)
curl http://<vm-ip>:3001/health
```

### Step 5: CPU Attestation Verification

```bash
# Get attestation quote
curl http://<vm-ip>:29343/cpu.html

# Verify using SecretAI Portal:
# 1. Go to SecretAI Portal Verification page
# 2. Paste attestation quote
# 3. Click "Verify"
# 4. Note register values for verification
```

## Testing Scenarios

### HTTP Mode Testing
```bash
# Health check
curl http://<vm-ip>:3001/health

# SSE endpoint
curl http://<vm-ip>:3001/sse

# Test MCP tools (requires MCP client)
```

### Stdio Mode Testing
```bash
# Local Claude Desktop integration
# Add to Claude Desktop MCP config:
{
  "mcpServers": {
    "allora-secretvm": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "ALLORA_API_KEY": "your-key"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **VM Creation Fails**
   - Check docker-compose.yml syntax
   - Verify authentication status
   - Ensure sufficient account credits

2. **Application Won't Start**
   - Check environment variables are set correctly
   - Verify ALLORA_API_KEY is valid
   - Check logs: `secretvm-cli vm logs <vm-id>`

3. **Network Connectivity Issues**
   - Verify VM has public IP assigned
   - Check port 3001 is exposed correctly
   - Test from different networks

4. **Attestation Verification Fails**
   - Ensure VM is fully started
   - Try accessing attestation endpoint multiple times
   - Verify TLS certificate matches

### Log Monitoring

```bash
# Continuous log monitoring
secretvm-cli vm logs <vm-id> --follow

# Check specific time range
secretvm-cli vm logs <vm-id> --since "2024-01-01T00:00:00Z"
```

### VM Management

```bash
# Start/stop VM
secretvm-cli vm start <vm-id>
secretvm-cli vm stop <vm-id>

# Remove VM (permanent)
secretvm-cli vm remove <vm-id>

# Get detailed status
secretvm-cli vm status <vm-uuid>
```

## Security Notes

- API keys are uploaded privately and not visible in logs
- All communication with Allora API uses HTTPS
- VM provides CPU attestation for verification
- No persistent storage of sensitive data
- Minimal attack surface with single container

## Performance Expectations

- **VM Type:** Small (1 CPU, 2GB RAM)
- **Response Time:** <5 seconds for typical queries
- **Concurrent Users:** 10-20 simultaneous connections
- **Uptime:** 99%+ with restart policy

## Support

For issues:
1. Check VM logs first: `secretvm-cli vm logs <vm-id>`
2. Verify environment configuration
3. Test API connectivity manually
4. Complete attestation verification process
