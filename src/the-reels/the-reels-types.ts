export type ContactInfo = {
  email?: string;
  instagram?: string;
  url?: string;
};

export type Reel = {
  operatorName: string;
  operatorActiveSinceYear: number;

  operatorContactInfo: ContactInfo;

  vimeoId?: number;
};
