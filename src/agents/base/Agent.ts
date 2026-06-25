import type {
  AgentContext,
  AgentMemoryEntry,
  AgentPlan,
  AgentStatus,
  ApprovalRequest,
  ApprovalStatus,
} from "./types.js";

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly goal: string;

  protected status: AgentStatus = "idle";
  protected memory: AgentMemoryEntry[] = [];
  protected currentPlan: AgentPlan | null = null;
  protected pendingApprovals: ApprovalRequest[] = [];
  protected input: TInput | null = null;
  protected output: TOutput | null = null;
  protected context: AgentContext;

  constructor(context: AgentContext = { mockMode: true }) {
    this.context = context;
  }

  abstract plan(input: TInput): Promise<AgentPlan>;
  abstract execute(): Promise<TOutput>;

  getStatus(): AgentStatus {
    return this.status;
  }

  getMemory(): AgentMemoryEntry[] {
    return [...this.memory];
  }

  getPlan(): AgentPlan | null {
    return this.currentPlan ? { ...this.currentPlan, tasks: [...this.currentPlan.tasks] } : null;
  }

  requestApproval(): ApprovalRequest[] {
    return this.pendingApprovals.filter((a) => a.status === "pending");
  }

  resumeAfterApproval(approvalId: string, approved: boolean): void {
    const request = this.pendingApprovals.find((a) => a.id === approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }
    request.status = approved ? "approved" : "rejected";
    this.log("approval_resolved", {
      approvalId,
      approved,
      type: request.type,
    });
  }

  approveAll(): void {
    for (const request of this.pendingApprovals) {
      if (request.status === "pending") {
        request.status = "approved";
      }
    }
  }

  getOutput(): TOutput | null {
    return this.output;
  }

  protected log(action: string, details: Record<string, unknown> = {}): void {
    this.memory.push({
      timestamp: new Date().toISOString(),
      action,
      details,
    });
  }

  protected createApprovalRequest(
    type: string,
    summary: string,
    proposedAction: string,
    affectedResources: string[],
    reason: string,
    options: {
      draftContent?: string;
      riskLevel?: "low" | "medium" | "high";
    } = {},
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentName: this.name,
      type,
      summary,
      proposedAction,
      affectedResources,
      draftContent: options.draftContent,
      reason,
      riskLevel: options.riskLevel ?? "medium",
      status: "pending" as ApprovalStatus,
      createdAt: new Date().toISOString(),
    };
    this.pendingApprovals.push(request);
    this.log("approval_requested", { approvalId: request.id, type, summary });
    return request;
  }

  protected hasPendingApprovals(): boolean {
    return this.pendingApprovals.some((a) => a.status === "pending");
  }

  protected allApprovalsResolved(): boolean {
    return this.pendingApprovals.every((a) => a.status !== "pending");
  }

  protected allApprovalsApproved(): boolean {
    return (
      this.pendingApprovals.length > 0 &&
      this.pendingApprovals.every((a) => a.status === "approved")
    );
  }
}
