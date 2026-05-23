export interface ContactInfo {
  email?: string;
  instagram?: string;
  url?: string;
}

export interface Reel {
  operatorName: string;
  operatorActiveSinceYear: number;
  operatorContactInfo: ContactInfo;
  videoRef: string;
}
