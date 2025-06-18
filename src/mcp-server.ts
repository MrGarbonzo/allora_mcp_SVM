import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AlloraClientWrapper } from './allora-client.js';

/**
 * Creates and configures the MCP server with Allora tools
 * Optimized for SecretVM deployment with stdio transport only
 */
export function createMCPServer(alloraClient: AlloraClientWrapper): McpServer {
  const server = new McpServer({
    name: 'allora-mcp-secretvm',
    version: '1.0.0'
  });

  // Tool 1: List all available topics
  server.tool(
    'list_all_topics',
    'List all available prediction topics from the Allora network including price predictions, market forecasts, and other AI-powered insights',
    {},
    async (): Promise<CallToolResult> => {
      try {
        console.error('[DEBUG] Fetching all topics...');
        const topics = await alloraClient.getAllTopics();
        
        console.error(`[DEBUG] Successfully fetched ${topics.topics?.length || 0} topics`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(topics, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = `Failed to fetch topics: ${(error as Error).message}`;
        console.error(`[ERROR] ${errorMessage}`);
        
        throw new McpError(
          ErrorCode.InternalError,
          errorMessage
        );
      }
    }
  );

  // Tool 2: Get inference by topic ID
  server.tool(
    'get_inference_by_topic_id',
    'Fetch the latest prediction/inference data for a specific Allora topic ID (e.g., BTC price predictions, ETH forecasts, etc.)',
    {
      topicID: {
        type: 'number',
        description: 'The topic ID to fetch prediction/inference data for'
      }
    },
    async (args): Promise<CallToolResult> => {
      const topicID = args.topicID as number;
      
      try {
        console.error(`[DEBUG] Fetching inference for topic ID: ${topicID}`);
        const inference = await alloraClient.getInferenceByTopicID(topicID);
        
        console.error(`[DEBUG] Successfully fetched inference for topic ${topicID}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(inference, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = `Failed to fetch inference for topic ${topicID}: ${(error as Error).message}`;
        console.error(`[ERROR] ${errorMessage}`);
        
        throw new McpError(
          ErrorCode.InternalError,
          errorMessage
        );
      }
    }
  );

  // Add health check capability (could be useful for SecretVM monitoring)
  server.tool(
    'health_check',
    'Check the health and connectivity of the Allora API connection',
    {},
    async (): Promise<CallToolResult> => {
      try {
        console.error('[DEBUG] Performing health check...');
        const isHealthy = await alloraClient.healthCheck();
        
        const status = isHealthy ? 'healthy' : 'unhealthy';
        console.error(`[DEBUG] Health check result: ${status}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status,
                timestamp: new Date().toISOString(),
                message: isHealthy ? 'Allora API is accessible' : 'Allora API is not accessible'
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = `Health check failed: ${(error as Error).message}`;
        console.error(`[ERROR] ${errorMessage}`);
        
        throw new McpError(
          ErrorCode.InternalError,
          errorMessage
        );
      }
    }
  );

  console.error('[INFO] MCP server initialized with Allora tools');
  return server;
}
