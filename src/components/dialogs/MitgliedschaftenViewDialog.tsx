import type { Mitgliedschaften, Mitglieder, Tarife } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface MitgliedschaftenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Mitgliedschaften | null;
  onEdit: (record: Mitgliedschaften) => void;
  mitgliederList: Mitglieder[];
  tarifeList: Tarife[];
}

export function MitgliedschaftenViewDialog({ open, onClose, record, onEdit, mitgliederList, tarifeList }: MitgliedschaftenViewDialogProps) {
  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getTarifeDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return tarifeList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mitgliedschaften anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitglied</Label>
            <p className="text-sm">{getMitgliederDisplayName(record.fields.mitglied)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tarif</Label>
            <p className="text-sm">{getTarifeDisplayName(record.fields.tarif)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zahlweise</Label>
            <Badge variant="secondary">{record.fields.zahlweise?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Laufzeit (Monate)</Label>
            <p className="text-sm">{record.fields.laufzeit_monate ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rabatt (%)</Label>
            <p className="text-sm">{record.fields.rabatt_prozent ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beitrag (€, berechnet)</Label>
            <p className="text-sm">{record.fields.beitrag ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eintrittsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.eintritt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mitgliedschaft aktiv</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.aktiv ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.aktiv ? 'Ja' : 'Nein'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}