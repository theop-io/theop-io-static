export type TheShot = {
  production: string;

  operatorFirstName: string;
  operatorLastName: string;
  altOperator?: string;

  shortDescription: string;
  description?: string;
  operatorComments?: string;

  episode?: string;
  equipment?: string;
};
