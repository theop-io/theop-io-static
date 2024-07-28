export type Timestamp = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type ShotEpisodicData = {
  season?: number;
  episode?: number;
  episodeTitle?: string;
};

export type ShotEquipment = {
  item: string;
};

export type Shot = {
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
};

export const ProductionStatusValues = ["published", "draft"] as const;

export type Production = {
  productionName: string;
  productionYear: number;

  status: (typeof ProductionStatusValues)[number];

  imdbTitleId?: string;

  shots: Shot[];
};
