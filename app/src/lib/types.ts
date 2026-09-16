import type { NextAction, PlaybookKey } from "@/lib/workflow";
import type { ScoreCriterion, ExtendedScores } from "@/lib/scoring";

export type ReminderDTO = {
  id: string;
  channel: string;
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

export type CallTaskDTO = {
  id: string;
  reason: string;
  talkingPoints: string;
  status: string;
  outcome: string | null;
  outcomeNote: string | null;
  promisedDate: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PromiseDTO = {
  id: string;
  amountMad: number;
  promisedDate: string;
  status: string; // EN_COURS | TENUE | ROMPUE
  source: string; // APPEL | REPONSE | MANUEL
  createdAt: string;
  resolvedAt: string | null;
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
  contactPhone: string;
  behaviorNote: string;
  strategic: boolean;
  chronicLatePayer: boolean;
  isPublicDebtor: boolean;
  reminders: ReminderDTO[];
  replies: ReplyDTO[];
  callTasks: CallTaskDTO[];
  promises: PromiseDTO[];
  score: number;
  priority: "URGENT" | "A_TRAITER" | "SURVEILLANCE";
  reasoning: string;
  breakdown: ScoreCriterion[];
  playbook: PlaybookKey;
  scores: ExtendedScores;
  nextAction: NextAction;
};
