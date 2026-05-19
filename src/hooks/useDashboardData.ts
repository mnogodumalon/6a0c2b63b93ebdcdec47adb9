import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitglieder, Tarife, Mitgliedschaften } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitglieder, setMitglieder] = useState<Mitglieder[]>([]);
  const [tarife, setTarife] = useState<Tarife[]>([]);
  const [mitgliedschaften, setMitgliedschaften] = useState<Mitgliedschaften[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitgliederData, tarifeData, mitgliedschaftenData] = await Promise.all([
        LivingAppsService.getMitglieder(),
        LivingAppsService.getTarife(),
        LivingAppsService.getMitgliedschaften(),
      ]);
      setMitglieder(mitgliederData);
      setTarife(tarifeData);
      setMitgliedschaften(mitgliedschaftenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitgliederData, tarifeData, mitgliedschaftenData] = await Promise.all([
          LivingAppsService.getMitglieder(),
          LivingAppsService.getTarife(),
          LivingAppsService.getMitgliedschaften(),
        ]);
        setMitglieder(mitgliederData);
        setTarife(tarifeData);
        setMitgliedschaften(mitgliedschaftenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const mitgliederMap = useMemo(() => {
    const m = new Map<string, Mitglieder>();
    mitglieder.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitglieder]);

  const tarifeMap = useMemo(() => {
    const m = new Map<string, Tarife>();
    tarife.forEach(r => m.set(r.record_id, r));
    return m;
  }, [tarife]);

  return { mitglieder, setMitglieder, tarife, setTarife, mitgliedschaften, setMitgliedschaften, loading, error, fetchAll, mitgliederMap, tarifeMap };
}