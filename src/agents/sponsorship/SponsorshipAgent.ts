import { BaseAgent } from "../base/Agent.js";
import type { AgentPlan } from "../base/types.js";
import { PaymentService, createPaymentService } from "../../payments/PaymentService.js";
import {
  paymentFailedMessage,
  paymentReceivedMessage,
  type SponsorMessageContext,
} from "../../payments/templates.js";
import { formatMoney, type SponsorshipCommitment } from "../../payments/types.js";
import type {
  PaymentLinkApproval,
  SponsorshipAgentInput,
  SponsorshipAgentOutput,
} from "./types.js";

export interface SponsorshipAgentContext {
  mockMode: boolean;
  paymentService?: PaymentService;
}

/**
 * Owns the sponsorship money pipeline:
 *   interested → meeting booked → verbally committed → payment link sent → paid
 *
 * Generates PayPal checkout links via PaymentService, but never sends a sponsor
 * a payment link without an explicit human approval checkpoint.
 */
export class SponsorshipAgent extends BaseAgent<SponsorshipAgentInput, SponsorshipAgentOutput> {
  readonly name = "sponsorship-agent";
  readonly goal = "Raise sponsorship funding and collect payments via PayPal";

  private payments: PaymentService;
  private approvals: PaymentLinkApproval[] = [];

  constructor(context: SponsorshipAgentContext = { mockMode: true }) {
    super({ mockMode: context.mockMode });
    this.payments = context.paymentService ?? createPaymentService();
  }

  getService(): PaymentService {
    return this.payments;
  }

  getApprovals(): PaymentLinkApproval[] {
    return this.approvals.map((a) => ({ ...a }));
  }

  async plan(input: SponsorshipAgentInput): Promise<AgentPlan> {
    this.status = "planning";
    this.input = input;
    this.log("plan_started", { eventName: input.eventName, goal: input.fundraisingGoal });

    this.currentPlan = {
      agentName: this.name,
      goal: `Raise ${formatMoney(input.fundraisingGoal, input.currency)} for ${input.eventName}`,
      tasks: [
        {
          id: "register-commitments",
          name: "Register sponsor commitments",
          description: "Record verbally committed sponsors and packages",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "generate-links",
          name: "Generate PayPal checkout links",
          description: "Create payment intents and PayPal orders for each commitment",
          status: "pending",
          requiresApproval: false,
        },
        {
          id: "approval-checkpoint",
          name: "Human approval to send links",
          description: "Require operator approval before any payment link is sent",
          status: "pending",
          requiresApproval: true,
        },
        {
          id: "collect-and-confirm",
          name: "Collect payment and confirm",
          description: "Track payment, mark commitment paid, send receipt",
          status: "pending",
          requiresApproval: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.status = "idle";
    this.log("plan_completed", { taskCount: this.currentPlan.tasks.length });
    return this.currentPlan;
  }

  async execute(): Promise<SponsorshipAgentOutput> {
    if (!this.input) {
      throw new Error("SponsorshipAgent: call plan() before execute()");
    }
    this.status = "executing";
    const input = this.input;

    try {
      this.setTask("register-commitments", "in_progress");
      this.setTask("register-commitments", "completed");

      this.setTask("generate-links", "in_progress");
      this.approvals = [];
      for (const lead of input.leads) {
        const result = await this.payments.createSponsorshipPayment({
          eventId: input.eventId,
          eventName: input.eventName,
          sponsorId: lead.sponsorId,
          sponsorName: lead.sponsorName,
          contactName: lead.contactName,
          contactEmail: lead.contactEmail,
          packageName: lead.packageName,
          amount: lead.amount,
          currency: lead.currency,
        });

        const commitment = this.payments
          .getStore()
          .getCommitmentByIntent(result.paymentIntentId);

        const approvalRequest = this.createApprovalRequest(
          "send_payment_link",
          `Send ${formatMoney(lead.amount, lead.currency)} ${lead.packageName} payment link to ${lead.sponsorName}`,
          `Email PayPal checkout link to ${lead.contactEmail}`,
          [lead.sponsorName, lead.contactEmail],
          `${lead.sponsorName} verbally committed to ${lead.packageName}. Operator must approve before the link is sent.`,
          { draftContent: result.messageForSponsor, riskLevel: "high" },
        );

        this.approvals.push({
          action: "send_payment_link",
          approvalId: approvalRequest.id,
          paymentIntentId: result.paymentIntentId,
          commitmentId: commitment?.id ?? "",
          sponsorName: lead.sponsorName,
          amount: lead.amount,
          currency: lead.currency,
          packageName: lead.packageName,
          checkoutUrl: result.checkoutUrl,
          messageDraft: result.messageForSponsor,
          approvalRequired: true,
          approvalStatus: "pending",
        });
      }
      this.setTask("generate-links", "completed");
      this.setTask("approval-checkpoint", "in_progress");

      const summary = this.payments.getSponsorshipPaymentsSummary(input.eventId);
      const output: SponsorshipAgentOutput = {
        agent: "sponsorship-agent",
        status: this.hasPendingApprovals() ? "pending_approval" : "completed",
        eventId: input.eventId,
        eventName: input.eventName,
        fundraisingGoal: input.fundraisingGoal,
        currency: input.currency,
        approvals: this.getApprovals(),
        approvalRequired: this.hasPendingApprovals(),
        summary: {
          totalCommitted: summary.totalCommitted,
          totalPaid: summary.totalPaid,
          totalPending: summary.totalPending,
        },
        nextActions: this.buildNextActions(),
      };

      this.output = output;
      this.status = output.status === "pending_approval" ? "pending_approval" : "completed";
      this.log("execution_completed", { status: output.status, approvals: this.approvals.length });
      return output;
    } catch (error) {
      this.status = "failed";
      this.log("execution_failed", { error: String(error) });
      throw error;
    }
  }

  /**
   * Approve and "send" a payment link. Refuses unless the operator approved the
   * checkpoint. Moves the commitment to payment_link_sent and returns the message
   * that would be emailed to the sponsor.
   */
  approveAndSendPaymentLink(approvalId: string): { sent: boolean; message: string } {
    const approval = this.approvals.find((a) => a.approvalId === approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    this.resumeAfterApproval(approvalId, true);
    approval.approvalStatus = "approved";

    const { message } = this.payments.approveSendLink(
      approval.paymentIntentId,
      this.input?.eventName,
    );
    this.log("payment_link_sent", { approvalId, sponsor: approval.sponsorName });
    return { sent: true, message };
  }

  rejectPaymentLink(approvalId: string): void {
    const approval = this.approvals.find((a) => a.approvalId === approvalId);
    if (!approval) throw new Error(`Approval not found: ${approvalId}`);
    this.resumeAfterApproval(approvalId, false);
    approval.approvalStatus = "rejected";
  }

  /** Simulate a sponsor completing payment (mock mode) and produce a receipt. */
  async simulatePaymentSuccess(paymentIntentId: string): Promise<{ message: string }> {
    await this.payments.simulateMockPayment(paymentIntentId, "success");
    return { message: this.receiptMessage(paymentIntentId) };
  }

  async simulatePaymentFailure(paymentIntentId: string): Promise<{ message: string }> {
    await this.payments.simulateMockPayment(paymentIntentId, "failed");
    return { message: this.failureMessage(paymentIntentId) };
  }

  receiptMessage(paymentIntentId: string): string {
    return paymentReceivedMessage(this.messageContext(paymentIntentId));
  }

  failureMessage(paymentIntentId: string): string {
    return paymentFailedMessage(this.messageContext(paymentIntentId));
  }

  private messageContext(paymentIntentId: string): SponsorMessageContext {
    const intent = this.payments.getStore().getIntent(paymentIntentId);
    const commitment = this.payments.getStore().getCommitmentByIntent(paymentIntentId);
    if (!intent) throw new Error(`Payment intent not found: ${paymentIntentId}`);
    return {
      contactName: commitment?.contactName ?? intent.payerName,
      packageName: intent.packageName,
      eventName: (intent.metadata.eventName as string) ?? this.input?.eventName ?? intent.eventId,
      amount: intent.amount,
      currency: intent.currency,
      checkoutUrl: intent.checkoutUrl ?? "",
    };
  }

  getCommitment(sponsorId: string): SponsorshipCommitment | undefined {
    return this.payments.getStore().listCommitments().find((c) => c.sponsorId === sponsorId);
  }

  private buildNextActions(): string[] {
    const actions: string[] = [];
    for (const a of this.approvals) {
      if (a.approvalStatus === "pending") {
        actions.push(`Approve sending ${formatMoney(a.amount, a.currency)} link to ${a.sponsorName}`);
      }
    }
    actions.push("Monitor PayPal webhooks for payment completion");
    actions.push("Send receipts and onboarding once payments clear");
    return actions;
  }

  private setTask(
    taskId: string,
    status: "pending" | "in_progress" | "completed" | "skipped" | "blocked",
  ): void {
    if (!this.currentPlan) return;
    const task = this.currentPlan.tasks.find((t) => t.id === taskId);
    if (task) task.status = status;
  }
}
