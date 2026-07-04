import type { SiteContext } from "@dianzi/shared";

export interface CreateIdeaInput {
  rawInput: string;
  sourceType: string;
  visibility?: "public" | "private";
  allowCollaboration?: boolean;
}

export interface RefineIdeaResponse {
  title: string;
  summary: string;
  sourceScene: string;
  problem: string;
  targetUsers: string;
  solutions: string[];
  validationSteps: string[];
  risks: string[];
  tags: string[];
}

export interface SaveStructuredIdeaInput {
  title: string;
  summary: string;
  tags: string[];
  aiStructure: {
    problem: string;
    targetUsers: string;
    possibleSolutions: string[];
    validationSteps: string[];
    risks: string[];
  };
}
