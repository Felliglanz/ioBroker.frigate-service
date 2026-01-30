
# frigate-service (ioBroker Adapter)

Automationen rund um den ioBroker Frigate-Adapter: Benachrichtigungen (Discord/Telegram) und Geräte-Steuerung (z.B. Lampen) basierend auf Frigate-Events und Zonen.

## Überblick

- **Datenquelle**: ausschließlich der Frigate-Adapter (`frigate.X`)
- **Benachrichtigungen**: Discord (Webhook) und Telegram (Bot)
- **Geräte-Steuerung**: z.B. Hue-Schalter per State-ID, mit Off-Delay + Safety-Check
- **Admin UI**:
	- Tab **Global**: Frigate API/Instanz, Kamera-Registry, Notification Targets, Kamera-Discovery
	- Tab **Items**: Master/Detail Editor für Regeln

## Voraussetzungen

- ioBroker mit installiertem **Frigate-Adapter**
- Node.js >= 18 (für `fetch` im Adapter-Runtime)

## Konfiguration (Admin UI)

### Global

**Frigate instance**

- Die Instanz-ID deines Frigate-Adapters, z.B. `frigate.0`.

**Kamera-Discovery (Button)**

- Button „Discover cameras“ scannt alle `frigate.*` Instanzen und zeigt gefundene Kameras.
- Mit „Apply selection to table“ übernimmst du die ausgewählten Kameras in die **Cameras**-Tabelle.
- Du kannst weiterhin manuell Kameras ergänzen/umbenennen.

**Cameras (Tabelle)**

- `id`: Kamera-Key (z.B. `einfahrt`)
- `name`: Anzeigename (z.B. „Einfahrt“)

**Notification targets (Tabelle)**

- Discord: `type=discordWebhook` + `webhookUrl`
- Telegram: `type=telegramBot` + `botToken` + `chatId`

### Items

Ein Item ist eine „Regel“ (z.B. „Benachrichtigung Einfahrt“ oder „Lampe Vorgarten“).

- **Kind**: `notify` oder `device`
- **Cameras**: optional pro Regel (leer = gilt für alle Kameras)
- **Filter**:
	- Event-Typ(en) (z.B. `end`), `label` (z.B. `person`), Score, Throttle/Dedupe
	- Optional: `sub_label` und `entered_zones`

## Frigate API (Base URL & Auth)

Für Media-Downloads (Clip/Snapshot) wird die Frigate HTTP API genutzt.

- In vielen LAN-Setups ist Frigate ohne Auth erreichbar, z.B. `http://IP:5000`.
- Je nach Setup (Reverse Proxy, Home Assistant Ingress, vorgeschaltete Auth) kann Auth nötig sein.
- Auth ist deshalb **optional**.

## Sicherheit / Secrets

- Es werden **keine** Webhooks/Token im Code hardcodiert.
- In der UI werden sensible Felder als Passwortfelder maskiert (`*****`).
- Zusätzlich werden Discord/Telegram-Secrets beim Adapterstart automatisch **verschlüsselt** in der Instanz-Konfiguration gespeichert (Migration) und nur zur Laufzeit entschlüsselt.
- Für die top-level Frigate-Auth-Felder ist `encryptedNative` aktiv.

## Status

- Kamera-Discovery ist in der UI verfügbar.
- Erweiterte Event-Felder (`sub_label`, `entered_zones`) sind implementiert und können im Item-Filter genutzt werden.

