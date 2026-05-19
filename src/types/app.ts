// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitglieder {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
  };
}

export interface Tarife {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    monatspreis?: number;
  };
}

export interface Mitgliedschaften {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    mitglied?: string; // applookup -> URL zu 'Mitglieder' Record
    tarif?: string; // applookup -> URL zu 'Tarife' Record
    zahlweise?: LookupValue;
    laufzeit_monate?: number;
    rabatt_prozent?: number;
    beitrag?: number;
    eintritt?: string; // Format: YYYY-MM-DD oder ISO String
    aktiv?: boolean;
  };
}

export const APP_IDS = {
  MITGLIEDER: '6a0c2b4c5c4cd2c79db7c141',
  TARIFE: '6a0c2b50f91169e570c6a82c',
  MITGLIEDSCHAFTEN: '6a0c2b50b7d1077ae5c66890',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitgliedschaften': {
    zahlweise: [{ key: "monatlich", label: "Monatlich" }, { key: "jaehrlich", label: "Jährlich" }, { key: "einmalig", label: "Einmalig" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitglieder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'geburtsdatum': 'date/date',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
  },
  'tarife': {
    'name': 'string/text',
    'monatspreis': 'number',
  },
  'mitgliedschaften': {
    'mitglied': 'applookup/select',
    'tarif': 'applookup/select',
    'zahlweise': 'lookup/radio',
    'laufzeit_monate': 'number',
    'rabatt_prozent': 'number',
    'beitrag': 'number',
    'eintritt': 'date/date',
    'aktiv': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitglieder = StripLookup<Mitglieder['fields']>;
export type CreateTarife = StripLookup<Tarife['fields']>;
export type CreateMitgliedschaften = StripLookup<Mitgliedschaften['fields']>;