import type { BriefContent } from "./schemas";

export type Brief = BriefContent & {
  id: string;
  userId: string;
  source: string;
  model: string;
  createdAt: Date;
};

export type NewBrief = Omit<Brief, "id" | "createdAt">;
