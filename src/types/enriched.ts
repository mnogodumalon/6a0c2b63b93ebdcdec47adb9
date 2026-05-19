import type { Mitgliedschaften } from './app';

export type EnrichedMitgliedschaften = Mitgliedschaften & {
  mitgliedName: string;
  tarifName: string;
};
