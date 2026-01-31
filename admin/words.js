/* eslint-disable */
// Dictionary for ioBroker Admin UI translations
systemDictionary = {
    // Tabs
    "Global": { "en": "Global", "de": "Global" },
    "Items": { "en": "Items", "de": "Elemente" },

    // Global Tab
    "Frigate instance": { "en": "Frigate instance", "de": "Frigate-Instanz" },
    "ioBroker instance id of your Frigate adapter (e.g. frigate.0).": {
        "en": "ioBroker instance id of your Frigate adapter (e.g. frigate.0).",
        "de": "ioBroker-Instanz-ID deines Frigate-Adapters (z.B. frigate.0)."
    },
    "Frigate API base URL": { "en": "Frigate API base URL", "de": "Frigate API Basis-URL" },
    "Base URL for Frigate HTTP API (e.g. http://192.168.1.10:5000). Leave empty if you only use adapter states (no media downloads).": {
        "en": "Base URL for Frigate HTTP API (e.g. http://192.168.1.10:5000). Leave empty if you only use adapter states (no media downloads).",
        "de": "Basis-URL für Frigate HTTP API (z.B. http://192.168.1.10:5000). Leer lassen, wenn nur Adapter-States verwendet werden (keine Medien-Downloads)."
    },
    "Frigate auth": { "en": "Frigate auth", "de": "Frigate-Authentifizierung" },
    "None": { "en": "None", "de": "Keine" },
    "Basic": { "en": "Basic", "de": "Basic" },
    "Bearer": { "en": "Bearer", "de": "Bearer" },
    "Frigate username": { "en": "Frigate username", "de": "Frigate-Benutzername" },
    "Frigate password": { "en": "Frigate password", "de": "Frigate-Passwort" },
    "Frigate bearer token": { "en": "Frigate bearer token", "de": "Frigate Bearer-Token" },
    "Cameras & Targets": { "en": "Cameras & Targets", "de": "Kameras & Ziele" },

    // Custom Components - General
    "Add": { "en": "Add", "de": "Hinzufügen" },
    "Delete": { "en": "Delete", "de": "Löschen" },
    "Duplicate": { "en": "Duplicate", "de": "Duplizieren" },
    "Up": { "en": "Up", "de": "Nach oben" },
    "Down": { "en": "Down", "de": "Nach unten" },
    "Enabled": { "en": "Enabled", "de": "Aktiviert" },
    "Name": { "en": "Name", "de": "Name" },
    "Select…": { "en": "Select…", "de": "Auswählen…" },
    "Select": { "en": "Select", "de": "Auswählen" },
    "Comment (optional)": { "en": "Comment (optional)", "de": "Kommentar (optional)" },
    "No items configured.": { "en": "No items configured.", "de": "Keine Elemente konfiguriert." },
    "Select an item on the left or add a new one.": { "en": "Select an item on the left or add a new one.", "de": "Wähle ein Element links aus oder füge ein neues hinzu." },
    "Unnamed": { "en": "Unnamed", "de": "Unbenannt" },
    "Device": { "en": "Device", "de": "Gerät" },
    "Notify": { "en": "Notify", "de": "Benachrichtigung" },

    // Items Editor - Kind
    "Kind": { "en": "Kind", "de": "Art" },
    "Notify: Send messages to Discord/Telegram. Device: Control a switch/device based on detections.": {
        "en": "Notify: Send messages to Discord/Telegram. Device: Control a switch/device based on detections.",
        "de": "Benachrichtigung: Nachrichten an Discord/Telegram senden. Gerät: Schalter/Gerät basierend auf Erkennungen steuern."
    },
    "Select kind…": { "en": "Select kind…", "de": "Art auswählen…" },
    "Notify (Discord/Telegram)": { "en": "Notify (Discord/Telegram)", "de": "Benachrichtigung (Discord/Telegram)" },
    "Device (switch)": { "en": "Device (switch)", "de": "Gerät (Schalter)" },

    // Items Editor - Cameras
    "Cameras": { "en": "Cameras", "de": "Kameras" },
    "Leave empty to apply to all cameras, or select specific cameras.": {
        "en": "Leave empty to apply to all cameras, or select specific cameras.",
        "de": "Leer lassen für alle Kameras oder spezifische Kameras auswählen."
    },
    "Optional: Override notification target per camera": {
        "en": "Optional: Override notification target per camera",
        "de": "Optional: Benachrichtigungsziel pro Kamera überschreiben"
    },
    "Add camera": { "en": "Add camera", "de": "Kamera hinzufügen" },
    "Select camera…": { "en": "Select camera…", "de": "Kamera auswählen…" },

    // Items Editor - Filter
    "Filter": { "en": "Filter", "de": "Filter" },
    "Event types": { "en": "Event types", "de": "Ereignistypen" },
    "Comma-separated. Common: new, update, end. Typical: end": {
        "en": "Comma-separated. Common: new, update, end. Typical: end",
        "de": "Kommagetrennt. Üblich: new, update, end. Typisch: end"
    },
    "Label": { "en": "Label", "de": "Label" },
    "Object type to detect (person, car, dog, cat, etc.)": {
        "en": "Object type to detect (person, car, dog, cat, etc.)",
        "de": "Zu erkennender Objekttyp (person, car, dog, cat, etc.)"
    },
    "Min score": { "en": "Min score", "de": "Min. Konfidenz" },
    "Minimum confidence score (0.0-1.0). Higher = fewer false positives.": {
        "en": "Minimum confidence score (0.0-1.0). Higher = fewer false positives.",
        "de": "Minimale Konfidenzschwelle (0.0-1.0). Höher = weniger Fehlerkennungen."
    },
    "Sub-label (optional)": { "en": "Sub-label (optional)", "de": "Unter-Label (optional)" },
    "Entered zones (comma-separated, optional)": {
        "en": "Entered zones (comma-separated, optional)",
        "de": "Betretene Zonen (kommagetrennt, optional)"
    },
    "Throttle (ms)": { "en": "Throttle (ms)", "de": "Drosselung (ms)" },
    "Minimum time between actions. Prevents spamming.": {
        "en": "Minimum time between actions. Prevents spamming.",
        "de": "Minimale Zeit zwischen Aktionen. Verhindert Spam."
    },
    "Dedupe TTL (ms)": { "en": "Dedupe TTL (ms)", "de": "Dedupe TTL (ms)" },
    "Time window for duplicate detection. Longer = fewer duplicates.": {
        "en": "Time window for duplicate detection. Longer = fewer duplicates.",
        "de": "Zeitfenster für Duplikaterkennung. Länger = weniger Duplikate."
    },

    // Items Editor - Notify Panel
    "Default target": { "en": "Default target", "de": "Standard-Ziel" },
    "Where to send notifications (Discord/Telegram)": {
        "en": "Where to send notifications (Discord/Telegram)",
        "de": "Wohin Benachrichtigungen gesendet werden (Discord/Telegram)"
    },
    "Select target…": { "en": "Select target…", "de": "Ziel auswählen…" },
    "Media mode": { "en": "Media mode", "de": "Medienmodus" },
    "Clip: Send video clip. Snapshot: Send image only.": {
        "en": "Clip: Send video clip. Snapshot: Send image only.",
        "de": "Clip: Videoclip senden. Snapshot: Nur Bild senden."
    },
    "Select media mode…": { "en": "Select media mode…", "de": "Medienmodus auswählen…" },
    "Clip first (fallback snapshot)": { "en": "Clip first (fallback snapshot)", "de": "Zuerst Clip (Fallback Snapshot)" },
    "Snapshot only": { "en": "Snapshot only", "de": "Nur Snapshot" },
    "Clip padding (s)": { "en": "Clip padding (s)", "de": "Clip-Puffer (s)" },
    "Adds seconds before/after event. Typical: 0-3. Increase if clips start too late or end too early.": {
        "en": "Adds seconds before/after event. Typical: 0-3. Increase if clips start too late or end too early.",
        "de": "Fügt Sekunden vor/nach dem Ereignis hinzu. Typisch: 0-3. Erhöhen, wenn Clips zu spät starten oder zu früh enden."
    },
    "Max upload (MB)": { "en": "Max upload (MB)", "de": "Max. Upload (MB)" },
    "Maximum file size for uploads. Discord: max 8-25 MB depending on server boost.": {
        "en": "Maximum file size for uploads. Discord: max 8-25 MB depending on server boost.",
        "de": "Maximale Dateigröße für Uploads. Discord: max 8-25 MB je nach Server-Boost."
    },
    "Clip initial delay (ms)": { "en": "Clip initial delay (ms)", "de": "Clip-Startverzögerung (ms)" },
    "Wait time before first clip download attempt. Gives Frigate time to create the clip.": {
        "en": "Wait time before first clip download attempt. Gives Frigate time to create the clip.",
        "de": "Wartezeit vor erstem Clip-Download-Versuch. Gibt Frigate Zeit, den Clip zu erstellen."
    },
    "Clip retries": { "en": "Clip retries", "de": "Clip-Wiederholungen" },
    "Number of retry attempts if clip download fails.": {
        "en": "Number of retry attempts if clip download fails.",
        "de": "Anzahl Wiederholungsversuche bei fehlgeschlagenem Clip-Download."
    },
    "Fallback to snapshot": { "en": "Fallback to snapshot", "de": "Fallback auf Snapshot" },
    "Send snapshot if clip download fails.": {
        "en": "Send snapshot if clip download fails.",
        "de": "Snapshot senden, wenn Clip-Download fehlschlägt."
    },

    // Items Editor - Device Panel
    "Device Control": { "en": "Device Control", "de": "Gerätesteuerung" },
    "Controls a device (lamp, switch) based on person detection in zones. Similar to scripted automation but automated via adapter.": {
        "en": "Controls a device (lamp, switch) based on person detection in zones. Similar to scripted automation but automated via adapter.",
        "de": "Steuert ein Gerät (Lampe, Schalter) basierend auf Personenerkennung in Zonen. Ähnlich wie Skript-Automatisierung, aber automatisiert per Adapter."
    },
    "Target state (lamp/switch)": { "en": "Target state (lamp/switch)", "de": "Ziel-State (Lampe/Schalter)" },
    "ioBroker state to control, e.g., hue.0.Lamp.on - will be set to true when person detected in zones during time window.": {
        "en": "ioBroker state to control, e.g., hue.0.Lamp.on - will be set to true when person detected in zones during time window.",
        "de": "Zu steuernder ioBroker-State, z.B. hue.0.Lamp.on - wird auf true gesetzt, wenn Person in Zonen während Zeitfenster erkannt wird."
    },
    "Off delay (ms)": { "en": "Off delay (ms)", "de": "Ausschaltverzögerung (ms)" },
    "Time to wait before turning device off after last detection.": {
        "en": "Time to wait before turning device off after last detection.",
        "de": "Wartezeit vor Ausschalten des Geräts nach letzter Erkennung."
    },
    "Safety check interval (ms)": { "en": "Safety check interval (ms)", "de": "Sicherheitsprüfungsintervall (ms)" },
    "Interval to verify device state. Ensures correct state if manual changes occur.": {
        "en": "Interval to verify device state. Ensures correct state if manual changes occur.",
        "de": "Intervall zur Überprüfung des Gerätestatus. Stellt korrekten Status sicher bei manuellen Änderungen."
    },
    "Detection Zones": { "en": "Detection Zones", "de": "Erkennungszonen" },
    "Add Frigate zone person counters (e.g., frigate.0.Zone_Haustuer.person). Device triggers when ANY zone detects a person.": {
        "en": "Add Frigate zone person counters (e.g., frigate.0.Zone_Haustuer.person). Device triggers when ANY zone detects a person.",
        "de": "Frigate-Zonen-Personenzähler hinzufügen (z.B. frigate.0.Zone_Haustuer.person). Gerät wird ausgelöst, wenn IRGENDEINE Zone eine Person erkennt."
    },
    "Add one or more Frigate zones. Device activates when person detected in ANY zone.": {
        "en": "Add one or more Frigate zones. Device activates when person detected in ANY zone.",
        "de": "Eine oder mehrere Frigate-Zonen hinzufügen. Gerät wird aktiviert, wenn Person in IRGENDEINER Zone erkannt wird."
    },
    "Add zone": { "en": "Add zone", "de": "Zone hinzufügen" },
    "Select zone…": { "en": "Select zone…", "de": "Zone auswählen…" },
    "Time condition": { "en": "Time condition", "de": "Zeitbedingung" },
    "Control when device can be triggered. E.g., only at night or during specific hours.": {
        "en": "Control when device can be triggered. E.g., only at night or during specific hours.",
        "de": "Steuern, wann Gerät ausgelöst werden kann. Z.B. nur nachts oder zu bestimmten Zeiten."
    },
    "Mode": { "en": "Mode", "de": "Modus" },
    "Always": { "en": "Always", "de": "Immer" },
    "Astro window (start/end states)": { "en": "Astro window (start/end states)", "de": "Astro-Fenster (Start-/End-States)" },
    "Start time state id (HH:MM:SS)": { "en": "Start time state id (HH:MM:SS)", "de": "Startzeit State-ID (HH:MM:SS)" },
    "State containing start time in HH:MM:SS format (e.g., astro.0.sunrise)": {
        "en": "State containing start time in HH:MM:SS format (e.g., astro.0.sunrise)",
        "de": "State mit Startzeit im HH:MM:SS-Format (z.B. astro.0.sunrise)"
    },
    "End time state id (HH:MM:SS)": { "en": "End time state id (HH:MM:SS)", "de": "Endzeit State-ID (HH:MM:SS)" },
    "State containing end time in HH:MM:SS format (e.g., astro.0.sunset)": {
        "en": "State containing end time in HH:MM:SS format (e.g., astro.0.sunset)",
        "de": "State mit Endzeit im HH:MM:SS-Format (z.B. astro.0.sunset)"
    },

    // Global Editor - Cameras
    "Define cameras with zones. Zones can be selected via state picker from Frigate adapter.": {
        "en": "Define cameras with zones. Zones can be selected via state picker from Frigate adapter.",
        "de": "Kameras mit Zonen definieren. Zonen können per State-Picker vom Frigate-Adapter ausgewählt werden."
    },
    "No cameras configured.": { "en": "No cameras configured.", "de": "Keine Kameras konfiguriert." },
    "Select a camera or add a new one.": { "en": "Select a camera or add a new one.", "de": "Kamera auswählen oder neue hinzufügen." },
    "Unnamed camera": { "en": "Unnamed camera", "de": "Unbenannte Kamera" },
    "Camera details": { "en": "Camera details", "de": "Kamera-Details" },
    "Camera key (must match Frigate)": { "en": "Camera key (must match Frigate)", "de": "Kamera-Schlüssel (muss mit Frigate übereinstimmen)" },
    "Display name (optional)": { "en": "Display name (optional)", "de": "Anzeigename (optional)" },
    "Zones": { "en": "Zones", "de": "Zonen" },

    // Global Editor - Targets
    "Notification targets": { "en": "Notification targets", "de": "Benachrichtigungsziele" },
    "Configure Discord webhooks or Telegram bots for notifications.": {
        "en": "Configure Discord webhooks or Telegram bots for notifications.",
        "de": "Discord-Webhooks oder Telegram-Bots für Benachrichtigungen konfigurieren."
    },
    "Add target": { "en": "Add target", "de": "Ziel hinzufügen" },
    "No targets configured.": { "en": "No targets configured.", "de": "Keine Ziele konfiguriert." },
    "Select a target or add a new one.": { "en": "Select a target or add a new one.", "de": "Ziel auswählen oder neues hinzufügen." },
    "Unnamed target": { "en": "Unnamed target", "de": "Unbenanntes Ziel" },
    "Target details": { "en": "Target details", "de": "Ziel-Details" },
    "Target id": { "en": "Target id", "de": "Ziel-ID" },
    "Type": { "en": "Type", "de": "Typ" },
    "Discord webhook": { "en": "Discord webhook", "de": "Discord-Webhook" },
    "Telegram bot": { "en": "Telegram bot", "de": "Telegram-Bot" },
    "Discord webhook URL": { "en": "Discord webhook URL", "de": "Discord-Webhook-URL" },
    "Telegram bot token": { "en": "Telegram bot token", "de": "Telegram-Bot-Token" },
    "Telegram chat id": { "en": "Telegram chat id", "de": "Telegram-Chat-ID" },

    // Items Tab Label
    "Rules": { "en": "Rules", "de": "Regeln" }
};
