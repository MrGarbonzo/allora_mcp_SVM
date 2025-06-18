#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ChainSlug } from '@alloralabs/allora-sdk';
import dotenv from 'dotenv';
import { AlloraClientWrapper } from './allora-client.js';
import { createMCPServer } from './mcp-server.js';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Allora MCP Server
 * Designed for SecretVM deployment with stdio transport only
 */
async function main(): Promise<void> {
  try {
    console.error('[INFO] Starting Allora MCP Server for SecretVM...');
    
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

    // Create stdio transport (single transport, no HTTP/SSE)
    const transport = new StdioServerTransport();
    
    console.error('[INFO] Connecting to stdio transport...');
    await server.connect(transport);
    
    console.error('[INFO] Allora MCP Server is ready and connected via stdio');
    console.error('[INFO] Server is now ready to receive MCP requests');

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
