// script.js (v5)

// --- Machine Geometrie & Fysica Constanten ---
const MACHINE_AXIS_CM = 9.05;  // 90.5 mm buttcap tot rotatie-as
const MACHINE_AXIS_MM = 90.5;
const STANDARD_AXIS_CM = 10.0; // 100.0 mm industriestandaard

const PREP_DURATION_SEC = 3.0;   // 3 seconden om de machine met de hand aan te zwengelen
const RECORD_DURATION_SEC = 4.0; // 4 seconden opname voor meer volledige periodes
const WAIT_DURATION_SEC = 3.0;   // Korte rusttijd na meting

// Gyroscoop drempelwaarde (rad/s): negeert ruis bij stilstand volledig
const PEAK_THRESHOLD = 0.25;

// Standaard gekalibreerde machinewaarden (1.8525 Nm/rad en 0.00042 kg·m²)
const DEFAULT_KAPPA = 1.8525;
const DEFAULT_I0 = 0.00042;

function parseNumInput(val, fallback) {
    if (val === undefined || val === null || val === '') return fallback;
    const parsed = parseFloat(String(val).replace(',', '.'));
    return isNaN(parsed) ? fallback : parsed;
}

let savedKappaStorage = parseNumInput(localStorage.getItem('cal_kappa'), DEFAULT_KAPPA);
// Als de oude fabrieksstandaard (1.471) nog per ongeluk in storage stond naast I0=0.00042, herstel direct naar 1.8525
if (Math.abs(savedKappaStorage - 1.471) < 0.001) {
    savedKappaStorage = DEFAULT_KAPPA;
    localStorage.setItem('cal_kappa', DEFAULT_KAPPA);
}

let KAPPA = savedKappaStorage;
let I_0 = parseNumInput(localStorage.getItem('cal_i0'), DEFAULT_I0);

// Opgeslagen instellingen Staaf 1 (standaard: 159.1g, 500mm, 159.5mm offset)
let savedRod1Mass = parseNumInput(localStorage.getItem('cal_rod1_mass'), 159.1);
let savedRod1LengthMm = parseNumInput(localStorage.getItem('cal_rod1_length_mm'), 500.0);
let savedRod1OffsetMm = parseNumInput(localStorage.getItem('cal_rod1_offset_mm'), 159.5);

// Opgeslagen instellingen Staaf 2 (standaard: 158.97g, 404mm, 111.5mm offset)
let savedRod2Mass = parseNumInput(localStorage.getItem('cal_rod2_mass'), 158.97);
let savedRod2LengthMm = parseNumInput(localStorage.getItem('cal_rod2_length_mm'), 404.0);
let savedRod2OffsetMm = parseNumInput(localStorage.getItem('cal_rod2_offset_mm'), 111.5);

// Kalibratie meetreeksen (T1 voor Staaf 1, T2 voor Staaf 2)
let calReadingsT1 = [];
let calReadingsT2 = [];
let tempT1 = null;
let tempT2 = null;

// --- Talen & Vertalingen ---
let currentLang = localStorage.getItem('app_lang') || 'nl';

const translations = {
    nl: {
        headerUnit: "SW: 10cm Std | TW: Torsie",
        modeSW: "1. Swingweight (SW)",
        modeTW: "2. Twistweight (TW)",
        swTitle: "Swingweight",
        twTitle: "Twistweight",
        mass: "Massa (g)",
        balance: "Balans (cm)",
        badgeSW: "SWINGWEIGHT METING",
        badgeTW: "TWISTWEIGHT (TORSION)",
        btnStartMeasure: "Start Meting",
        saveNew: "Nieuw Racket Opslaan...",
        saveDb: "Opslaan in DB",
        historyTitleSW: "SWINGWEIGHT MEETREEKS",
        historyTitleTW: "TWISTWEIGHT MEETREEKS",
        count: "Aantal",
        mean: "Gemiddelde",
        diff: "Verschil",
        dbTitle: "RACKET DATABASE",
        exportCsv: "Exporteer CSV",
        importCsv: "Importeer CSV",
        dbSub: "OPGESLAGEN RACKETS",
        dbEmptyOption: "-- Kies een racket uit Database --",
        aiTitle: "HAPPYRACKET AI",
        aiSelect: "Selecteer Racket & Doelen",
        targetMass: "Doel Gram",
        targetBal: "Doel Balans (cm)",
        targetSW: "Doel SW",
        targetTW: "Doel TW",
        aiBtn: "Start Tuning Analyse",
        aiPlaceholder: "Typ je vraag (bijv. verander de snaar naar...)",
        aiInstruction: "Je bent de professionele AI Tuning Assistent van 'HappyRacket'. Spreek en antwoord ALTIJD in vloeiend Nederlands en gebruik de term 'HappyRacket' af en toe subtiel. Spreek de klant enthousiast en direct aan.",
        calTitle: "MACHINE KALIBRATIE",
        calStep1: "STAAF 1 (ALUMINIUM STAAF)",
        calStep2: "STAAF 2 (TWEEDE / RVS STAAF)",
        rodLengthLabel: "Lengte (mm)",
        rodOffsetLabel: "Offset (mm)",
        rodInfo: "2-Staven Kalibratie (berekent κ én I₀):",
        rodMass: "<strong>Massa (g):</strong> Exacte gewicht van de betreffende staaf op een weegschaal.",
        rodLength: "<strong>Lengte (mm):</strong> Totale lengte van de staaf (bijv. 500 mm en 404 mm).",
        rodOffset: "<strong>Offset d (mm):</strong> Afstand van het midden van de staaf tot de rotatie-as. Bij plaatsing tegen de 90.5 mm buttcap-aanslag is dit: <code>(Lengte / 2) - 90.5 mm</code>.",
        calT1Label: "Gemeten Periode Staaf 1 (T₁)",
        calT1Btn: "Meet Staaf 1 (via Telefoon)",
        calT2Label: "Gemeten Periode Staaf 2 (T₂)",
        calT2Btn: "Meet Staaf 2 (via Telefoon)",
        calResults: "KALIBRATIE RESULTATEN",
        calSave: "Kalibratie Opslaan",
        settingsTitle: "INSTELLINGEN",
        langLabel: "Taal / Language",
        apiKeyLabel: "Gemini API Sleutel",
        saveKeyBtn: "Opslaan",
        modalStrungVsUnstrung: "Bespannen vs Onbespannen",
        modalStrung: "Gemeten: Bespannen",
        modalUnstrung: "Gemeten: Onbespannen",
        modalConvInfo: "Berekent exact de invloed van het gekozen fysieke snaarprofiel op gewicht en swingweight.",
        modalStringChoice: "Snaarkeuze & Spanning",
        modalStringInfo: "Vul hier het merk, type en de spankracht in (bijv. RPM Blast 1.25 op 24kg).",
        modalStringName: "Merk & Type Snaar",
        modalStringNamePlaceholder: "Bijv. Babolat Synthetic Gut 1.30",
        modalProfileMain: "Profiel (Lengte/Main)",
        modalProfileCross: "Profiel (Breedte/Cross)",
        modalSaveString: "Alle Wijzigingen Opslaan",
        modalReload: "Herlaad in Meting",
        modalOpenAI: "Open in AI Coach",
        tapStart: "Leg telefoon in houder en tik op Start.",
        recording: "Slingeringen meten...",
        stopping: "Klaar! Reset over",
        manualInputBtn: "Handmatige Invoer",
        alertNoData: "Voer eerst minimaal 1 meting uit.",
        alertSaved: "Succesvol opgeslagen!",
        confirmDel: "Weet je zeker dat je dit racket wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
        confirmNew: "Weet je zeker dat je een nieuwe meetreeks wilt starten? Huidige metingen gaan verloren.",
        strungEst: "Geschat onbespannen",
        unstrungEst: "Geschat bespannen",
        manualPrompt: "Handmatige tijdinvoer voor",
        manualPromptDesc: "Voer gemeten slingertijd T in seconden in",
        aiGreeting: "Hallo! Welkom bij de HappyRacket Tuning Assistent. Selecteer hierboven een racket, of vraag me direct om advies over loodverdeling, snaren of balansaanpassingen!",
        confirmOverrideMeasurements: "WAARSCHUWING:\nJe past het gemiddelde handmatig aan. Hierdoor worden je eerdere losse metingen voor dit racket definitief overschreven.\n\nWeet je het zeker?",
        editMeasurementsBtn: "Losse Metingen Bewerken",
        editMeasurementsTitle: "Losse Metingen Bewerken",
        swMeasurementsTitle: "Swingweight Metingen",
        twMeasurementsTitle: "Twistweight Metingen",
        saveMeasurementsBtn: "Metingen Opslaan & Herberekenen",
        prepText: "Houd op spanning & laat los! Start in",
        errQuiet: "Geen beweging gedetecteerd (machine stond stil)."
    },
    en: {
        headerUnit: "SW: 10cm Std | TW: Torsion",
        modeSW: "1. Swingweight (SW)",
        modeTW: "2. Twistweight (TW)",
        swTitle: "Swingweight",
        twTitle: "Twistweight",
        mass: "Mass (g)",
        balance: "Balance (cm)",
        badgeSW: "SWINGWEIGHT MEASUREMENT",
        badgeTW: "TWISTWEIGHT (TORSION)",
        btnStartMeasure: "Start Measurement",
        saveNew: "Save New Racket...",
        saveDb: "Save to DB",
        historyTitleSW: "SWINGWEIGHT HISTORY",
        historyTitleTW: "TWISTWEIGHT HISTORY",
        count: "Count",
        mean: "Average",
        diff: "Difference",
        dbTitle: "RACKET DATABASE",
        exportCsv: "Export CSV",
        importCsv: "Import CSV",
        dbSub: "SAVED RACKETS",
        dbEmptyOption: "-- Select a racket from Database --",
        aiTitle: "HAPPYRACKET AI",
        aiSelect: "Select Racket & Targets",
        targetMass: "Target Grams",
        targetBal: "Target Balance (cm)",
        targetSW: "Target SW",
        targetTW: "Target TW",
        aiBtn: "Start Tuning Analysis",
        aiPlaceholder: "Type your question (e.g., change string to...)",
        aiInstruction: "You are the professional AI Tuning Assistant for 'HappyRacket'. ALWAYS speak and answer in fluent English. Use English tennis terminology. Address the customer directly and enthusiastically.",
        calTitle: "MACHINE CALIBRATION",
        calStep1: "ROD 1 (ALUMINUM ROD)",
        calStep2: "ROD 2 (SECOND / STEEL ROD)",
        rodLengthLabel: "Length (mm)",
        rodOffsetLabel: "Offset (mm)",
        rodInfo: "2-Rod Calibration (calculates κ and I₀):",
        rodMass: "<strong>Mass (g):</strong> Exact weight of the rod on a scale.",
        rodLength: "<strong>Length (mm):</strong> Total length of the rod (e.g., 500 mm and 404 mm).",
        rodOffset: "<strong>Offset d (mm):</strong> Distance from rod center to pivot axis. Against the 90.5 mm buttcap stop: <code>(Length / 2) - 90.5 mm</code>.",
        calT1Label: "Measured Period Rod 1 (T₁)",
        calT1Btn: "Measure Rod 1 (with Phone)",
        calT2Label: "Measured Period Rod 2 (T₂)",
        calT2Btn: "Measure Rod 2 (with Phone)",
        calResults: "CALIBRATION RESULTS",
        calSave: "Save Calibration",
        settingsTitle: "SETTINGS",
        langLabel: "Taal / Language",
        apiKeyLabel: "Gemini API Key",
        saveKeyBtn: "Save",
        modalStrungVsUnstrung: "Strung vs Unstrung",
        modalStrung: "Measured: Strung",
        modalUnstrung: "Measured: Unstrung",
        modalConvInfo: "Calculates the exact influence of the chosen physical string profile on weight and swingweight.",
        modalStringChoice: "String Choice & Tension",
        modalStringInfo: "Enter the brand, type, and tension here (e.g., RPM Blast 1.25 at 24kg).",
        modalStringName: "String Brand & Type",
        modalStringNamePlaceholder: "E.g. Babolat Synthetic Gut 1.30",
        modalProfileMain: "Profile (Mains)",
        modalProfileCross: "Profile (Crosses)",
        modalSaveString: "Save All Changes",
        modalReload: "Reload in Measurement",
        modalOpenAI: "Open in AI Coach",
        tapStart: "Place phone in cradle and tap Start.",
        recording: "Recording oscillations...",
        stopping: "Done! Reset in",
        manualInputBtn: "Manual Input",
        alertNoData: "Please perform at least 1 measurement first.",
        alertSaved: "Successfully saved!",
        confirmDel: "Are you sure you want to delete this racket? This action cannot be undone.",
        confirmNew: "Are you sure you want to start a new measurement series? Current unsaved measurements will be lost.",
        strungEst: "Estimated unstrung",
        unstrungEst: "Estimated strung",
        manualPrompt: "Manual time input for",
        manualPromptDesc: "Enter measured swing time T in seconds",
        aiGreeting: "Hello! Welcome to the HappyRacket Tuning Assistant. Select a racket above or ask me directly for advice on lead placement, strings, or balance adjustments!",
        confirmOverrideMeasurements: "WARNING:\nYou are changing the average manually. This will permanently overwrite your previous individual measurements for this racket.\n\nAre you sure?",
        editMeasurementsBtn: "Edit Individual Measurements",
        editMeasurementsTitle: "Edit Individual Measurements",
        swMeasurementsTitle: "Swingweight Measurements",
        twMeasurementsTitle: "Twistweight Measurements",
        saveMeasurementsBtn: "Save Measurements & Recalculate",
        prepText: "Hold deflected & release! Starts in",
        errQuiet: "No motion detected (cradle was still)."
    },
    de: {
        headerUnit: "SW: 10cm Std | TW: Torsion",
        modeSW: "1. Schwunggewicht (SW)",
        modeTW: "2. Twistweight (TW)",
        swTitle: "Schwunggewicht",
        twTitle: "Twistweight",
        mass: "Masse (g)",
        balance: "Balance (cm)",
        badgeSW: "SCHWUNGGEWICHT MESSUNG",
        badgeTW: "TWISTWEIGHT (TORSION)",
        btnStartMeasure: "Messung Starten",
        saveNew: "Neuen Schläger speichern...",
        saveDb: "In DB speichern",
        historyTitleSW: "SCHWUNGGEWICHT VERLAUF",
        historyTitleTW: "TWISTWEIGHT VERLAUF",
        count: "Anzahl",
        mean: "Durchschnitt",
        diff: "Differenz",
        dbTitle: "SCHLÄGER DATENBANK",
        exportCsv: "CSV Exportieren",
        importCsv: "CSV Importieren",
        dbSub: "GESPEICHERTE SCHLÄGER",
        dbEmptyOption: "-- Wähle einen Schläger aus Datenbank --",
        aiTitle: "HAPPYRACKET KI",
        aiSelect: "Schläger & Ziele auswählen",
        targetMass: "Ziel Gramm",
        targetBal: "Ziel Balance (cm)",
        targetSW: "Ziel SW",
        targetTW: "Ziel TW",
        aiBtn: "Tuning-Analyse starten",
        aiPlaceholder: "Stell deine Frage (z.B. Saite ändern in...)",
        aiInstruction: "Du bist der professionelle KI-Tuning-Assistent von 'HappyRacket'. Sprich und antworte IMMER auf fließendem Deutsch. Verwende deutsche Tennis-Fachbegriffe. Sprich den Kunden begeistert und direkt an.",
        calTitle: "MASCHINENKALIBRIERUNG",
        calStep1: "STAB 1 (ALUMINIUMSTAB)",
        calStep2: "STAB 2 (ZWEITER / EDELSTAHLSTAB)",
        rodLengthLabel: "Länge (mm)",
        rodOffsetLabel: "Offset (mm)",
        rodInfo: "2-Stab-Kalibrierung (berechnet κ und I₀):",
        rodMass: "<strong>Masse (g):</strong> Exaktes Gewicht des Stabs auf der Waage.",
        rodLength: "<strong>Länge (mm):</strong> Gesamtlänge des Stabs (z.B. 500 mm und 404 mm).",
        rodOffset: "<strong>Offset d (mm):</strong> Abstand von Stabmitte zur Rotationsachse. Am 90.5 mm Anschlag: <code>(Länge / 2) - 90.5 mm</code>.",
        calT1Label: "Gemessene Periode Stab 1 (T₁)",
        calT1Btn: "Messe Stab 1 (mit Handy)",
        calT2Label: "Gemessene Periode Stab 2 (T₂)",
        calT2Btn: "Messe Stab 2 (mit Handy)",
        calResults: "KALIBRIERUNGSERGEBNISSE",
        calSave: "Kalibrierung Speichern",
        settingsTitle: "EINSTELLUNGEN",
        langLabel: "Taal / Language",
        apiKeyLabel: "Gemini API Schlüssel",
        saveKeyBtn: "Speichern",
        modalStrungVsUnstrung: "Besaitet vs Unbesaitet",
        modalStrung: "Gemessen: Besaitet",
        modalUnstrung: "Gemessen: Unbesaitet",
        modalConvInfo: "Berechnet den genauen Einfluss des gewählten Saitenprofils auf Gewicht und Schwunggewicht.",
        modalStringChoice: "Saitenwahl & Spannung",
        modalStringInfo: "Geben Sie hier Marke, Typ und Spannung ein (z. B. RPM Blast 1.25 mit 24 kg).",
        modalStringName: "Saitenmarke & Typ",
        modalStringNamePlaceholder: "Z.B. Babolat Synthetic Gut 1.30",
        modalProfileMain: "Profil (Längs/Main)",
        modalProfileCross: "Profil (Quer/Cross)",
        modalSaveString: "Alle Änderungen Speichern",
        modalReload: "In Messung neu laden",
        modalOpenAI: "In KI Coach öffnen",
        tapStart: "Handy einlegen und Start tippen.",
        recording: "Schwingungen messen...",
        stopping: "Fertig! Reset in",
        manualInputBtn: "Manuelle Eingabe",
        alertNoData: "Bitte führen Sie zuerst mindestens 1 Messung durch.",
        alertSaved: "Erfolgreich gespeichert!",
        confirmDel: "Möchten Sie diesen Schläger wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
        confirmNew: "Sind Sie sicher, dass Sie eine neue Messreihe starten möchten? Nicht gespeicherte Messungen gehen verloren.",
        strungEst: "Geschätzt unbesaitet",
        unstrungEst: "Geschätzt besaitet",
        manualPrompt: "Manuelle Zeiteingabe für",
        manualPromptDesc: "Gemessene Schwungzeit T in Sekunden eingeben",
        aiGreeting: "Hallo! Willkommen beim HappyRacket Tuning Assistent. Wähle oben einen Schläger aus oder frage mich direkt nach Ratschlägen zu Bleigewichten, Saiten oder Balanceanpassungen!",
        confirmOverrideMeasurements: "WARNUNG:\nSie ändern den Durchschnitt manuell. Dadurch werden Ihre vorherigen Einzelmessungen für diesen Schläger überschrieben.\n\nSind Sie sicher?",
        editMeasurementsBtn: "Einzelmessungen bearbeiten",
        editMeasurementsTitle: "Einzelmessungen bearbeiten",
        swMeasurementsTitle: "Schwunggewicht Messungen",
        twMeasurementsTitle: "Twistweight Messungen",
        saveMeasurementsBtn: "Messungen Speichern & Berechnen",
        prepText: "Auslenken & loslassen! Start in",
        errQuiet: "Keine Bewegung erkannt (Maschine stand still)."
    }
};

const t = (key) => translations[currentLang][key] || key;

// --- Vaste Snaarprofielen Database ---
const STRING_PROFILES = [
    { id: 'poly_std', label: 'Polyester Standard (1.25mm / 17)', mass: 16.0, balShift: 1.1, swAdd: 30 },
    { id: 'poly_thick', label: 'Polyester Thick (1.30mm / 16)', mass: 18.0, balShift: 1.2, swAdd: 34 },
    { id: 'poly_thin', label: 'Polyester Thin (1.20mm / 18)', mass: 14.5, balShift: 1.0, swAdd: 27 },
    { id: 'multi', label: 'Multifilament / Syn Gut (1.30mm)', mass: 15.0, balShift: 1.0, swAdd: 28 },
    { id: 'gut', label: 'Natural Gut (1.30mm)', mass: 16.5, balShift: 1.15, swAdd: 31 }
];

// --- Gescheiden Meetdata (SW vs TW) ---
let currentMode = 'sw'; 
let swMeasurements = [];
let twistMeasurements = [];
let lastMeasuredPeriodSec = null;

// Gyroscoop Signaalverwerking State (Hoog-precisie modus)
let risingCrossTimes = [];  
let fallingCrossTimes = []; 
let halfPeriodReadings = []; 
let armedDirection = 0;
let prevOmega = null;
let prevSampleTime = null;
let lastZeroCrossTime = null;
let lastCrossDirection = 0;
let lockedAxis = null; 

let measurementTimeoutId;
let countdownIntervalId;
let isMeasuring = false;
let currentCountdown = 0;

let currentCalculatedSW = 0;
let currentCalculatedTwist = 0;
let currentCalculatedIcm = 0;
let currentCalculatedRecoil = 0;

// Database & State
let racketDatabase = JSON.parse(localStorage.getItem('racket_db')) || [];
let activeModalRacketId = null;
let isStrungMeasured = true;

// Edit Measurements State
let tempEditSW = [];
let tempEditTW = [];

// --- Gemini AI API Key & Setup ---
let geminiApiKey = localStorage.getItem('gemini_user_api_key') || '';
let aiChatHistory = [];

// --- DOM Elements ---
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-button');
const mainActionBtn = document.getElementById('mainActionBtn');
const statusMessage = document.getElementById('statusMessage');
const currentDisplayValue = document.getElementById('currentDisplayValue');
const activeModeBadge = document.getElementById('activeModeBadge');
const historySectionTitle = document.getElementById('historySectionTitle');

const cardSW = document.getElementById('cardSW');
const cardTW = document.getElementById('cardTW');
const valOverviewSW = document.getElementById('valOverviewSW');
const valOverviewTW = document.getElementById('valOverviewTW');

const groupCount = document.getElementById('groupCount');
const groupMean = document.getElementById('groupMean');
const groupDifference = document.getElementById('groupDifference');
const measurementList = document.getElementById('measurementList');
const addMeasurementBtn = document.getElementById('addMeasurementBtn');

const modeSWBtn = document.getElementById('modeSWBtn');
const modeTwistBtn = document.getElementById('modeTwistBtn');

const racketMassInput = document.getElementById('racketMass');
const racketBalanceInput = document.getElementById('racketBalance');

const valIcm = document.getElementById('valIcm');
const valRecoil = document.getElementById('valRecoil');
const valPeriod = document.getElementById('valPeriod');
const racketNameInput = document.getElementById('racketNameInput');
const btnSaveRacket = document.getElementById('btnSaveRacket');

const databaseList = document.getElementById('databaseList');
const btnExportCSV = document.getElementById('btnExportCSV');
const btnImportCSV = document.getElementById('btnImportCSV');
const csvFileInput = document.getElementById('csvFileInput');

// AI Elements
const aiSelectRacket = document.getElementById('aiSelectRacket');
const aiTargetMass = document.getElementById('aiTargetMass');
const aiTargetBal = document.getElementById('aiTargetBal');
const aiTargetSW = document.getElementById('aiTargetSW');
const aiTargetTW = document.getElementById('aiTargetTW'); 
const btnStartAICoach = document.getElementById('btnStartAICoach');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiChatInput = document.getElementById('aiChatInput');
const btnSendChat = document.getElementById('btnSendChat');

// Settings Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const btnSaveApiKey = document.getElementById('btnSaveApiKey');
const settingsActiveCal = document.getElementById('settingsActiveCal');

// Modal Elements
const racketDetailModal = document.getElementById('racketDetailModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalRacketNameInput = document.getElementById('modalRacketNameInput'); 
const modalMassInput = document.getElementById('modalMassInput');
const modalBalanceInput = document.getElementById('modalBalanceInput');
const modalSWInput = document.getElementById('modalSWInput');
const modalTwistInput = document.getElementById('modalTwistInput');

const btnToggleStrungState = document.getElementById('btnToggleStrungState');
const strungConversionDisplay = document.getElementById('strungConversionDisplay');
const modalStringNameInput = document.getElementById('modalStringNameInput'); 
const modalSelectMain = document.getElementById('modalSelectMain');
const modalTensionMain = document.getElementById('modalTensionMain');
const modalSelectCross = document.getElementById('modalSelectCross');
const modalTensionCross = document.getElementById('modalTensionCross');
const btnSaveModalString = document.getElementById('btnSaveModalString');
const btnModalLoadToMeasure = document.getElementById('btnModalLoadToMeasure');
const btnModalOpenInAI = document.getElementById('btnModalOpenInAI');

const infoConversionBtn = document.getElementById('infoConversionBtn');
const infoConversionBox = document.getElementById('infoConversionBox');
const infoStringBtn = document.getElementById('infoStringBtn');
const infoStringBox = document.getElementById('infoStringBox');

// Edit Measurements Elements
const editMeasurementsModal = document.getElementById('editMeasurementsModal');
const closeEditMeasurementsBtn = document.getElementById('closeEditMeasurementsBtn');
const btnOpenEditMeasurements = document.getElementById('btnOpenEditMeasurements');
const swMeasurementsEditList = document.getElementById('swMeasurementsEditList');
const twMeasurementsEditList = document.getElementById('twMeasurementsEditList');
const btnAddTempSW = document.getElementById('btnAddTempSW');
const btnAddTempTW = document.getElementById('btnAddTempTW');
const btnSaveEditedMeasurements = document.getElementById('btnSaveEditedMeasurements');

// Calibration DOM (Staaf 1 & Staaf 2)
const calRod1Mass = document.getElementById('calRod1Mass');
const calRod1Length = document.getElementById('calRod1Length');
const calRod1Offset = document.getElementById('calRod1Offset');
const btnAutoOffset1 = document.getElementById('btnAutoOffset1');
const calT1Display = document.getElementById('calT1Display');
const calCount1Badge = document.getElementById('calCount1Badge');
const calRod1InertiaInfo = document.getElementById('calRod1InertiaInfo');
const btnCalibrateT1 = document.getElementById('btnCalibrateT1');

const calRod2Mass = document.getElementById('calRod2Mass');
const calRod2Length = document.getElementById('calRod2Length');
const calRod2Offset = document.getElementById('calRod2Offset');
const btnAutoOffset2 = document.getElementById('btnAutoOffset2');
const calT2Display = document.getElementById('calT2Display');
const calCount2Badge = document.getElementById('calCount2Badge');
const calRod2InertiaInfo = document.getElementById('calRod2InertiaInfo');
const btnCalibrateT2 = document.getElementById('btnCalibrateT2');

const btnResetCalMeasurements = document.getElementById('btnResetCalMeasurements');
const btnSaveCalibration = document.getElementById('btnSaveCalibration');
const calInputKappa = document.getElementById('calInputKappa');
const calInputI0 = document.getElementById('calInputI0');
const calStatusHint = document.getElementById('calStatusHint');
const infoToggleBtn = document.getElementById('infoToggleBtn');
const rodInfoBox = document.getElementById('rodInfoBox');

function updateSettingsCalDisplay() {
    if (settingsActiveCal) {
        settingsActiveCal.innerText = `κ = ${KAPPA.toFixed(4)} | I₀ = ${I_0.toFixed(5)}`;
    }
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key]; 
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    if (activeModeBadge) activeModeBadge.innerText = currentMode === 'sw' ? t('badgeSW') : t('badgeTW');
    if (historySectionTitle) historySectionTitle.innerText = currentMode === 'sw' ? t('historyTitleSW') : t('historyTitleTW');
    
    if (aiSelectRacket && aiSelectRacket.options.length > 0) {
        aiSelectRacket.options[0].text = t('dbEmptyOption');
    }
    
    if (btnToggleStrungState) {
        btnToggleStrungState.innerText = isStrungMeasured ? t('modalStrung') : t('modalUnstrung');
    }

    if (mainActionBtn && mainActionBtn.dataset.state === 'ready_to_measure') {
        const modeLabel = currentMode === 'sw' ? 'SW' : 'TWIST';
        mainActionBtn.textContent = `Start ${modeLabel}`;
        if (statusMessage) statusMessage.innerText = t('tapStart');
    }
}

// --- Gyroscoop & Bewegingssensoren ---
let gyroscope = null;
let sensorAvailable = false;

function resetGyroTracking() {
    risingCrossTimes = [];
    fallingCrossTimes = [];
    halfPeriodReadings = [];
    armedDirection = 0;
    prevOmega = null;
    prevSampleTime = null;
    lastZeroCrossTime = null;
    lastCrossDirection = 0;
    lockedAxis = null;
}

function handleRawGyroAxes(y, z, now) {
    if (!isMeasuring) return;

    if (!lockedAxis) {
        if (Math.abs(y) > PEAK_THRESHOLD || Math.abs(z) > PEAK_THRESHOLD) {
            lockedAxis = Math.abs(y) >= Math.abs(z) ? 'y' : 'z';
        } else {
            return;
        }
    }

    const omega = lockedAxis === 'y' ? y : z;
    processGyroData(omega, now);
}

async function startSensors() {
    if ('Gyroscope' in window) {
        try {
            gyroscope = new Gyroscope({ frequency: 100 });
            gyroscope.addEventListener('reading', () => {
                if (!isMeasuring) return;
                handleRawGyroAxes(gyroscope.y || 0, gyroscope.z || 0, performance.now());
            });
            await gyroscope.start();
            sensorAvailable = true;
            updateUIState('ready_to_measure');
            return;
        } catch (error) {
            console.warn("Gyroscope API viel terug op DeviceMotion:", error);
        }
    }

    if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', (event) => {
            if (!isMeasuring || !event.rotationRate) return;
            const degToRad = Math.PI / 180;
            const y = (event.rotationRate.beta || 0) * degToRad;
            const z = (event.rotationRate.gamma || 0) * degToRad;
            handleRawGyroAxes(y, z, performance.now());
        });
        sensorAvailable = true;
        updateUIState('ready_to_measure');
        return;
    }

    sensorAvailable = false;
    if (statusMessage) statusMessage.innerText = "Sensor offline. " + t('manualInputBtn');
    updateUIState('error');
}

function processGyroData(omega, now) {
    if (omega > PEAK_THRESHOLD) {
        armedDirection = 1;
    } else if (omega < -PEAK_THRESHOLD) {
        armedDirection = -1;
    }

    if (prevOmega !== null && prevSampleTime !== null) {
        if (armedDirection === 1 && prevOmega > 0 && omega <= 0) {
            const fraction = prevOmega / (prevOmega - omega);
            const exactCrossTime = prevSampleTime + fraction * (now - prevSampleTime);
            recordZeroCrossing(exactCrossTime, -1);
            armedDirection = 0;
        }
        else if (armedDirection === -1 && prevOmega < 0 && omega >= 0) {
            const fraction = Math.abs(prevOmega) / (Math.abs(prevOmega) + omega);
            const exactCrossTime = prevSampleTime + fraction * (now - prevSampleTime);
            recordZeroCrossing(exactCrossTime, 1);
            armedDirection = 0;
        }
    }

    prevOmega = omega;
    prevSampleTime = now;
}

function recordZeroCrossing(crossTime, direction) {
    if (direction === 1) {
        risingCrossTimes.push(crossTime);
    } else {
        fallingCrossTimes.push(crossTime);
    }

    if (lastZeroCrossTime !== null && lastCrossDirection !== direction) {
        const halfPeriodSec = (crossTime - lastZeroCrossTime) / 1000.0;
        const fullPeriodSec = halfPeriodSec * 2.0;

        if (fullPeriodSec >= 0.20 && fullPeriodSec <= 3.00) {
            halfPeriodReadings.push(fullPeriodSec);
        }
    }
    lastZeroCrossTime = crossTime;
    lastCrossDirection = direction;
}

function computeHighPrecisionPeriod() {
    let fullCyclePeriods = [];

    for (let i = 1; i < risingCrossTimes.length; i++) {
        const p = (risingCrossTimes[i] - risingCrossTimes[i - 1]) / 1000.0;
        if (p >= 0.20 && p <= 3.00) fullCyclePeriods.push(p);
    }

    for (let i = 1; i < fallingCrossTimes.length; i++) {
        const p = (fallingCrossTimes[i] - fallingCrossTimes[i - 1]) / 1000.0;
        if (p >= 0.20 && p <= 3.00) fullCyclePeriods.push(p);
    }

    const sourceReadings = fullCyclePeriods.length >= 2 ? fullCyclePeriods : halfPeriodReadings;
    if (!sourceReadings || sourceReadings.length === 0) return null;

    if (sourceReadings.length <= 2) {
        return sourceReadings.reduce((a, b) => a + b, 0) / sourceReadings.length;
    }

    const sorted = [...sourceReadings].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const filtered = sorted.filter(p => Math.abs(p - median) / median < 0.05);
    const listToUse = filtered.length > 0 ? filtered : sorted;

    return listToUse.reduce((a, b) => a + b, 0) / listToUse.length;
}

// --- Fysica Model (Swingweight & Twistweight) ---
function calculateRacketMetrics(period) {
    lastMeasuredPeriodSec = period;
    if (valPeriod) valPeriod.innerText = `${period.toFixed(3)}s`;

    const m_kg = parseNumInput(racketMassInput.value, 305) / 1000.0;
    const bp_m = parseNumInput(racketBalanceInput.value, 32.0) / 100.0;
    const d_mach_m = MACHINE_AXIS_CM / 100.0;
    const d_std_m = STANDARD_AXIS_CM / 100.0;

    const iTotal = KAPPA * Math.pow(period / (2 * Math.PI), 2);
    const iMach = Math.max(0, iTotal - I_0);

    if (currentMode === 'twist') {
        currentCalculatedTwist = iMach * 10000;
        valOverviewTW.innerText = currentCalculatedTwist.toFixed(1);
        return currentCalculatedTwist;
    }

    if (iMach <= 0.0001) {
        return null;
    }

    const distCmToMach = Math.abs(bp_m - d_mach_m);
    const iCm = Math.max(0, iMach - m_kg * Math.pow(distCmToMach, 2));
    const distCmToStd = Math.abs(bp_m - d_std_m);
    const iStd = iCm + m_kg * Math.pow(distCmToStd, 2);
    const iButt = iCm + m_kg * Math.pow(bp_m, 2);

    currentCalculatedSW = iStd * 10000;
    currentCalculatedIcm = iCm * 10000;
    currentCalculatedRecoil = iButt * 10000;

    if (valIcm) valIcm.innerText = currentCalculatedIcm.toFixed(1);
    if (valRecoil) valRecoil.innerText = currentCalculatedRecoil.toFixed(1);
    valOverviewSW.innerText = currentCalculatedSW.toFixed(1);

    return currentCalculatedSW;
}

function recalculateSubMetricsFromMean(meanVal) {
    if (currentMode === 'twist') {
        valOverviewTW.innerText = meanVal.toFixed(1);
        return;
    }
    const m_kg = parseNumInput(racketMassInput.value, 305) / 1000.0;
    const bp_m = parseNumInput(racketBalanceInput.value, 32.0) / 100.0;
    const d_std_m = STANDARD_AXIS_CM / 100.0;

    const iStd = meanVal / 10000;
    const distCmToStd = Math.abs(bp_m - d_std_m);
    const iCm = Math.max(0, iStd - m_kg * Math.pow(distCmToStd, 2));
    const iButt = iCm + m_kg * Math.pow(bp_m, 2);

    currentCalculatedIcm = iCm * 10000;
    currentCalculatedRecoil = iButt * 10000;

    if (valIcm) valIcm.innerText = currentCalculatedIcm.toFixed(1);
    if (valRecoil) valRecoil.innerText = currentCalculatedRecoil.toFixed(1);
    valOverviewSW.innerText = meanVal.toFixed(1);
}

function recalcDerivedMetrics(r) {
    if (r.sw > 0 && r.mass > 0 && r.balance > 0) {
        const m_kg = r.mass / 1000.0;
        const bp_m = r.balance / 100.0;
        const d_std_m = 10.0 / 100.0;
        const iStd = r.sw / 10000;
        const distCmToStd = Math.abs(bp_m - d_std_m);
        const iCm = Math.max(0, iStd - m_kg * Math.pow(distCmToStd, 2));
        const iButt = iCm + m_kg * Math.pow(bp_m, 2);
        r.icm = parseFloat((iCm * 10000).toFixed(1));
        r.recoil = parseFloat((iButt * 10000).toFixed(1));
    }
}

function promptManualInput() {
    const defaultVal = currentMode === 'sw' ? "0.848" : "0.416";
    const modeName = currentMode === 'sw' ? t('swTitle') : t('twTitle');
    const hint = currentMode === 'sw' ? "~0.80 - 0.90s" : "~0.38 - 0.45s";
    
    const input = prompt(`${t('manualPrompt')} ${modeName}\n${t('manualPromptDesc')} (${hint}):`, defaultVal);
    if (input) {
        const parsed = parseNumInput(input, -1);
        if (parsed > 0) {
            const calculatedVal = calculateRacketMetrics(parsed);
            if (calculatedVal !== null) {
                addMeasurementToGroup(calculatedVal);
            }
        }
    }
}

function updateUIState(state) {
    if (!mainActionBtn) return;
    mainActionBtn.dataset.state = state;
    const modeLabel = currentMode === 'sw' ? 'SW' : 'TWIST';
    switch (state) {
        case 'ready_to_measure':
            mainActionBtn.textContent = `Start ${modeLabel}`;
            mainActionBtn.classList.add('active-measure');
            mainActionBtn.classList.remove('disabled');
            if (statusMessage) statusMessage.innerText = t('tapStart');
            break;
        case 'preparing':
            mainActionBtn.textContent = "Houd klaar...";
            mainActionBtn.classList.add('disabled');
            mainActionBtn.classList.remove('active-measure');
            break;
        case 'recording':
            mainActionBtn.textContent = `${modeLabel} meten...`;
            mainActionBtn.classList.add('disabled');
            if (statusMessage) statusMessage.innerText = t('recording');
            break;
        case 'stopping':
            mainActionBtn.textContent = 'OK';
            mainActionBtn.classList.add('disabled');
            if (statusMessage) statusMessage.innerText = `${t('stopping')} ${currentCountdown}s`;
            break;
        case 'error':
            mainActionBtn.textContent = t('manualInputBtn');
            mainActionBtn.classList.remove('disabled', 'active-measure');
            break;
    }
}

// --- HOOFDMETING WORKFLOW MET 3 SECONDEN AANZWENGELTIJD ---
function startMeasurementWorkflow() {
    if (isMeasuring || mainActionBtn.dataset.state === 'preparing') return;

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().catch(() => {});
    }

    updateUIState('preparing');
    let prepCountdown = Math.ceil(PREP_DURATION_SEC);
    if (statusMessage) statusMessage.innerText = `${t('prepText')} ${prepCountdown}s...`;
    
    clearInterval(countdownIntervalId);
    clearTimeout(measurementTimeoutId);
    
    countdownIntervalId = setInterval(() => {
        prepCountdown--;
        if (prepCountdown > 0) {
            if (statusMessage) statusMessage.innerText = `${t('prepText')} ${prepCountdown}s...`;
        } else {
            clearInterval(countdownIntervalId);
            
            resetGyroTracking();
            isMeasuring = true;
            updateUIState('recording');

            measurementTimeoutId = setTimeout(() => {
                isMeasuring = false;
                
                const avgPeriod = computeHighPrecisionPeriod();
                if (!avgPeriod || halfPeriodReadings.length < 2) {
                    if (statusMessage) statusMessage.innerText = t('errQuiet');
                    mainActionBtn.textContent = `Start ${currentMode === 'sw' ? 'SW' : 'TWIST'}`;
                    mainActionBtn.dataset.state = 'ready_to_measure';
                    mainActionBtn.classList.add('active-measure');
                    mainActionBtn.classList.remove('disabled');
                    return;
                }

                const val = calculateRacketMetrics(avgPeriod);
                if (val === null) {
                    if (statusMessage) statusMessage.innerText = t('errQuiet');
                    updateUIState('ready_to_measure');
                    return;
                }

                addMeasurementToGroup(val);
                updateUIState('stopping');
                startCountdown();
            }, RECORD_DURATION_SEC * 1000);
        }
    }, 1000);
}

function startCountdown() {
    currentCountdown = WAIT_DURATION_SEC;
    clearInterval(countdownIntervalId);
    countdownIntervalId = setInterval(() => {
        currentCountdown--;
        if (currentCountdown <= 0) {
            clearInterval(countdownIntervalId);
            updateUIState('ready_to_measure');
        } else {
            if (statusMessage) statusMessage.innerText = `${t('stopping')} ${currentCountdown}s...`;
        }
    }, 1000);
}

function addMeasurementToGroup(value) {
    if (currentMode === 'sw') swMeasurements.push(value);
    else twistMeasurements.push(value);
    updateMeasurementGroupDisplay();
}

function updateMeasurementGroupDisplay() {
    const list = currentMode === 'sw' ? swMeasurements : twistMeasurements;
    const count = list.length;
    if (groupCount) groupCount.innerText = count;

    if (count === 0) {
        if (groupMean) groupMean.innerText = '-';
        if (groupDifference) groupDifference.innerText = '-';
        if (currentDisplayValue) currentDisplayValue.innerText = '0.0';
        if (measurementList) measurementList.innerHTML = '';
        if (valPeriod) valPeriod.innerText = '-';
        if (currentMode === 'twist') {
            if (valIcm) valIcm.innerText = '-';
            if (valRecoil) valRecoil.innerText = '-';
        }
        return;
    }

    const sum = list.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    if (groupMean) groupMean.innerText = mean.toFixed(1);

    const lastValue = list[list.length - 1];
    const difference = lastValue - mean;
    if (groupDifference) groupDifference.innerText = (difference >= 0 ? '+' : '') + difference.toFixed(1);
    if (currentDisplayValue) currentDisplayValue.innerText = lastValue.toFixed(1);

    recalculateSubMetricsFromMean(mean);
    displayMeasurementsInList(mean);
}

function displayMeasurementsInList(currentMean) {
    if (!measurementList) return;
    measurementList.innerHTML = '';
    const list = currentMode === 'sw' ? swMeasurements : twistMeasurements;
    const prefix = currentMode === 'sw' ? 'SW' : 'TW';

    list.forEach((val, index) => {
        const item = document.createElement('div');
        item.classList.add('measurement-item');
        const deviation = Math.abs((val - currentMean) / currentMean) * 100;
        let valueClass = deviation > 5 ? 'outlier' : '';
        item.innerHTML = `
            <span><strong>${prefix}</strong> #${index + 1}</span>
            <span class="${valueClass}">${val.toFixed(1)} <small style="font-size:10px; color:var(--dark-text-secondary)">kg·cm²</small></span>
        `;
        measurementList.appendChild(item);
    });
}

// --- 2-STAVEN KALIBRATIE MET TELEFOON (STAAF 1 & STAAF 2) ---
function computeSingleRodInertia(massG, rawLength, rawOffset) {
    const L_m = rawLength > 100 ? rawLength / 1000.0 : rawLength / 100.0;
    const d_m = (rawLength > 100 || rawOffset > 40) ? rawOffset / 1000.0 : rawOffset / 100.0;
    const m_kg = massG / 1000.0;
    return (1.0 / 12.0) * m_kg * (L_m ** 2) + m_kg * (d_m ** 2);
}

function startRodCalibrationMeasurement(rodNumber, btnElement) {
    if (isMeasuring) return;

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().catch(() => {});
    }

    const originalText = rodNumber === 1 ? t('calT1Btn') : t('calT2Btn');
    const calRecordSec = 3.0;
    let prep = Math.ceil(PREP_DURATION_SEC);
    btnElement.disabled = true;
    btnElement.style.backgroundColor = "var(--brand-green)";
    btnElement.style.color = "var(--brand-navy-dark)";
    btnElement.innerText = `${t('prepText')} ${prep}s...`;

    const prepInterval = setInterval(() => {
        prep--;
        if (prep > 0) {
            btnElement.innerText = `${t('prepText')} ${prep}s...`;
        } else {
            clearInterval(prepInterval);
            btnElement.style.backgroundColor = "var(--brand-navy-dark)";
            btnElement.style.color = "#fff";
            btnElement.innerText = `${t('recording')} (${calRecordSec}s)`;

            resetGyroTracking();
            isMeasuring = true;

            setTimeout(() => {
                isMeasuring = false;
                btnElement.disabled = false;

                const avgPeriod = computeHighPrecisionPeriod();
                if (!avgPeriod || halfPeriodReadings.length < 2) {
                    btnElement.innerText = t('errQuiet');
                    btnElement.style.backgroundColor = "var(--red-outlier)";
                    setTimeout(() => {
                        btnElement.innerText = originalText;
                        btnElement.style.backgroundColor = "var(--brand-teal)";
                        btnElement.style.color = "#fff";
                    }, 2500);
                    return;
                }

                if (rodNumber === 1) {
                    calReadingsT1.push(avgPeriod);
                    tempT1 = calReadingsT1.reduce((a, b) => a + b, 0) / calReadingsT1.length;
                    if (calT1Display) calT1Display.innerText = `${tempT1.toFixed(4)} s`;
                    if (calCount1Badge) calCount1Badge.innerText = `${calReadingsT1.length}x gemeten`;
                } else {
                    calReadingsT2.push(avgPeriod);
                    tempT2 = calReadingsT2.reduce((a, b) => a + b, 0) / calReadingsT2.length;
                    if (calT2Display) calT2Display.innerText = `${tempT2.toFixed(4)} s`;
                    if (calCount2Badge) calCount2Badge.innerText = `${calReadingsT2.length}x gemeten`;
                }

                btnElement.innerText = originalText;
                btnElement.style.backgroundColor = "var(--brand-teal)";
                btnElement.style.color = "#fff";

                const result = processCalibrationCalculations();
                if (result && tempT1 && tempT2) {
                    KAPPA = result.kappa;
                    I_0 = result.i0;
                    localStorage.setItem('cal_kappa', KAPPA);
                    localStorage.setItem('cal_i0', I_0);
                    updateSettingsCalDisplay();
                }
            }, calRecordSec * 1000);
        }
    }, 1000);
}

function saveRodInputsToStorage() {
    if (calRod1Mass && calRod1Mass.value) localStorage.setItem('cal_rod1_mass', parseNumInput(calRod1Mass.value, 159.1));
    if (calRod1Length && calRod1Length.value) localStorage.setItem('cal_rod1_length_mm', parseNumInput(calRod1Length.value, 500));
    if (calRod1Offset && calRod1Offset.value) localStorage.setItem('cal_rod1_offset_mm', parseNumInput(calRod1Offset.value, 159.5));

    if (calRod2Mass && calRod2Mass.value) localStorage.setItem('cal_rod2_mass', parseNumInput(calRod2Mass.value, 158.97));
    if (calRod2Length && calRod2Length.value) localStorage.setItem('cal_rod2_length_mm', parseNumInput(calRod2Length.value, 404));
    if (calRod2Offset && calRod2Offset.value) localStorage.setItem('cal_rod2_offset_mm', parseNumInput(calRod2Offset.value, 111.5));
}

function processCalibrationCalculations() {
    const m1 = parseNumInput(calRod1Mass ? calRod1Mass.value : savedRod1Mass, 159.1);
    const l1 = parseNumInput(calRod1Length ? calRod1Length.value : savedRod1LengthMm, 500.0);
    const d1 = parseNumInput(calRod1Offset ? calRod1Offset.value : savedRod1OffsetMm, 159.5);

    const m2 = parseNumInput(calRod2Mass ? calRod2Mass.value : savedRod2Mass, 158.97);
    const l2 = parseNumInput(calRod2Length ? calRod2Length.value : savedRod2LengthMm, 404.0);
    const d2 = parseNumInput(calRod2Offset ? calRod2Offset.value : savedRod2OffsetMm, 111.5);

    const iRod1 = computeSingleRodInertia(m1, l1, d1);
    const iRod2 = computeSingleRodInertia(m2, l2, d2);

    if (calRod1InertiaInfo) {
        calRod1InertiaInfo.innerText = `Traagheid Staaf 1 (I_staaf1): ${(iRod1 * 10000).toFixed(1)} kg·cm²`;
    }
    if (calRod2InertiaInfo) {
        calRod2InertiaInfo.innerText = `Traagheid Staaf 2 (I_staaf2): ${(iRod2 * 10000).toFixed(1)} kg·cm²`;
    }

    if (tempT1 && tempT2 && tempT1 > 0 && tempT2 > 0) {
        const factor1 = (tempT1 / (2 * Math.PI)) ** 2;
        const factor2 = (tempT2 / (2 * Math.PI)) ** 2;

        if (Math.abs(factor2 - factor1) > 1e-6 && Math.abs(iRod2 - iRod1) > 1e-6) {
            const calculatedKappa = (iRod2 - iRod1) / (factor2 - factor1);
            const rawI0 = calculatedKappa * factor1 - iRod1;
            const calculatedI0 = Math.max(0.00001, rawI0);

            if (calculatedKappa > 0) {
                if (calInputKappa) calInputKappa.value = calculatedKappa.toFixed(4);
                if (calInputI0) calInputI0.value = calculatedI0.toFixed(5);
                if (calStatusHint) {
                    if (rawI0 < 0) {
                        calStatusHint.innerText = `⚠️ Let op: I₀ kwam negatief uit (${rawI0.toFixed(5)}). Controleer of massa/offset kloppen en meet beide staven opnieuw.`;
                    } else {
                        calStatusHint.innerText = `✅ 2-Staven kalibratie compleet & actief! Zowel κ (${calculatedKappa.toFixed(4)}) als I₀ (${calculatedI0.toFixed(5)}) zijn berekend.`;
                    }
                }
                return { kappa: calculatedKappa, i0: calculatedI0 };
            }
        }
    }

    if ((tempT1 && tempT1 > 0) || (tempT2 && tempT2 > 0)) {
        const activeI0 = parseNumInput(calInputI0 ? calInputI0.value : I_0, I_0);
        const usedT = tempT1 || tempT2;
        const usedIRod = tempT1 ? iRod1 : iRod2;
        const rodLabel = tempT1 ? "Staaf 1" : "Staaf 2";

        const factor = (usedT / (2 * Math.PI)) ** 2;
        const calculatedKappa = (usedIRod + activeI0) / factor;

        if (calculatedKappa > 0) {
            if (calInputKappa) calInputKappa.value = calculatedKappa.toFixed(4);
            if (calStatusHint) {
                calStatusHint.innerText = `ℹ️ Alleen ${rodLabel} gemeten (κ berekend met huidige I₀). Meet ook de andere staaf om I₀ automatisch te bepalen!`;
            }
            return { kappa: calculatedKappa, i0: activeI0 };
        }
    }

    return null;
}

// --- Database & Racket Opslag ---
function saveCurrentRacketToDB() {
    const name = racketNameInput.value.trim() || `Racket #${racketDatabase.length + 1}`;
    const meanSW = swMeasurements.length > 0 ? (swMeasurements.reduce((a, b) => a + b, 0) / swMeasurements.length) : currentCalculatedSW;
    const meanTwist = twistMeasurements.length > 0 ? (twistMeasurements.reduce((a, b) => a + b, 0) / twistMeasurements.length) : currentCalculatedTwist;

    if (meanSW <= 0 && meanTwist <= 0) {
        alert(t('alertNoData'));
        return;
    }

    const existingIndex = racketDatabase.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
    let racketEntry;

    if (existingIndex >= 0) {
        racketEntry = racketDatabase[existingIndex];
        racketEntry.mass = parseNumInput(racketMassInput.value, 305);
        racketEntry.balance = parseNumInput(racketBalanceInput.value, 32.0);
        if (meanSW > 0) racketEntry.sw = parseFloat(meanSW.toFixed(1));
        if (meanTwist > 0) racketEntry.twist = parseFloat(meanTwist.toFixed(1));
        racketEntry.icm = parseFloat(currentCalculatedIcm.toFixed(1));
        racketEntry.recoil = parseFloat(currentCalculatedRecoil.toFixed(1));
        racketEntry.swMeasurements = [...swMeasurements];
        racketEntry.twistMeasurements = [...twistMeasurements];
        racketDatabase[existingIndex] = racketEntry;
    } else {
        racketEntry = {
            id: Date.now(),
            name: name,
            stringName: "", 
            mass: parseNumInput(racketMassInput.value, 305),
            balance: parseNumInput(racketBalanceInput.value, 32.0),
            stringMainProfile: 'poly_std',
            stringCrossProfile: 'poly_std',
            tensionMain: 24.0,
            tensionCross: 23.0,
            sw: meanSW > 0 ? parseFloat(meanSW.toFixed(1)) : 0,
            twist: meanTwist > 0 ? parseFloat(meanTwist.toFixed(1)) : 0,
            icm: parseFloat(currentCalculatedIcm.toFixed(1)),
            recoil: parseFloat(currentCalculatedRecoil.toFixed(1)),
            swMeasurements: [...swMeasurements],
            twistMeasurements: [...twistMeasurements],
            date: new Date().toLocaleDateString()
        };
        racketDatabase.unshift(racketEntry);
    }

    localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
    renderDatabase();
    alert(`"${name}" ${t('alertSaved')}`);
}

function renderDatabase() {
    if (!databaseList) return;
    databaseList.innerHTML = '';
    aiSelectRacket.innerHTML = `<option value="">${t('dbEmptyOption')}</option>`;

    racketDatabase.forEach(racket => {
        const card = document.createElement('div');
        card.classList.add('db-card');
        card.innerHTML = `
            <div onclick="openRacketModal(${racket.id})" style="flex:1;">
                <div class="db-card-title">${racket.name}</div>
                <div class="db-card-sub">${racket.mass}g | ${racket.balance}cm | SW: ${racket.sw || '-'} | TW: ${racket.twist || '-'}</div>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="db-card-sw" onclick="openRacketModal(${racket.id})">${racket.sw || racket.twist}</span>
                <button class="db-delete-btn" onclick="event.stopPropagation(); deleteRacket(${racket.id})">&times;</button>
            </div>
        `;
        databaseList.appendChild(card);
        aiSelectRacket.add(new Option(`${racket.name} (${racket.mass}g / ${racket.sw || '-'} SW)`, racket.id));
    });
}

window.deleteRacket = function(id) {
    if (confirm(t('confirmDel'))) {
        racketDatabase = racketDatabase.filter(r => r.id !== id);
        localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
        renderDatabase();
    }
};

function populateStringDropdowns() {
    modalSelectMain.innerHTML = '';
    modalSelectCross.innerHTML = '';
    STRING_PROFILES.forEach(profile => {
        modalSelectMain.add(new Option(profile.label, profile.id));
        modalSelectCross.add(new Option(profile.label, profile.id));
    });
}

window.openRacketModal = function(id) {
    activeModalRacketId = id;
    const r = racketDatabase.find(item => item.id === id);
    if (!r) return;

    modalRacketNameInput.value = r.name; 
    modalMassInput.value = r.mass || '';
    modalBalanceInput.value = r.balance || '';
    modalSWInput.value = r.sw || '';
    modalTwistInput.value = r.twist || '';

    modalStringNameInput.value = r.stringName || ''; 
    modalSelectMain.value = r.stringMainProfile || 'poly_std';
    modalSelectCross.value = r.stringCrossProfile || 'poly_std';
    modalTensionMain.value = r.tensionMain || 24.0;
    modalTensionCross.value = r.tensionCross || 23.0;

    isStrungMeasured = true;
    btnToggleStrungState.innerText = t('modalStrung');
    updateStrungConversion(r);

    racketDetailModal.classList.add('active');
};

function getCombinedStringProfile(mainId, crossId) {
    const p1 = STRING_PROFILES.find(p => p.id === mainId) || STRING_PROFILES[0];
    const p2 = STRING_PROFILES.find(p => p.id === crossId) || STRING_PROFILES[0];

    return {
        mass: (p1.mass * 0.5) + (p2.mass * 0.5),
        balShift: (p1.balShift * 0.5) + (p2.balShift * 0.5),
        swAdd: (p1.swAdd * 0.5) + (p2.swAdd * 0.5)
    };
}

function updateStrungConversion(r) {
    const profile = getCombinedStringProfile(modalSelectMain.value, modalSelectCross.value);
    
    if (isStrungMeasured) {
        const uMass = (r.mass - profile.mass).toFixed(1);
        const uBal = (r.balance - profile.balShift).toFixed(1);
        const uSW = r.sw ? (r.sw - profile.swAdd).toFixed(1) : '-';
        strungConversionDisplay.innerHTML = `${t('strungEst')}: <strong>${uMass}g | ${uBal}cm | ${uSW} SW</strong> (-${profile.mass.toFixed(1)}g)`;
    } else {
        const sMass = (r.mass + profile.mass).toFixed(1);
        const sBal = (r.balance + profile.balShift).toFixed(1);
        const sSW = r.sw ? (r.sw + profile.swAdd).toFixed(1) : '-';
        strungConversionDisplay.innerHTML = `${t('unstrungEst')}: <strong>${sMass}g | ${sBal}cm | ${sSW} SW</strong> (+${profile.mass.toFixed(1)}g)`;
    }
}

// --- CSV Import Functionaliteit ---
if (btnImportCSV && csvFileInput) {
    btnImportCSV.addEventListener('click', () => {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            parseAndImportCSV(text);
        };
        reader.readAsText(file);
        csvFileInput.value = '';
    });
}

function parseAndImportCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) {
        alert("Het CSV-bestand is leeg of heeft een ongeldig formaat.");
        return;
    }

    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = [];
        let inQuotes = false;
        let entry = '';
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(entry);
                entry = '';
            } else {
                entry += char;
            }
        }
        row.push(entry);

        if (row.length >= 8) {
            const name = row[0].replace(/^"|"$/g, '').trim();
            const stringName = row[1] ? row[1].replace(/^"|"$/g, '').trim() : "";
            const mass = parseFloat(row[2]) || 300;
            const balance = parseFloat(row[3]) || 32.0;
            const stringMainProfile = row[4] ? row[4].replace(/^"|"$/g, '').trim() : 'poly_std';
            const tensionMain = parseFloat(row[5]) || 24.0;
            const stringCrossProfile = row[6] ? row[6].replace(/^"|"$/g, '').trim() : 'poly_std';
            const tensionCross = parseFloat(row[7]) || 23.0;
            const sw = parseFloat(row[8]) || 0;
            const twist = parseFloat(row[9]) || 0;
            const icm = parseFloat(row[10]) || 0;
            const recoil = parseFloat(row[11]) || 0;
            const date = row[12] ? row[12].replace(/^"|"$/g, '').trim() : new Date().toLocaleDateString();

            const newRacket = {
                id: Date.now() + Math.random(),
                name: name || "Geïmporteerd Racket",
                stringName: stringName,
                mass: mass,
                balance: balance,
                stringMainProfile: stringMainProfile,
                stringCrossProfile: stringCrossProfile,
                tensionMain: tensionMain,
                tensionCross: tensionCross,
                sw: sw,
                twist: twist,
                icm: icm,
                recoil: recoil,
                swMeasurements: sw > 0 ? [sw] : [],
                twistMeasurements: twist > 0 ? [twist] : [],
                date: date
            };

            racketDatabase.push(newRacket);
            importedCount++;
        }
    }

    if (importedCount > 0) {
        localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
        renderDatabase();
        alert(`Succesvol ${importedCount} racket(s) geïmporteerd!`);
    } else {
        alert("Er konden geen geldige rackets uit het bestand worden gelezen.");
    }
}

// --- GEMINI LIVE AI TUNING ENGINE ---
async function callGeminiAPI(promptText) {
    if (!geminiApiKey) {
        appendChatMessage('ai', '⚠️ Vul eerst je Gemini API Key in via de Settings pagina.');
        return;
    }

    const systemPrompt = `
    [TAAL INSTRUCTIE]: ${translations[currentLang].aiInstruction}
    
    Belangrijke communicatieregels:
    1. GEBRUIK NOOIT wiskundige codes, LaTeX, of symbolen zoals $, \\Delta, of ^2.
    2. Spreek in simpele, enthousiaste Jip-en-Janneketaal. Geen robot-achtige zinnen.
    3. PAS JE STRUCTUUR AAN OP DE VRAAG:
       - Simpele/feitelijke vraag: Geef een heel kort, direct antwoord en stel een wedervraag.
       - Complexe tuning-vraag: Structureer met emoji's ('Conclusie', 'Uitleg', 'Opties').
    4. Je krijgt onzichtbaar de database mee in het blok [VERBORGEN DATA]. Behandel dit als parate kennis! Zeg NOOIT "In jouw data zie ik...", maar zeg gewoon "Jouw Racket 1 heeft een...".

    [NIEUWE SUPERKRACHT: DATABASE UPDATEN]
    Als de klant jou vraagt om de NAAM, MASSA, BALANS, SW, TW of BESPANNING (merk/kilo's) aan te passen, update jij de database op de achtergrond!
    Om dit te doen, schrijf je helemaal aan het einde van je antwoord EXACT dit JSON blok (vervang de waardes):
    <UPDATE_DB>
    {
      "id": 123456789,
      "name": "Nieuwe Naam",
      "stringName": "Babolat RPM Blast 1.25",
      "mass": 305,
      "balance": 32.0,
      "sw": 300,
      "twist": 14.5,
      "tensionMain": 24,
      "tensionCross": 23
    }
    </UPDATE_DB>
    Let op: Neem het exacte "ID" over uit de context. Bevestig in de gewone tekst dat je de aanpassing hebt gedaan.

    Technische tuning kennis:
    - Racket Modellen & Snarenpatroon: Let op de NAAM van het racket. 18x20 vraagt om dunnere snaren of een lagere spanning dan 16x19.
    - Lood op 12 uur: +3.4 SW per gram.
    - Lood op 3 & 9 uur: +1.85 SW per gram (verhoogt TW fors).
    - Buttcap (0cm): verhoogt statisch gewicht, geen SW of TW toename.`;

    aiChatHistory.push({ role: "user", parts: [{ text: promptText }] });

    try {
        appendChatMessage('ai', '⏳ *HappyRacket AI is aan het typen...*');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: aiChatHistory
            })
        });

        const data = await response.json();
        removeLastChatMessage();

        if (data.candidates && data.candidates[0].content) {
            let aiReply = data.candidates[0].content.parts[0].text;
            
            const updateRegex = /<UPDATE_DB>([\s\S]*?)<\/UPDATE_DB>/;
            const match = aiReply.match(updateRegex);
            
            if (match) {
                try {
                    let jsonStr = match[1].replace(/```json/g, '').replace(/```/g, '').trim();
                    const updateData = JSON.parse(jsonStr);
                    const rIndex = racketDatabase.findIndex(r => r.id == updateData.id);
                    
                    if (rIndex >= 0) {
                        const r = racketDatabase[rIndex];
                        if (updateData.name) r.name = updateData.name;
                        if (updateData.stringName) r.stringName = updateData.stringName;
                        if (updateData.mass !== undefined) r.mass = parseFloat(updateData.mass);
                        if (updateData.balance !== undefined) r.balance = parseFloat(updateData.balance);
                        if (updateData.sw !== undefined) {
                            r.sw = parseFloat(updateData.sw);
                            r.swMeasurements = [r.sw]; 
                        }
                        if (updateData.twist !== undefined) {
                            r.twist = parseFloat(updateData.twist);
                            r.twistMeasurements = [r.twist]; 
                        }
                        if (updateData.tensionMain !== undefined) r.tensionMain = parseFloat(updateData.tensionMain);
                        if (updateData.tensionCross !== undefined) r.tensionCross = parseFloat(updateData.tensionCross);
                        
                        recalcDerivedMetrics(r); 
                        localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
                        renderDatabase(); 
                    }
                } catch(e) {
                    console.error("AI Database Update Error:", e);
                }
                aiReply = aiReply.replace(updateRegex, '').trim();
            }

            aiChatHistory.push({ role: "model", parts: [{ text: aiReply }] });
            appendChatMessage('ai', aiReply);
            
        } else {
            appendChatMessage('ai', '❌ Error: ' + (data.error ? data.error.message : 'Unknown'));
        }
    } catch (err) {
        removeLastChatMessage();
        appendChatMessage('ai', '❌ API Error: ' + err.message);
    }
}

function appendChatMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender === 'user' ? 'user-msg' : 'ai-msg');
    
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!<[^>]*)\*(?![^<]*>)/g, '') 
        .replace(/\n\n/g, '<br><br>') 
        .replace(/\n/g, '<br>'); 
        
    msgDiv.innerHTML = (sender === 'ai' ? `<strong>HappyRacket AI:</strong><br><br>` : '<strong>You/Jij:</strong><br>') + formattedText;
    aiChatContainer.appendChild(msgDiv);
    aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
}

function removeLastChatMessage() {
    const last = aiChatContainer.lastElementChild;
    if (last) last.remove();
}

// --- Functies voor de Bewerk Losse Metingen Modal ---
window.updateTempMeasure = function(type, index, val) {
    const num = parseFloat(val) || 0;
    if (type === 'sw') tempEditSW[index] = num;
    else tempEditTW[index] = num;
};

window.deleteTempMeasure = function(type, index) {
    if (type === 'sw') tempEditSW.splice(index, 1);
    else tempEditTW.splice(index, 1);
    renderEditMeasurements();
};

function renderEditMeasurements() {
    swMeasurementsEditList.innerHTML = '';
    tempEditSW.forEach((val, i) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.innerHTML = `
            <input type="number" class="dark-input" value="${val}" step="0.1" style="flex:1;" onchange="updateTempMeasure('sw', ${i}, this.value)">
            <button class="db-delete-btn" onclick="deleteTempMeasure('sw', ${i})">&times;</button>
        `;
        swMeasurementsEditList.appendChild(div);
    });

    twMeasurementsEditList.innerHTML = '';
    tempEditTW.forEach((val, i) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.innerHTML = `
            <input type="number" class="dark-input" value="${val}" step="0.1" style="flex:1;" onchange="updateTempMeasure('tw', ${i}, this.value)">
            <button class="db-delete-btn" onclick="deleteTempMeasure('tw', ${i})">&times;</button>
        `;
        twMeasurementsEditList.appendChild(div);
    });
}

// --- Initialisatie & Events ---
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    document.getElementById('languageSelect').addEventListener('change', (e) => applyLanguage(e.target.value));

    if (apiKeyInput) apiKeyInput.value = geminiApiKey;
    if (btnSaveApiKey) {
        btnSaveApiKey.addEventListener('click', () => {
            geminiApiKey = apiKeyInput.value.trim();
            localStorage.setItem('gemini_user_api_key', geminiApiKey);
            alert(t('alertSaved'));
        });
    }

    // Laad opgeslagen kalibratie- & staafwaarden voor Staaf 1 en Staaf 2
    if (calRod1Mass) calRod1Mass.value = savedRod1Mass;
    if (calRod1Length) calRod1Length.value = savedRod1LengthMm;
    if (calRod1Offset) calRod1Offset.value = savedRod1OffsetMm;

    if (calRod2Mass) calRod2Mass.value = savedRod2Mass;
    if (calRod2Length) calRod2Length.value = savedRod2LengthMm;
    if (calRod2Offset) calRod2Offset.value = savedRod2OffsetMm;

    if (calInputKappa) calInputKappa.value = KAPPA.toFixed(4);
    if (calInputI0) calInputI0.value = I_0.toFixed(5);
    updateSettingsCalDisplay();

    processCalibrationCalculations();
    populateStringDropdowns();
    renderDatabase();
    startSensors();

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(button.dataset.page).classList.add('active');
            navButtons.forEach(b => b.classList.toggle('active', b === button));
        });
    });

    modeSWBtn.addEventListener('click', () => {
        currentMode = 'sw';
        modeSWBtn.classList.add('active');
        modeTwistBtn.classList.remove('active');
        cardSW.classList.add('active');
        cardTW.classList.remove('active');
        if (activeModeBadge) activeModeBadge.innerText = t('badgeSW');
        if (historySectionTitle) historySectionTitle.innerText = t('historyTitleSW');
        updateMeasurementGroupDisplay();
        updateUIState(sensorAvailable ? 'ready_to_measure' : 'error');
    });

    modeTwistBtn.addEventListener('click', () => {
        currentMode = 'twist';
        modeTwistBtn.classList.add('active');
        modeSWBtn.classList.remove('active');
        cardTW.classList.add('active');
        cardSW.classList.remove('active');
        if (activeModeBadge) activeModeBadge.innerText = t('badgeTW');
        if (historySectionTitle) historySectionTitle.innerText = t('historyTitleTW');
        updateMeasurementGroupDisplay();
        updateUIState(sensorAvailable ? 'ready_to_measure' : 'error');
    });

    btnStartAICoach.addEventListener('click', () => {
        const rId = aiSelectRacket.value;
        const r = racketDatabase.find(item => item.id == rId);

        let contextPrompt = r ? `Tuning advies voor: "${r.name}".\n` : `Algemeen tuning advies.\n`;

        const tM = aiTargetMass.value ? `${aiTargetMass.value}g` : 'Ongewijzigd';
        const tBP = aiTargetBal.value ? `${aiTargetBal.value}cm` : 'Ongewijzigd';
        const tSW = aiTargetSW.value ? `${aiTargetSW.value} SW` : 'Ongewijzigd';
        const tTW = aiTargetTW.value ? `${aiTargetTW.value} TW` : 'Ongewijzigd';

        contextPrompt += `Doelen: Massa: ${tM} | Balans: ${tBP} | SW: ${tSW} | TW: ${tTW}\nAnalyseer: haalbaar met lood? Zo ja, waar en hoeveel?`;

        appendChatMessage('user', `Analyseer tuning doelen: Massa: ${tM} | Balans: ${tBP} | SW: ${tSW} | TW: ${tTW}`);
        
        let dbContext = "[VERBORGEN DATA START]\nAlle rackets:\n";
        racketDatabase.forEach(rk => {
            dbContext += `[ID: ${rk.id}] "${rk.name}": Massa=${rk.mass}g, Balans=${rk.balance}cm, SW=${rk.sw||'?'}, TW=${rk.twist||'?'}, Snaar="${rk.stringName||'Geen'}" (${rk.tensionMain}/${rk.tensionCross}kg)\n`;
        });
        if (r) dbContext += `\nActief: "${r.name}"\n`;
        dbContext += "[VERBORGEN DATA EINDE]\n\n";

        callGeminiAPI(dbContext + contextPrompt);
    });

    btnSendChat.addEventListener('click', () => {
        const text = aiChatInput.value.trim();
        if (!text) return;
        
        appendChatMessage('user', text); 
        aiChatInput.value = '';

        let dbContext = "[VERBORGEN DATA START]\nAlle rackets in de database:\n";
        if (racketDatabase.length === 0) {
            dbContext += "- Leeg.\n";
        } else {
            racketDatabase.forEach(r => {
                dbContext += `[ID: ${r.id}] "${r.name}": Massa=${r.mass}g, Balans=${r.balance}cm, SW=${r.sw||'?'}, TW=${r.twist||'?'}, Snaar="${r.stringName||'Geen'}" (${r.tensionMain}/${r.tensionCross}kg)\n`;
            });
        }

        let activeRacketContext = "";
        const rId = aiSelectRacket.value;
        if (rId) {
            const r = racketDatabase.find(item => item.id == rId);
            if (r) activeRacketContext = `\nActief in UI: "${r.name}".`;
        }

        const promptToSend = `${dbContext}${activeRacketContext}\n[VERBORGEN DATA EINDE]\n\nVraag van de klant: ${text}`;
        
        callGeminiAPI(promptToSend);
    });

    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSendChat.click();
    });

    aiSelectRacket.addEventListener('change', () => {
        const r = racketDatabase.find(item => item.id == aiSelectRacket.value);
        if (r) {
            aiTargetMass.value = r.mass;
            aiTargetBal.value = r.balance;
            aiTargetSW.value = r.sw || '';
            aiTargetTW.value = r.twist || '';
        }
    });

    if (infoToggleBtn && rodInfoBox) infoToggleBtn.addEventListener('click', () => rodInfoBox.classList.toggle('show'));
    if (infoConversionBtn && infoConversionBox) infoConversionBtn.addEventListener('click', () => infoConversionBox.classList.toggle('show'));
    if (infoStringBtn && infoStringBox) infoStringBtn.addEventListener('click', () => infoStringBox.classList.toggle('show'));

    currentDisplayValue.style.cursor = 'pointer';
    currentDisplayValue.addEventListener('click', promptManualInput);

    cardSW.style.cursor = 'pointer';
    cardSW.addEventListener('click', () => {
        if (currentMode !== 'sw') modeSWBtn.click();
    });

    cardTW.style.cursor = 'pointer';
    cardTW.addEventListener('click', () => {
        if (currentMode !== 'twist') modeTwistBtn.click();
    });

    if (mainActionBtn) {
        mainActionBtn.addEventListener('click', () => {
            if (sensorAvailable) {
                startMeasurementWorkflow();
            } else {
                promptManualInput();
            }
        });
    }

    if (addMeasurementBtn) {
        addMeasurementBtn.addEventListener('click', () => {
            const currentList = currentMode === 'sw' ? swMeasurements : twistMeasurements;
            if (currentList.length > 0) {
                if (!confirm(t('confirmNew'))) return; 
            }

            if (currentMode === 'sw') {
                swMeasurements = [];
                valOverviewSW.innerText = '-';
            } else {
                twistMeasurements = [];
                valOverviewTW.innerText = '-';
            }
            updateMeasurementGroupDisplay();
            updateUIState(sensorAvailable ? 'ready_to_measure' : 'error');
        });
    }

    if (btnSaveRacket) btnSaveRacket.addEventListener('click', saveCurrentRacketToDB);
    if (btnExportCSV) btnExportCSV.addEventListener('click', exportToCSV);

    modalCloseBtn.addEventListener('click', () => racketDetailModal.classList.remove('active'));

    btnToggleStrungState.addEventListener('click', () => {
        isStrungMeasured = !isStrungMeasured;
        btnToggleStrungState.innerText = isStrungMeasured ? t('modalStrung') : t('modalUnstrung');
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (r) updateStrungConversion(r);
    });

    modalSelectMain.addEventListener('change', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (r) updateStrungConversion(r);
    });

    modalSelectCross.addEventListener('change', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (r) updateStrungConversion(r);
    });

    btnSaveModalString.addEventListener('click', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (r) {
            const newMass = parseNumInput(modalMassInput.value, r.mass);
            const newBalance = parseNumInput(modalBalanceInput.value, r.balance);
            const newSW = parseNumInput(modalSWInput.value, 0);
            const newTwist = parseNumInput(modalTwistInput.value, 0);

            let overwriteWarning = false;
            if ((newSW !== r.sw && r.swMeasurements && r.swMeasurements.length > 1) || 
                (newTwist !== r.twist && r.twistMeasurements && r.twistMeasurements.length > 1)) {
                overwriteWarning = true;
            }

            if (overwriteWarning) {
                if (!confirm(t('confirmOverrideMeasurements'))) {
                    return; 
                }
            }

            if (newSW !== r.sw) r.swMeasurements = [newSW];
            if (newTwist !== r.twist) r.twistMeasurements = [newTwist];

            r.name = modalRacketNameInput.value.trim() || r.name;
            r.mass = newMass;
            r.balance = newBalance;
            r.sw = newSW;
            r.twist = newTwist;

            recalcDerivedMetrics(r);

            r.stringName = modalStringNameInput.value.trim();
            r.stringMainProfile = modalSelectMain.value;
            r.stringCrossProfile = modalSelectCross.value;
            r.tensionMain = parseNumInput(modalTensionMain.value, 0);
            r.tensionCross = parseNumInput(modalTensionCross.value, 0);

            localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
            
            alert(t('alertSaved'));
            renderDatabase();
            updateStrungConversion(r);
        }
    });

    btnOpenEditMeasurements.addEventListener('click', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (!r) return;
        tempEditSW = r.swMeasurements ? [...r.swMeasurements] : (r.sw ? [r.sw] : []);
        tempEditTW = r.twistMeasurements ? [...r.twistMeasurements] : (r.twist ? [r.twist] : []);
        renderEditMeasurements();
        editMeasurementsModal.classList.add('active');
    });

    closeEditMeasurementsBtn.addEventListener('click', () => {
        editMeasurementsModal.classList.remove('active');
    });

    btnAddTempSW.addEventListener('click', () => {
        tempEditSW.push(0);
        renderEditMeasurements();
    });

    btnAddTempTW.addEventListener('click', () => {
        tempEditTW.push(0);
        renderEditMeasurements();
    });

    btnSaveEditedMeasurements.addEventListener('click', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (!r) return;

        tempEditSW = tempEditSW.filter(v => v > 0);
        tempEditTW = tempEditTW.filter(v => v > 0);

        r.swMeasurements = [...tempEditSW];
        r.twistMeasurements = [...tempEditTW];

        if (r.swMeasurements.length > 0) {
            r.sw = parseFloat((r.swMeasurements.reduce((a,b)=>a+b,0) / r.swMeasurements.length).toFixed(1));
        } else {
            r.sw = 0;
        }

        if (r.twistMeasurements.length > 0) {
            r.twist = parseFloat((r.twistMeasurements.reduce((a,b)=>a+b,0) / r.twistMeasurements.length).toFixed(1));
        } else {
            r.twist = 0;
        }

        recalcDerivedMetrics(r);
        localStorage.setItem('racket_db', JSON.stringify(racketDatabase));
        
        modalSWInput.value = r.sw || '';
        modalTwistInput.value = r.twist || '';

        renderDatabase();
        updateStrungConversion(r);
        
        editMeasurementsModal.classList.remove('active');
        alert(t('alertSaved'));
    });

    btnModalLoadToMeasure.addEventListener('click', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (!r) return;

        racketNameInput.value = r.name;
        racketMassInput.value = r.mass;
        racketBalanceInput.value = r.balance;
        swMeasurements = r.swMeasurements ? [...r.swMeasurements] : (r.sw ? [r.sw] : []);
        twistMeasurements = r.twistMeasurements ? [...r.twistMeasurements] : (r.twist ? [r.twist] : []);
        
        valOverviewSW.innerText = r.sw ? r.sw.toFixed(1) : '-';
        valOverviewTW.innerText = r.twist ? r.twist.toFixed(1) : '-';
        
        updateMeasurementGroupDisplay();

        racketDetailModal.classList.remove('active');
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('measurePage').classList.add('active');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === 'measurePage'));
    });

    btnModalOpenInAI.addEventListener('click', () => {
        const r = racketDatabase.find(item => item.id === activeModalRacketId);
        if (!r) return;

        racketDetailModal.classList.remove('active');
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('aiPage').classList.add('active');
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === 'aiPage'));

        aiSelectRacket.value = r.id;
        aiTargetMass.value = r.mass;
        aiTargetBal.value = r.balance;
        aiTargetSW.value = r.sw || '';
        aiTargetTW.value = r.twist || '';
    });

    // --- 2-Staven Kalibratie Events ---
    if (btnCalibrateT1) {
        btnCalibrateT1.addEventListener('click', () => {
            startRodCalibrationMeasurement(1, btnCalibrateT1);
        });
    }

    if (btnCalibrateT2) {
        btnCalibrateT2.addEventListener('click', () => {
            startRodCalibrationMeasurement(2, btnCalibrateT2);
        });
    }

    if (btnAutoOffset1) {
        btnAutoOffset1.addEventListener('click', () => {
            const len = parseNumInput(calRod1Length.value, 500);
            calRod1Offset.value = Math.abs((len / 2.0) - MACHINE_AXIS_MM).toFixed(1);
            saveRodInputsToStorage();
            processCalibrationCalculations();
        });
    }

    if (btnAutoOffset2) {
        btnAutoOffset2.addEventListener('click', () => {
            const len = parseNumInput(calRod2Length.value, 404);
            calRod2Offset.value = Math.abs((len / 2.0) - MACHINE_AXIS_MM).toFixed(1);
            saveRodInputsToStorage();
            processCalibrationCalculations();
        });
    }

    if (btnResetCalMeasurements) {
        btnResetCalMeasurements.addEventListener('click', () => {
            calReadingsT1 = [];
            calReadingsT2 = [];
            tempT1 = null;
            tempT2 = null;
            if (calT1Display) calT1Display.innerText = "- s";
            if (calT2Display) calT2Display.innerText = "- s";
            if (calCount1Badge) calCount1Badge.innerText = "0x gemeten";
            if (calCount2Badge) calCount2Badge.innerText = "0x gemeten";
            if (calStatusHint) calStatusHint.innerText = "";
        });
    }

    [calRod1Mass, calRod1Length, calRod1Offset, calRod2Mass, calRod2Length, calRod2Offset].forEach(inputEl => {
        if (inputEl) {
            inputEl.addEventListener('input', () => {
                saveRodInputsToStorage();
                processCalibrationCalculations();
            });
        }
    });

    // Handmatige aanpassingen in Kappa of I0 direct opslaan zonder te worden overschreven
    if (calInputKappa) {
        calInputKappa.addEventListener('input', () => {
            const val = parseNumInput(calInputKappa.value, -1);
            if (val > 0) {
                KAPPA = val;
                localStorage.setItem('cal_kappa', KAPPA);
                updateSettingsCalDisplay();
            }
        });
    }

    if (calInputI0) {
        calInputI0.addEventListener('input', () => {
            const val = parseNumInput(calInputI0.value, -1);
            if (val >= 0) {
                I_0 = val;
                localStorage.setItem('cal_i0', I_0);
                updateSettingsCalDisplay();
            }
        });
    }

    if (btnSaveCalibration) {
        btnSaveCalibration.addEventListener('click', () => {
            saveRodInputsToStorage();

            if (calInputKappa && calInputKappa.value) {
                KAPPA = parseNumInput(calInputKappa.value, DEFAULT_KAPPA);
                localStorage.setItem('cal_kappa', KAPPA);
            }
            if (calInputI0 && calInputI0.value) {
                I_0 = parseNumInput(calInputI0.value, DEFAULT_I0);
                localStorage.setItem('cal_i0', I_0);
            }
            updateSettingsCalDisplay();
            if (calStatusHint) {
                calStatusHint.innerText = `✅ Actief en opgeslagen: κ = ${KAPPA.toFixed(4)} Nm/rad | I₀ = ${I_0.toFixed(5)} kg·m²`;
            }
            alert(t('alertSaved'));
        });
    }
});

function exportToCSV() {
    if (racketDatabase.length === 0) {
        alert(t('alertNoData'));
        return;
    }
    let csv = "Naam,Merk/Type Snaar,Massa(g),Balans(cm),Main Profiel,Main Kg,Cross Profiel,Cross Kg,SW,Twist,I_cm,Recoil,Datum\n";
    racketDatabase.forEach(r => {
        csv += `"${r.name}","${r.stringName || ''}",${r.mass},${r.balance},"${r.stringMainProfile || ''}",${r.tensionMain || 0},"${r.stringCrossProfile || ''}",${r.tensionCross || 0},${r.sw || 0},${r.twist || 0},${r.icm},${r.recoil},"${r.date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rackets_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}