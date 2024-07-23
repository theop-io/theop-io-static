export type ContactInfo = {
  email?: string;
  instagram?: string;
  url?: string;
};

export enum VideoService {
  YouTube = "yt",
  Vimeo = "vm",
}

export type Reel = {
  operatorName: string;
  operatorActiveSinceYear: number;

  operatorContactInfo: ContactInfo;

  videoRef: string;
};
