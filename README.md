# 📹 ioBroker.frigate-service

![Version](https://img.shields.io/npm/v/iobroker.frigate-service.svg?color=blue&logo=npm)
![License](https://img.shields.io/github/license/Felliglanz/ioBroker.frigate-service?color=green)
![Node](https://img.shields.io/node/v/iobroker.frigate-service?color=brightgreen)
![GitHub Issues](https://img.shields.io/github/issues/Felliglanz/ioBroker.frigate-service?color=red)

**Event-basierte Automatisierungen für ioBroker + Frigate**  
🔔 Benachrichtigungen an Discord/Telegram | 💡 Gerätesteuerung | 📦 Medien-Versand (Clips/Snapshots)

---

## 📋 Inhaltsverzeichnis

- [Überblick](#-überblick)
- [Features](#-features)
- [Voraussetzungen](#-voraussetzungen)
- [Installation](#-installation)
- [Konfiguration](#-konfiguration)
  - [Global-Einstellungen](#1-global-einstellungen)
  - [Kameras & Ziele](#2-kameras--ziele)
  - [Regeln (Items)](#3-regeln-items)
- [Anwendungsbeispiele](#-anwendungsbeispiele)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)
- [Lizenz](#-lizenz)

---

## 📖 Überblick

Der **Frigate-Service-Adapter** verbindet deinen [Frigate](https://frigate.video/) NVR mit ioBroker und ermöglicht flexible, event-basierte Automatisierungen:

- 🔔 **Benachrichtigungen**: Sende Ereignisse (z.B. Person erkannt) mit Clips/Snapshots an Discord oder Telegram
- 💡 **Gerätesteuerung**: Schalte Lampen, Sirenen oder andere Geräte basierend auf Zonen-Erkennungen (z.B. "Lampe einschalten, wenn Person in Zone Haustür erkannt")
- 🎯 **Zonenbasiert**: Reagiere nur auf Erkennungen in bestimmten Frigate-Zonen
- ⏰ **Zeitfenster**: Aktiviere Regeln nur zu bestimmten Zeiten (z.B. nur nachts oder während Astro-Events wie "Golden Hour")

---

## ✨ Features

- ✅ **Custom Admin UI** mit Master/Detail-Editor für intuitive Konfiguration
- ✅ **Zone-Management** per State-Picker direkt aus Frigate-Adapter mit Quick-Add Buttons
- ✅ **Mehrsprachig** (Deutsch/Englisch) - sowohl UI als auch Benachrichtigungen
- ✅ **Flexible Filter**: Nach Objekttyp (person/car/dog), Score, Sub-Label, Event-Typ
- ✅ **Throttling & Deduplication** um Spam zu vermeiden
- ✅ **Medien-Versand**: Clips mit konfigurierbarem Padding, Retry-Logik, Fallback auf Snapshot
- ✅ **Discord & Telegram** Unterstützung
- ✅ **Device Control**: Automatische Gerätesteuerung ohne Skripte
- ✅ **Intelligente Config-Migration**: Automatische Bereinigung veralteter Einstellungen

---

## 🔧 Voraussetzungen

- **ioBroker** ≥ v5.0.0
- **Node.js** ≥ v18
- **Frigate Adapter** installiert und konfiguriert ([ioBroker.frigate](https://github.com/iobroker-community-adapters/ioBroker.frigate))
- Frigate-Instanz läuft und sendet Events

---

## 📦 Installation

### Option 1: Via ioBroker Admin

1. Admin-Oberfläche öffnen
2. **Adapter** → **Von GitHub installieren**
3. URL eingeben: `https://github.com/Felliglanz/ioBroker.frigate-service`
4. Installieren

### Option 2: Kommandozeile

```bash
cd /opt/iobroker
npm install iobroker.frigate-service
```

---

## ⚙️ Konfiguration

### 1. Global-Einstellungen

#### Frigate-Verbindung

- **Frigate Instance**: ioBroker-Instanz-ID (Standard: `frigate.0`)
- **Frigate API Base URL**: HTTP-API-URL (z.B. `http://192.168.1.10:5000`)
  - Nur nötig für Medien-Downloads (Clips/Snapshots)
  - Leer lassen, wenn nur States verwendet werden
- **Authentifizierung**: None/Basic/Bearer je nach Frigate-Konfiguration
- **Notification Language**: Sprache für Benachrichtigungen (Deutsch/English)
  - Übersetzt Objekt-Labels in Nachrichten (z.B. person→Person/Person, car→Auto/Car)

### 2. Kameras & Ziele

#### Kameras definieren

1. **Add camera** klicken
2. **Camera key** eingeben (muss mit Frigate übereinstimmen, z.B. `einfahrt`)
3. **Display name** (optional, z.B. "Einfahrt")
4. **Zonen hinzufügen**:
   - **Add zone** klicken
   - **Select** klicken → State Picker öffnet sich
   - Zu `frigate.0.Zone_*.person` navigieren
   - Zone auswählen (z.B. `frigate.0.Zone_Haustuer.person`)

**Beispiel**:
```
Camera: einfahrt
  └─ Zone: frigate.0.Zone_Einfahrt.person
  └─ Zone: frigate.0.Zone_Haustuer.person
```

#### Benachrichtigungsziele

1. **Add target** klicken
2. **Target ID** vergeben (z.B. `discord_haus`)
3. **Type** wählen:
   - **Discord webhook**: Webhook-URL einfügen
   - **Telegram bot**: Bot-Token + Chat-ID eingeben

### 3. Regeln (Items)

#### Regel-Typen

##### 🔔 Benachrichtigung (Notify)

Sendet Nachricht mit Medien an Discord/Telegram wenn Ereignis eintritt.

**Konfiguration**:
- **Cameras**: Leer = alle Kameras, oder spezifische Kameras auswählen
  - Pro Kamera: Target überschreiben möglich
- **Filter**:
  - **Event types**: `end` (typisch), `new`, `update`
  - **Labels**: Komma-separiert (z.B. `person, car, dog`) - triggert bei **EINEM** der Labels
  - **Min score**: Konfidenz-Schwelle (0.0-1.0)
  - **Entered zones**: Komma-separiert (z.B. `Zone_Einfahrt, Zone_Garten`) - nur triggern wenn bestimmte Zonen betreten
    - 💡 **Quick-Add Buttons**: Zeigt verfügbare Zonen aus Kamera-Konfiguration zum schnellen Hinzufügen
- **Notify**:
  - **Default target**: Wohin senden
  - **Media mode**: Clip oder Snapshot
  - **Clip padding**: Sekunden vor/nach Event (empfohlen: 0-3)
  - **Max upload**: Discord max 8-25 MB je nach Boost

**Beispiel**: "Person in Zone Einfahrt erkannt → Discord-Nachricht mit 5s-Clip"

```
Name: Haustür Bewegung
Kind: Notify
Cameras: einfahrt
Filter:
  - Event types: end
  - Labels: person, car    ← Triggert bei Person ODER Auto
  - Entered zones: Haustuer
  - Min score: 0.8
Notify:
  - Target: discord_haus
  - Media: Clip (3s padding)
```

##### 💡 Gerät (Device)

Steuert ein Gerät (Lampe, Schalter) basierend auf Personen-Erkennung in Zonen.

**Konfiguration**:
- **Target state**: ioBroker-State (z.B. `hue.0.Lamp.on`)
- **Off delay**: Wie lange warten nach letzter Erkennung (ms)
- **Detection Zones**: 
  - **Add zone** → Dropdown wählt aus definierten Kamera-Zones
  - Gerät triggert wenn **IRGENDEINE** Zone eine Person erkennt
- **Time condition**:
  - **Always**: Immer aktiv
  - **Astro window**: Nur zwischen Start/End-State-Zeiten (z.B. Golden Hour)

**Beispiel**: "Person in Zone_Haustuer erkannt während Golden Hour → Lampe einschalten für 30s"

---

## 💡 Anwendungsbeispiele

### 1. 🚪 Haustür-Benachrichtigung

```
Name: Haustür Person erkannt
Kind: Notify
Cameras: einfahrt
Filter:
  - Event types: end
  - Label: person
  - Entered zones: Haustuer
  - Min score: 0.8
Notify:
  - Target: discord_haus
  - Media: Clip first (3s padding)
```

➡️ Bei Person in Zone "Haustuer" → Discord-Nachricht mit Clip

### 2. 💡 Nacht-Licht bei Bewegung

```
Name: Einfahrt Licht nachts
Kind: Device
Target state: hue.0.Einfahrt.on
Zones:
  - frigate.0.Zone_Einfahrt.person
  - frigate.0.Zone_Haustuer.person
Time: Astro window
  - Start: javascript.0.astro.goldenHour
  - End: javascript.0.astro.goldenHourEnd
Off delay: 30000ms
```

➡️ Person in Einfahrt ODER Haustür während Golden Hour → Licht 30s an

### 3. 🐕 Hunde-Detektion ohne Spam

```
Name: Hund im Garten
Kind: Notify
Filter:
  - Label: dog
  - Min score: 0.85
  - Throttle: 60000ms (1 Minute)
  - Dedupe TTL: 600000ms (10 Minuten)
```

➡️ Max. 1 Benachrichtigung pro Minute, keine Duplikate innerhalb 10 Min

---

## 🔍 Troubleshooting

### ❌ "Keine Clips werden versendet"

**Lösung**:
- Frigate API Base URL korrekt?
- Authentifizierung eingerichtet?
- `clipInitialDelayMs` erhöhen (Frigate braucht Zeit zum Clip-Erstellen)
- Logs prüfen: `iobroker logs --watch frigate-service`

### ❌ "Zu viele Benachrichtigungen"

**Lösung**:
- `throttleMs` erhöhen (z.B. 60000 = 1 Min zwischen Nachrichten)
- `dedupeTtlMs` erhöhen (z.B. 600000 = 10 Min Dedupe-Fenster)
- `minScore` erhöhen (z.B. 0.9 für höhere Konfidenz)

### ❌ "Lampe schaltet nicht"

**Lösung**:
- Target State korrekt? (z.B. `hue.0.Lamp.on`)
- Zonen korrekt konfiguriert? (Person-Counter: `*.person`)
- Zeitfenster aktiv? (Astro-Window-States prüfen)
- State Permissions: Adapter muss schreiben dürfen

### ❌ "UI lädt nicht / Fehler in Admin"

**Lösung**:
- Admin neuladen (`Strg+F5`)
- ioBroker-Admin ≥ 7.0?
- Browser-Konsole auf Fehler prüfen
- Adapter neu starten

---

## 🔒 Sicherheit

- **Verschlüsselung**: Discord/Telegram-Secrets werden automatisch verschlüsselt gespeichert (`encryptedNative`)
- **Keine Hardcoded Credentials**: Alle sensiblen Daten in Instanz-Konfiguration
- **Passwortfelder**: UI maskiert Token/Webhooks als `*****`

---

## 📝 Changelog

### 0.1.1 (2026-02-01)
🎨 **UX-Verbesserungen**
- **Multi-Language Support**: Benachrichtigungen unterstützen jetzt Deutsch/Englisch (konfigurierbar in Global-Einstellungen)
  - Übersetzungen für person→Person/Person, car→Auto/Car, dog→Hund/Dog, etc.
- **Verbesserte Zone-Konfiguration**:
  - Klarere Unterscheidung zwischen Device-Zonen und Notify-Zonen-Filter
  - Tooltips für alle wichtigen Felder
  - Zone-Discovery: Zeigt verfügbare Zonen aus Kamera-Konfiguration
  - Quick-Add Buttons für schnelles Hinzufügen von Zonen
- **Input-Feld-Optimierungen**:
  - Komma-separierte Eingaben (types, labels, zones) funktionieren jetzt korrekt
  - Gespeicherte Werte werden sofort korrekt angezeigt
  - Save-Button aktiviert sich unmittelbar bei Änderungen
- **Config-Migration**: Automatisches Entfernen veralteter `label` (singular) Felder

### 0.1.0 (2026-01-31)
✨ **Erste öffentliche Release**
- Custom Admin UI mit Master/Detail-Editor
- Zone-Management per State-Picker
- Dropdown für vorkonfigurierte Zones im Device-Modus
- i18n-Unterstützung (DE/EN)
- Discord & Telegram Provider
- Device Control mit Astro-Zeitfenstern
- Throttling & Deduplication

### 0.0.1
- Initial Development Version

---

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

## 🤝 Beiträge

Issues und Pull Requests sind willkommen!  
📬 [GitHub Issues](https://github.com/Felliglanz/ioBroker.frigate-service/issues)

---

## 🔗 Links

- 📦 [NPM Package](https://www.npmjs.com/package/iobroker.frigate-service)
- 🐙 [GitHub Repository](https://github.com/Felliglanz/ioBroker.frigate-service)
- 📖 [Frigate Documentation](https://frigate.video/)
- 🏠 [ioBroker Forum](https://forum.iobroker.net/)

---

**Made with ❤️ for ioBroker Community**
