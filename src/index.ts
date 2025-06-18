#!/usr/bin/env node

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ChainSlug } from '@alloralabs/allora-sdk';
import dotenv from 'dotenv';
import express from 'express';
import { AlloraClientWrapper } from './allora-client.js';
import { createMCPServer } from './mcp-server.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Allora MCP Server
 * Supports both HTTP and stdio transports based on MCP_TRANSPORT environment variable
 * Designed for SecretVM deployment with conditional transport selection
 */
async function main(): Promise<void> {
  try {
    // Determine transport mode from environment variable
    const transportMode = process.env.MCP_TRANSPORT || 'stdio';
    
    // Validate transport mode
    if (!['http', 'stdio'].includes(transportMode)) {
      console.error('[ERROR] Invalid MCP_TRANSPORT. Use "http" or "stdio"');
      process.exit(1);
    }
    
    console.error(`[INFO] Starting Allora MCP Server in ${transportMode} mode...`);
    
    // Validate required environment variables
    const apiKey = process.env.ALLORA_API_KEY;
    if (!apiKey) {
      console.error('[ERROR] ALLORA_API_KEY environment variable is required');
      process.exit(1);
    }

    // Determine chain slug from environment or default to testnet
    const chainSlugEnv = process.env.ALLORA_CHAIN_SLUG?.toUpperCase();
    const chainSlug = chainSlugEnv === 'MAINNET' ? ChainSlug.MAINNET : ChainSlug.TESTNET;
    
    console.error(`[INFO] Using chain: ${chainSlug}`);
    console.error(`[INFO] API Key: ${apiKey.substring(0, 8)}...`);

    // Initialize Allora client
    const alloraClient = new AlloraClientWrapper(apiKey, chainSlug);
    
    // Perform initial health check
    console.error('[INFO] Performing initial health check...');
    const isHealthy = await alloraClient.healthCheck();
    if (!isHealthy) {
      console.error('[WARN] Initial health check failed, but continuing...');
    } else {
      console.error('[INFO] Initial health check passed');
    }

    // Create MCP server
    const server = createMCPServer(alloraClient);

    if (transportMode === 'http') {
      // HTTP/SSE transport mode
      const app = express();
      
      app.use(function (req, _res, next) {
        console.log(`${req.method} ${req.url}`);
        next();
      });

      const transports: { [sessionId: string]: SSEServerTransport } = {};

      // Health check endpoint
      app.get('/health', (_req, res) => {
        res.json({
          status: 'healthy',
          mode: 'http',
          timestamp: new Date().toISOString(),
          chain: chainSlug
        });
      });

      app.get('/sse', async (_req, res) => {
        console.log('[INFO] Received SSE connection');

        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;

        await server.connect(transport);
      });

      app.post('/messages', async (_req, res) => {
        const sessionId = _req.query.sessionId as string;
        console.log(`[INFO] Received message for session: ${sessionId}`);

        let bodyBuffer = Buffer.alloc(0);

        _req.on('data', (chunk) => {
          bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
        });

        _req.on('end', async () => {
          try {
            const bodyStr = bodyBuffer.toString('utf8');
            const bodyObj = JSON.parse(bodyStr);
            console.log(`[DEBUG] Message: ${JSON.stringify(bodyObj, null, 2)}`);
          } catch (error) {
            console.error(`[ERROR] Error handling request: ${error}`);
          }
        });

        const transport = transports[sessionId];
        if (!transport) {
          res.status(400).send('No transport found for sessionId');
          return;
        }
        await transport.handlePostMessage(_req, res);
      });

      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.error(`[INFO] HTTP server running on port ${PORT}`);
        console.error('[INFO] Allora MCP Server is ready and connected via HTTP/SSE');
        console.error(`[INFO] Health check available at: http://localhost:${PORT}/health`);
      });

    } else if (transportMode === 'stdio') {
      // Stdio transport mode
      const transport = new StdioServerTransport();
      
      console.error('[INFO] Connecting to stdio transport...');
      await server.connect(transport);
      
      console.error('[INFO] Allora MCP Server is ready and connected via stdio');
      console.error('[INFO] Server is now ready to receive MCP requests');
    }

  } catch (error) {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[INFO] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[INFO] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled promise rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('[FATAL] Failed to start:', error);
  process.exit(1);
});
