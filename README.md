# Allora MCP Server for SecretVM

A clean, optimized Model Context Protocol (MCP) server for accessing Allora Network predictions, specifically designed for deployment on SecretVM with enhanced privacy and reliability.

## Key Features

- **🔒 SecretVM Optimized**: Designed specifically for private computation environments
- **📡 Single Transport**: Stdio-only transport eliminates Claude Desktop connection issues
- **🔄 Robust Error Handling**: Built-in retry logic and graceful degradation
- **⚡ Lightweight**: Minimal dependencies for efficient SecretVM deployment
- **🛡️ Secure**: No HTTP endpoints, reduced attack surface

## Quick Start

### Prerequisites

- Node.js 18+
- Allora API key (get one at [developer.allora.network](https://developer.allora.network))

### Installation

```bash
# Clone or extract to your desired location
cd F:\coding\allora_mcp_SVM

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API key
# ALLORA_API_KEY=your_api_key_here
# ALLORA_CHAIN_SLUG=TESTNET
```

### Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run built version
npm run start
```

### Claude Desktop Integration

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "allora-secretvm": {
      "command": "node",
      "args": ["F:\\coding\\allora_mcp_SVM\\dist\\index.js"],
      "env": {
        "ALLORA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_all_topics` | Get all available Allora prediction topics | None |
| `get_inference_by_topic_id` | Get latest prediction for a specific topic | `topicID: number` |
| `health_check` | Check Allora API connectivity | None |

## Example Usage

Once connected to Claude:

```
What prediction topics are available in Allora?
```

```
Get the latest BTC price prediction from topic 1
```

```
Check if the Allora connection is healthy
```

## SecretVM Deployment

This server is optimized for SecretVM with:

- **Stateless Design**: No persistent storage requirements
- **Minimal Resource Usage**: Optimized for constrained environments
- **Secure Defaults**: Environment-based configuration only
- **Error Resilience**: Graceful handling of network issues

### Environment Variables

- `ALLORA_API_KEY` (required): Your Allora API key
- `ALLORA_CHAIN_SLUG` (optional): "TESTNET" or "MAINNET" (default: TESTNET)

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude        │    │  Allora MCP      │    │  Allora API     │
│   Desktop       │◄──►│  Server          │◄──►│  Network        │
│                 │    │  (SecretVM)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
      stdio                   stdio                   HTTPS
```

## Differences from Original

This version addresses the original server's issues:

- ❌ **Removed**: Express, HTTP/SSE transport, dual transport mode
- ✅ **Added**: Enhanced error handling, retry logic, health checks
- ✅ **Fixed**: Claude Desktop connection issues
- ✅ **Optimized**: For SecretVM deployment constraints

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
