# SGM Deißlingen-Lauffen – PWA

Erster funktionsfähiger UI-Prototyp für die geplante Vereins-App.

## Enthalten

- responsive PWA-Oberfläche
- SGM-Logo eingebunden
- Startseite
- Spiele & Ergebnisse (Mockdaten, vorbereitet für automatische Synchronisation)
- Veranstaltungen
- News
- Push-Einstellungsoberfläche
- Mitglieder-Login-Oberfläche
- Supabase-Datenbankschema inkl. Rollen/Mannschaften
- PWA-Manifest und Icons

## Lokal starten

Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev
```

## Supabase vorbereiten

1. Neues Supabase-Projekt anlegen.
2. `supabase/schema.sql` im SQL Editor ausführen.
3. `.env.example` nach `.env.local` kopieren.
4. Supabase URL und Anon Key eintragen.
5. `npm run dev`.

## Version 0.2 – echte Authentifizierung

- Supabase Auth mit Login und Registrierung
- automatische Profilerstellung nach Registrierung
- geschützter Mitgliederbereich
- Rollenanzeige aus `profiles`
- Abmelden

## Nächste Entwicklungsstufe

1. echte Supabase-Authentifizierung
2. Admin-/Trainer-Rechte mit RLS
3. echte Veranstaltungs- und Newsverwaltung
4. Web-Push (VAPID/Service Worker)
5. FUSSBALL.DE/DFBnet-Datenquelle rechtssicher und stabil anbinden
6. automatische Spiel-/Ergebnis-Synchronisation
7. Mannschaftsbezogene Push-Kanäle
8. Offline-Cache und Installationshinweise

## Datenquelle

Die Spieldaten sollten erst nach Prüfung eines geeigneten offiziellen bzw. zulässigen Datenzugangs automatisiert importiert werden. Der Prototyp verwendet deshalb bewusst Mockdaten.


### 0.2.2
- E-Mail-Bestätigungslinks verwenden automatisch die aktuelle Produktionsadresse der PWA.
