import type { EnrichedMitgliedschaften } from '@/types/enriched';
import type { Mitglieder, Mitgliedschaften, Tarife } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface MitgliedschaftenMaps {
  mitgliederMap: Map<string, Mitglieder>;
  tarifeMap: Map<string, Tarife>;
}

export function enrichMitgliedschaften(
  mitgliedschaften: Mitgliedschaften[],
  maps: MitgliedschaftenMaps
): EnrichedMitgliedschaften[] {
  return mitgliedschaften.map(r => ({
    ...r,
    mitgliedName: resolveDisplay(r.fields.mitglied, maps.mitgliederMap, 'vorname', 'nachname'),
    tarifName: resolveDisplay(r.fields.tarif, maps.tarifeMap, 'name'),
  }));
}
