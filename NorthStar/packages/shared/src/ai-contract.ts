export type AISearchMode = 'ai' | 'demo';

export type FallbackReason =
  | 'missing_key'
  | 'network_error'
  | 'parse_error'
  | 'empty_result'
  | 'quota_exhausted'
  | 'sensitive_blocked'
  | 'sensitive_output'
  | '';

export interface AISearchResultV2 {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  summary: string;
  recommendation: string;
  suggestedTools: string[];
  suggestedArticles: string[];
}

export interface AISolutionResult {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
  title: string;
  aiAdvice: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type AiPretextScenario =
  | 'campus_search'
  | 'campus_write'
  | 'campus_summary'
  | 'campus_chat'
  | 'compass_search'
  | 'compass_solution'
  | 'compass_chat'
  | 'general';

export interface ChatCompletionRequest {
  model?: string;
  messages?: ChatMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  goal?: string;
  scenario?: AiPretextScenario;
}

export interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type AIGatewayChatResponse = ChatCompletionResponse & {
  mode: AISearchMode;
  fallbackReason: FallbackReason;
};
