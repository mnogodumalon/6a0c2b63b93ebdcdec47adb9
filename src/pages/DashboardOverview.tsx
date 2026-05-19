import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichMitgliedschaften } from '@/lib/enrich';
import type { EnrichedMitgliedschaften } from '@/types/enriched';
import type { Mitglieder, Mitgliedschaften } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconSearch, IconUser, IconUsers, IconCreditCard, IconCalendar, IconX, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MitgliederDialog } from '@/components/dialogs/MitgliederDialog';
import { MitgliedschaftenDialog } from '@/components/dialogs/MitgliedschaftenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

const APPGROUP_ID = '6a0c2b63b93ebdcdec47adb9';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    mitglieder, tarife, mitgliedschaften,
    mitgliederMap, tarifeMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedMitgliedschaften = enrichMitgliedschaften(mitgliedschaften, { mitgliederMap, tarifeMap });

  const [search, setSearch] = useState('');
  const [selectedMitglied, setSelectedMitglied] = useState<Mitglieder | null>(null);
  const [mitgliederDialogOpen, setMitgliederDialogOpen] = useState(false);
  const [editMitglied, setEditMitglied] = useState<Mitglieder | null>(null);
  const [mitgliedschaftDialogOpen, setMitgliedschaftDialogOpen] = useState(false);
  const [editMitgliedschaft, setEditMitgliedschaft] = useState<EnrichedMitgliedschaften | null>(null);
  const [deleteMitglied, setDeleteMitglied] = useState<Mitglieder | null>(null);
  const [deleteMitgliedschaft, setDeleteMitgliedschaft] = useState<EnrichedMitgliedschaften | null>(null);

  const filteredMitglieder = useMemo(() => {
    if (!search.trim()) return mitglieder;
    const q = search.toLowerCase();
    return mitglieder.filter(m =>
      `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.toLowerCase().includes(q) ||
      (m.fields.email ?? '').toLowerCase().includes(q) ||
      (m.fields.telefon ?? '').toLowerCase().includes(q)
    );
  }, [mitglieder, search]);

  const selectedMitgliedschaften = useMemo(() => {
    if (!selectedMitglied) return [];
    return enrichedMitgliedschaften.filter(ms => {
      const id = extractRecordId(ms.fields.mitglied);
      return id === selectedMitglied.record_id;
    });
  }, [selectedMitglied, enrichedMitgliedschaften]);

  const aktiveCount = useMemo(() =>
    mitgliedschaften.filter(m => m.fields.aktiv === true).length, [mitgliedschaften]);

  const monatlicheEinnahmen = useMemo(() => {
    return enrichedMitgliedschaften
      .filter(m => m.fields.aktiv === true)
      .reduce((sum, ms) => {
        const tarifId = extractRecordId(ms.fields.tarif);
        if (!tarifId) return sum;
        const tarif = tarifeMap.get(tarifId);
        if (!tarif) return sum;
        const preis = tarif.fields.monatspreis ?? 0;
        const zahlweise = ms.fields.zahlweise?.key;
        const rabatt = ms.fields.rabatt_prozent ?? 0;
        const netto = preis * (1 - rabatt / 100);
        if (zahlweise === 'jaehrlich') return sum + netto / 12;
        return sum + netto;
      }, 0);
  }, [enrichedMitgliedschaften, tarifeMap]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreateMitglied = async (fields: Mitglieder['fields']) => {
    await LivingAppsService.createMitgliederEntry(fields);
    fetchAll();
  };

  const handleUpdateMitglied = async (fields: Mitglieder['fields']) => {
    if (!editMitglied) return;
    await LivingAppsService.updateMitgliederEntry(editMitglied.record_id, fields);
    fetchAll();
  };

  const handleDeleteMitglied = async () => {
    if (!deleteMitglied) return;
    await LivingAppsService.deleteMitgliederEntry(deleteMitglied.record_id);
    if (selectedMitglied?.record_id === deleteMitglied.record_id) setSelectedMitglied(null);
    setDeleteMitglied(null);
    fetchAll();
  };

  const handleCreateMitgliedschaft = async (fields: Mitgliedschaften['fields']) => {
    await LivingAppsService.createMitgliedschaftenEntry(fields);
    fetchAll();
  };

  const handleUpdateMitgliedschaft = async (fields: Mitgliedschaften['fields']) => {
    if (!editMitgliedschaft) return;
    await LivingAppsService.updateMitgliedschaftenEntry(editMitgliedschaft.record_id, fields);
    fetchAll();
  };

  const handleDeleteMitgliedschaft = async () => {
    if (!deleteMitgliedschaft) return;
    await LivingAppsService.deleteMitgliedschaftenEntry(deleteMitgliedschaft.record_id);
    setDeleteMitgliedschaft(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* KPI-Leiste */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitglieder"
          value={String(mitglieder.length)}
          description="Gesamt"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Mitgliedschaften"
          value={String(aktiveCount)}
          description="Derzeit aktiv"
          icon={<IconCreditCard size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Tarife"
          value={String(tarife.length)}
          description="Verfügbar"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Monatl. Einnahmen"
          value={formatCurrency(Math.round(monatlicheEinnahmen))}
          description="Aus aktiven Mitgliedschaften"
          icon={<IconCreditCard size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Haupt-Workspace: Mitgliederliste + Detailansicht */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[520px]">
        {/* Mitgliederliste */}
        <div className="lg:col-span-2 rounded-2xl border bg-card shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-base">Mitglieder</h2>
              <Button size="sm" onClick={() => { setEditMitglied(null); setMitgliederDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1 shrink-0" />
                <span className="hidden sm:inline">Neu</span>
              </Button>
            </div>
            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                  <IconX size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredMitglieder.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                <IconUsers size={36} stroke={1.5} />
                <p className="text-sm">{search ? 'Keine Ergebnisse' : 'Noch keine Mitglieder'}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filteredMitglieder.map(m => {
                  const isActive = selectedMitglied?.record_id === m.record_id;
                  const msCount = enrichedMitgliedschaften.filter(ms => extractRecordId(ms.fields.mitglied) === m.record_id).length;
                  const hasActive = enrichedMitgliedschaften.some(ms => extractRecordId(ms.fields.mitglied) === m.record_id && ms.fields.aktiv === true);
                  return (
                    <li
                      key={m.record_id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-primary/8' : 'hover:bg-muted/40'}`}
                      onClick={() => setSelectedMitglied(isActive ? null : m)}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${hasActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {(m.fields.vorname?.[0] ?? '') + (m.fields.nachname?.[0] ?? '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.fields.vorname} {m.fields.nachname}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.fields.email ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {msCount > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${hasActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {msCount}
                          </span>
                        )}
                        <IconChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Detailansicht */}
        <div className="lg:col-span-3 rounded-2xl border bg-card shadow-sm flex flex-col overflow-hidden">
          {!selectedMitglied ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <IconUser size={48} stroke={1.5} />
              <p className="text-sm font-medium">Mitglied auswählen</p>
              <p className="text-xs max-w-xs text-center">Klicke auf ein Mitglied in der Liste, um Details und Mitgliedschaften anzuzeigen.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Mitglied Header */}
              <div className="p-5 border-b">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
                    {(selectedMitglied.fields.vorname?.[0] ?? '') + (selectedMitglied.fields.nachname?.[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg leading-tight">{selectedMitglied.fields.vorname} {selectedMitglied.fields.nachname}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {selectedMitglied.fields.email && (
                        <a href={`mailto:${selectedMitglied.fields.email}`} className="text-sm text-muted-foreground hover:text-primary truncate">
                          {selectedMitglied.fields.email}
                        </a>
                      )}
                      {selectedMitglied.fields.telefon && (
                        <a href={`tel:${selectedMitglied.fields.telefon}`} className="text-sm text-muted-foreground hover:text-primary">
                          {selectedMitglied.fields.telefon}
                        </a>
                      )}
                      {selectedMitglied.fields.geburtsdatum && (
                        <span className="text-sm text-muted-foreground">geb. {formatDate(selectedMitglied.fields.geburtsdatum)}</span>
                      )}
                    </div>
                    {(selectedMitglied.fields.strasse || selectedMitglied.fields.ort) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[selectedMitglied.fields.strasse, selectedMitglied.fields.hausnummer, selectedMitglied.fields.plz, selectedMitglied.fields.ort].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditMitglied(selectedMitglied); setMitgliederDialogOpen(true); }}>
                      <IconPencil size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMitglied(selectedMitglied)}>
                      <IconTrash size={15} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mitgliedschaften */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Mitgliedschaften</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditMitgliedschaft(null);
                      setMitgliedschaftDialogOpen(true);
                    }}
                  >
                    <IconPlus size={13} className="mr-1 shrink-0" />
                    Hinzufügen
                  </Button>
                </div>

                {selectedMitgliedschaften.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <IconCreditCard size={36} stroke={1.5} />
                    <p className="text-sm">Noch keine Mitgliedschaft</p>
                    <Button variant="outline" size="sm" onClick={() => { setEditMitgliedschaft(null); setMitgliedschaftDialogOpen(true); }}>
                      <IconPlus size={13} className="mr-1" />
                      Mitgliedschaft anlegen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMitgliedschaften.map(ms => (
                      <div key={ms.record_id} className={`rounded-xl border p-4 ${ms.fields.aktiv ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm truncate">{ms.tarifName || '(Tarif unbekannt)'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ms.fields.aktiv ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {ms.fields.aktiv ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                              {ms.fields.zahlweise && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Zahlweise</p>
                                  <p className="text-sm font-medium">{ms.fields.zahlweise.label}</p>
                                </div>
                              )}
                              {ms.fields.laufzeit_monate != null && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Laufzeit</p>
                                  <p className="text-sm font-medium">{ms.fields.laufzeit_monate} Monate</p>
                                </div>
                              )}
                              {ms.fields.eintritt && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Eintrittsdatum</p>
                                  <p className="text-sm font-medium">{formatDate(ms.fields.eintritt)}</p>
                                </div>
                              )}
                              {ms.fields.rabatt_prozent != null && ms.fields.rabatt_prozent > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Rabatt</p>
                                  <p className="text-sm font-medium">{ms.fields.rabatt_prozent}%</p>
                                </div>
                              )}
                              {ms.fields.beitrag != null && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Beitrag</p>
                                  <p className="text-sm font-medium">{formatCurrency(ms.fields.beitrag)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => { setEditMitgliedschaft(ms); setMitgliedschaftDialogOpen(true); }}>
                              <IconPencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteMitgliedschaft(ms)}>
                              <IconTrash size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialoge */}
      <MitgliederDialog
        open={mitgliederDialogOpen}
        onClose={() => { setMitgliederDialogOpen(false); setEditMitglied(null); }}
        onSubmit={editMitglied ? handleUpdateMitglied : handleCreateMitglied}
        defaultValues={editMitglied?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitglieder']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitglieder']}
      />

      <MitgliedschaftenDialog
        open={mitgliedschaftDialogOpen}
        onClose={() => { setMitgliedschaftDialogOpen(false); setEditMitgliedschaft(null); }}
        onSubmit={editMitgliedschaft ? handleUpdateMitgliedschaft : handleCreateMitgliedschaft}
        defaultValues={
          editMitgliedschaft
            ? editMitgliedschaft.fields
            : selectedMitglied
            ? { mitglied: createRecordUrl(APP_IDS.MITGLIEDER, selectedMitglied.record_id) }
            : undefined
        }
        mitgliederList={mitglieder}
        tarifeList={tarife}
        enablePhotoScan={AI_PHOTO_SCAN['Mitgliedschaften']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitgliedschaften']}
      />

      <ConfirmDialog
        open={!!deleteMitglied}
        title="Mitglied löschen"
        description={`Soll "${deleteMitglied?.fields.vorname} ${deleteMitglied?.fields.nachname}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteMitglied}
        onClose={() => setDeleteMitglied(null)}
      />

      <ConfirmDialog
        open={!!deleteMitgliedschaft}
        title="Mitgliedschaft löschen"
        description="Soll diese Mitgliedschaft wirklich gelöscht werden?"
        onConfirm={handleDeleteMitgliedschaft}
        onClose={() => setDeleteMitgliedschaft(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
