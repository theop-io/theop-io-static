export type Timestamp = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type Shot = {
  operatorName: string;
  secondaryOperatorName?: string;

  timestamp?: Timestamp;
  episode?: string;
  tags?: string[];
  vimeoId?: number;

  shortDescription: string;
  description: string;

  operatorComments?: string;
  equipment?: string;
};

export const ProductionStatusValues = ["published", "draft"] as const;

export type Production = {
  productionName: string;
  productionYear: number;

  status: (typeof ProductionStatusValues)[number];

  shots: Shot[];
};
