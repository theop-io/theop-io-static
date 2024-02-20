export type Timestamp = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type Shot = {
  timestamp?: Timestamp;
  episode?: string;
  link?: string;

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

  operatorName: string;
  secondaryOperatorName?: string;

  shots: Shot[];
};

export const OperatorNameRegex = /(\p{Letter}+) (\p{Letter}+)/u;
