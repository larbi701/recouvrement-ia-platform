export type ReminderDTO = {
  id: string;
  tone: string;
  content: string;
  status: string;
  createdBy: string;
  sentAt: string;
};

export type ReplyDTO = {
  id: string;
  content: string;
  classifiedIntent: string | null;
  agentSummary: string | null;
  proposedAction: string | null;
  receivedAt: string;
};

export type WorklistItem = {
  invoiceId: string;
  reference: string;
  amountMad: number;
  daysOverdue: number;
  status: string;
  clientId: string;
  clientName: string;
  sector: string;
  contactName: string;
  contactEmail: string;
  behaviorNote: string;
  strategic: boolean;
  reminders: ReminderDTO[];
  replies: ReplyDTO[];
  score: number;
  priority: "URGENT" | "A_TRAITER" | "SURVEILLANCE";
  reasoning: string;
};
