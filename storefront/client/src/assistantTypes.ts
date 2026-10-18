export interface AssistantGiftDraft {
  occasion: string;
  recipient: string;
  budget: string;
  preferences: string;
  productIds: string[];
}

export type AssistantGiftFormAction = 'none' | 'offer' | 'apply';
