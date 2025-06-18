# MCP Tool Testing Guide

## Overview

This guide provides comprehensive testing procedures for all Allora MCP tools in both HTTP and stdio transport modes.

## Available MCP Tools

### 1. `list_all_topics`
**Description:** List all available prediction topics from the Allora network  
**Parameters:** None  
**Returns:** JSON array of topic objects

### 2. `get_inference_by_topic_id`
**Description:** Get latest prediction for a specific topic ID  
**Parameters:** 
- `topicID` (number, required): The topic ID to fetch prediction for  
**Returns:** JSON object with inference data

### 3. `health_check` (Added in this implementation)
**Description:** Check Allora API connectivity and server health  
**Parameters:** None  
**Returns:** Health status object

## Testing HTTP Mode

### Prerequisites
```bash
# Start server in HTTP mode
MCP_TRANSPORT=http ALLORA_API_KEY=your-key npm run dev

# Or using Docker
docker run -e MCP_TRANSPORT=http -e ALLORA_API_KEY=your-key -p 3001:3001 allora-mcp-secretvm
```

### Health Check Test
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "mode": "http", 
  "timestamp": "2024-06-18T10:30:00.000Z"
}
```

### SSE Connection Test
```bash
curl http://localhost:3001/sse
```

**Expected:** SSE stream starts (connection remains open)

### MCP Tool Testing (HTTP Mode)

#### Test 1: list_all_topics
```bash
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_all_topics",
      "arguments": {}
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"topics\": [\n    {\n      \"id\": 1,\n      \"metadata\": \"BTC/USD price prediction\",\n      ...\n    }\n  ]\n}"
      }
    ]
  }
}
```

#### Test 2: get_inference_by_topic_id
```bash
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_inference_by_topic_id",
      "arguments": {
        "topicID": 1
      }
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"topicId\": 1,\n  \"blockHeight\": 12345,\n  \"inferer\": \"0x...\",\n  \"value\": \"65000.50\",\n  \"timestamp\": \"2024-06-18T10:30:00Z\"\n}"
      }
    ]
  }
}
```

#### Test 3: health_check
```bash
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "health_check",
      "arguments": {}
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"status\": \"healthy\",\n  \"timestamp\": \"2024-06-18T10:30:00.000Z\",\n  \"message\": \"Allora API is accessible\"\n}"
      }
    ]
  }
}
```

## Testing Stdio Mode

### Prerequisites
```bash
# Start server in stdio mode
MCP_TRANSPORT=stdio ALLORA_API_KEY=your-key npm run dev
```

### Claude Desktop Integration Test

#### 1. Add to Claude Desktop MCP Config
```json
{
  "mcpServers": {
    "allora-secretvm": {
      "command": "node",
      "args": ["F:\\coding\\allora_mcp_SVM\\dist\\index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "ALLORA_API_KEY": "your-api-key-here",
        "ALLORA_CHAIN_SLUG": "TESTNET"
      }
    }
  }
}
```

#### 2. Test in Claude Desktop
Open Claude Desktop and test these prompts:

**Test 1: List Topics**
```
What prediction topics are available in Allora?
```

**Expected:** Claude should use `list_all_topics` tool and display available topics

**Test 2: Get Specific Prediction**
```
Get the latest BTC price prediction from Allora topic 1
```

**Expected:** Claude should use `get_inference_by_topic_id` tool with topicID=1

**Test 3: Health Check**
```
Check if the Allora connection is healthy
```

**Expected:** Claude should use `health_check` tool and report status

## Error Testing Scenarios

### Test Invalid API Key
```bash
MCP_TRANSPORT=http ALLORA_API_KEY=invalid-key npm run dev
```

**Expected Behavior:**
- Server should start
- Health check should fail
- Tool calls should return error responses
- No application crashes

### Test Invalid Topic ID
```bash
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "get_inference_by_topic_id",
      "arguments": {
        "topicID": 99999
      }
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -1,
    "message": "Failed to fetch inference for topic 99999: [API error message]"
  }
}
```

### Test Network Disconnection
1. Start server with valid API key
2. Block network access to Allora API
3. Test tool calls

**Expected:** Retry logic should activate, eventual timeout with clear error messages

## Performance Testing

### Load Testing (HTTP Mode)
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test concurrent requests
ab -n 100 -c 10 http://localhost:3001/health

# Test MCP tool performance
for i in {1..10}; do
  curl -X POST http://localhost:3001/messages \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":'$i',"method":"tools/call","params":{"name":"list_all_topics","arguments":{}}}' &
done
```

**Performance Targets:**
- Health endpoint: <100ms response time
- List topics: <5s response time
- Get inference: <3s response time
- Concurrent requests: Handle 10+ simultaneous connections

## Validation Checklist

### Basic Functionality
- [ ] Server starts in HTTP mode without errors
- [ ] Server starts in stdio mode without errors
- [ ] Health endpoint responds correctly
- [ ] All MCP tools return valid responses
- [ ] Error handling works for invalid inputs
- [ ] Environment variable validation works

### Claude Desktop Integration
- [ ] MCP server connects to Claude Desktop
- [ ] All tools accessible through Claude interface
- [ ] Natural language queries trigger appropriate tools
- [ ] Error messages are user-friendly

### Performance & Reliability
- [ ] Response times meet performance targets
- [ ] Server handles concurrent requests
- [ ] Retry logic works for network failures
- [ ] Memory usage remains stable under load
- [ ] No memory leaks during extended operation

### SecretVM Deployment
- [ ] Docker image builds successfully
- [ ] Container starts in both modes
- [ ] Environment variables pass through correctly
- [ ] Logs are accessible via secretvm-cli
- [ ] Health checks work in containerized environment

## Troubleshooting Common Issues

### Issue: "Transport connection failed"
**Solutions:**
- Verify MCP_TRANSPORT environment variable is set correctly
- Check that only one transport mode is active
- Ensure no port conflicts in HTTP mode

### Issue: "Allora API calls failing"
**Solutions:**
- Verify ALLORA_API_KEY is valid and has correct permissions
- Check network connectivity to Allora API endpoints
- Review retry logic and timeout settings

### Issue: "Claude Desktop not detecting server"
**Solutions:**
- Verify stdio mode is configured correctly
- Check MCP configuration file syntax
- Ensure server process starts without errors
- Review Claude Desktop logs for connection errors

### Issue: "Poor performance or timeouts"
**Solutions:**
- Verify network connectivity and latency
- Check Allora API rate limits
- Review retry and timeout configurations
- Monitor server resource usage

This testing guide ensures comprehensive validation of all MCP functionality across both transport modes and deployment scenarios.
