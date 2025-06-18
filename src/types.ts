export interface AlloraInference {
  topicId: number;
  blockHeight: number;
  inferer: string;
  value: string;
  timestamp: string;
}

export interface AlloraTopic {
  id: number;
  metadata: string;
  epochLastEnded: number;
  epochLength: number;
  groundTruthLag: number;
  defaultArg: string;
  workerSubmissionWindow: number;
  alphaRegret: string;
  pNorm: string;
  epsilonReputer: string;
  epsilonSafeDiv: string;
  initialRegret: string;
  allowNegative: boolean;
  alphaRegret2: string;
  pNorm2: string;
  epsilonReputer2: string;
  epsilonSafeDiv2: string;
  minStake: string;
  maxUnmetDemand: string;
  initialRegret2: string;
}

export interface AlloraTopicsResponse {
  topics: AlloraTopic[];
  pagination?: {
    nextKey?: string;
    total?: string;
  };
}

export interface MCPErrorResponse {
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPSuccessResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export type MCPResponse = MCPSuccessResponse | MCPErrorResponse;
