import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AlloraClientWrapper } from './allora-client.js';
import type { MCPResponse } from './types.js';

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
  const GetAllTopicsSchema = z.object({});

  server.tool(
    'list_all_topics',
    'List all available prediction topics from the Allora network including price predictions, market forecasts, and other AI-powered insights',
    GetAllTopicsSchema.shape,
    async (_args): Promise<MCPResponse> => {
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
        
        return {
          error: {
            code: -1,
            message: errorMessage,
            data: { timestamp: new Date().toISOString() }
          }
        };
      }
    }
  );

  // Tool 2: Get inference by topic ID
  const GetInferenceByTopicIDSchema = z.object({
    topicID: z.number().int().positive().describe('The topic ID to fetch prediction/inference data for'),
  });

  server.tool(
    'get_inference_by_topic_id',
    'Fetch the latest prediction/inference data for a specific Allora topic ID (e.g., BTC price predictions, ETH forecasts, etc.)',
    GetInferenceByTopicIDSchema.shape,
    async ({ topicID }): Promise<MCPResponse> => {
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
        
        return {
          error: {
            code: -1,
            message: errorMessage,
            data: { 
              topicID,
              timestamp: new Date().toISOString() 
            }
          }
        };
      }
    }
  );

  // Add health check capability (could be useful for SecretVM monitoring)
  server.tool(
    'health_check',
    'Check the health and connectivity of the Allora API connection',
    z.object({}).shape,
    async (_args): Promise<MCPResponse> => {
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
        
        return {
          error: {
            code: -1,
            message: errorMessage,
            data: { timestamp: new Date().toISOString() }
          }
        };
      }
    }
  );

  console.error('[INFO] MCP server initialized with Allora tools');
  return server;
}
