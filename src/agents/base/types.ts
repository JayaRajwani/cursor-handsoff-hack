export type AgentStatus =
  | "idle"
  | "planning"
  | "executing"
  | "pending_approval"
  | "completed"
  | "needs_input"
  | "failed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface AgentMemoryEntry {
  timestamp: string;
  action: string;
  details: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  agentName: string;
  type: string;
  summary: string;
  proposedAction: string;
  affectedResources: string[];
  draftContent?: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
  status: ApprovalStatus;
  createdAt: string;
}

export interface AgentPlanTask {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped" | "blocked";
  requiresApproval: boolean;
}

export interface AgentPlan {
  agentName: string;
  goal: string;
  tasks: AgentPlanTask[];
  createdAt: string;
}

export interface AgentContext {
  mockMode: boolean;
}
