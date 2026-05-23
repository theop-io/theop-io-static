export interface Timestamp {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ShotEpisodicData {
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

export interface ShotEquipment {
  item: string;
}

export interface Shot {
  operatorName: string;
  secondaryOperatorName?: string;

  timestamp?: Timestamp;
  directorName?: string;
  dpName?: string;
  episodic?: ShotEpisodicData;
  tags?: string[];
  videoRef?: string;

  shortDescription: string;
  description: string;

  operatorComments?: string;
  equipmentList?: ShotEquipment[];
}

export const ProductionStatusValues = ["published", "draft"] as const;

export interface Production {
  productionName: string;
  productionYear: number;

  status: (typeof ProductionStatusValues)[number];

  imdbTitleId?: string;

  shots: Shot[];
}
