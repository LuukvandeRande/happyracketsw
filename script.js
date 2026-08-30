// script.js

// --- Machine Geometrie & Fysica Constanten ---
const MACHINE_AXIS_CM = 9.05;  // 90.5 mm buttcap tot rotatie-as
const STANDARD_AXIS_CM = 10.0; // 100.0 mm industriestandaard

const SETTLE_DURATION_SEC = 0.5; 
const RECORD_DURATION_SEC = 3.5; 
const WAIT_DURATION_SEC = 8.0;   

let KAPPA = parseFloat(localStorage.getItem('cal_kappa')) || 1.471; 
let I_0 = parseFloat(localStorage.getItem('cal_i0')) || 0.0050;   

let tempT0 = null;
let tempT1 = null;

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
        btnHold: "Hold at 45°",
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
        calStep1: "STAP 1: LEGE KLEM METING",
        calT0Label: "Periode Lege Klem (T₀)",
        calT0Btn: "Meet T₀ (Leeg)",
        calStep2: "STAP 2: KALIBRATIESTAAF",
        rodInfo: "Parameters kalibratiestaaf:",
        rodMass: "<strong>Massa (g):</strong> Gewicht van de staaf op weegschaal.",
        rodLength: "<strong>Lengte (cm):</strong> Totale lengte van de staaf.",
        rodOffset: "<strong>Offset d (cm):</strong> Afstand van midden staaf tot de rotatie-as.",
        calT1Label: "Periode Teststaaf (T₁)",
        calT1Btn: "Meet T₁ (Met Staaf)",
        calResults: "RESULTATEN",
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
        waitTilt: "Wacht op 45° kanteling",
        tapStart: "Tik om te starten.",
        recording: "Oscillaties registreren...",
        stopping: "Reset over",
        manualInputBtn: "Handmatige Invoer",
        alertNoData: "Voer eerst minimaal 1 meting uit voor dit racket.",
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
        saveMeasurementsBtn: "Metingen Opslaan & Herberekenen"
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
        btnHold: "Hold at 45°",
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
        calStep1: "STEP 1: EMPTY CLAMP MEASUREMENT",
        calT0Label: "Period Empty Clamp (T₀)",
        calT0Btn: "Measure T₀ (Empty)",
        calStep2: "STEP 2: CALIBRATION ROD",
        rodInfo: "Calibration rod parameters:",
        rodMass: "<strong>Mass (g):</strong> Weight of the rod on scale.",
        rodLength: "<strong>Length (cm):</strong> Total length of the rod.",
        rodOffset: "<strong>Offset d (cm):</strong> Distance from center of rod to rotation axis.",
        calT1Label: "Period Test Rod (T₁)",
        calT1Btn: "Measure T₁ (With Rod)",
        calResults: "RESULTS",
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
        waitTilt: "Waiting for 45° tilt",
        tapStart: "Tap to start.",
        recording: "Recording oscillations...",
        stopping: "Reset in",
        manualInputBtn: "Manual Input",
        alertNoData: "Please perform at least 1 measurement for this racket first.",
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
        saveMeasurementsBtn: "Save Measurements & Recalculate"
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
        btnHold: "Auf 45° halten",
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
        calStep1: "SCHRITT 1: LEERE KLEMME MESSUNG",
        calT0Label: "Periode Leere Klemme (T₀)",
        calT0Btn: "Messe T₀ (Leer)",
        calStep2: "SCHRITT 2: KALIBRIERUNGSSTAB",
        rodInfo: "Parameter des Kalibrierungsstabs:",
        rodMass: "<strong>Masse (g):</strong> Gewicht des Stabs auf Waage.",
        rodLength: "<strong>Länge (cm):</strong> Gesamtlänge des Stabs.",
        rodOffset: "<strong>Offset d (cm):</strong> Abstand von Mitte des Stabs zur Rotationsachse.",
        calT1Label: "Periode Teststab (T₁)",
        calT1Btn: "Messe T₁ (Mit Stab)",
        calResults: "ERGEBNISSE",
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
        waitTilt: "Warte auf 45° Neigung",
        tapStart: "Tippen zum Starten.",
        recording: "Schwingungen werden aufgezeichnet...",
        stopping: "Reset in",
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
        saveMeasurementsBtn: "Messungen Speichern & Berechnen"
    }
};

const t = (key) => translations[currentLang][key] || key;

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
    
    if(btnToggleStrungState) {
        btnToggleStrungState.innerText = isStrungMeasured ? t('modalStrung') : t('modalUnstrung');
    }

    if(mainActionBtn && mainActionBtn.dataset.state === 'waiting_tilt') {
        const modeLabel = currentMode === 'sw' ? 'SW' : 'TWIST';
        statusMessage.innerText = `${t('waitTilt')} (${modeLabel})...`;
    }
}

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

let lastPeriodReadings = [];
let lastSign = null;
let lastTime = null;
let measurementTimeoutId;
let countdownIntervalId;
let isMeasuring = false;
let hasTiltedEnough = false;
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

// --- Gemini AI API Key & Setup (Lokaal geladen) ---
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

// Calibration DOM
const calT0Display = document.getElementById('calT0Display');
const calT1Display = document.getElementById('calT1Display');
const btnCalibrateT0 = document.getElementById('btnCalibrateT0');
const btnCalibrateT1 = document.getElementById('btnCalibrateT1');
const btnSaveCalibration = document.getElementById('btnSaveCalibration');
const calResultKappa = document.getElementById('calResultKappa');
const calResultI0 = document.getElementById('calResultI0');
const calRodMass = document.getElementById('calRodMass');
const calRodLength = document.getElementById('calRodLength');
const calRodOffset = document.getElementById('calRodOffset');
const infoToggleBtn = document.getElementById('infoToggleBtn');
const rodInfoBox = document.getElementById('rodInfoBox');

// Sensors
let gyroscope = null;
let accelerometer = null;

async function startSensors() {
    try {
        gyroscope = new Gyroscope({ frequency: 60 });
        gyroscope.addEventListener('reading', () => {
            if (gyroscope.y !== null && isMeasuring) processGyroData(gyroscope.y, performance.now());
        });
        await gyroscope.start();

        accelerometer = new Accelerometer({ frequency: 60 });
        accelerometer.addEventListener('reading', handleAccelerometerReading);
        await accelerometer.start();

        updateUIState('waiting_tilt');
    } catch (error) {
        if (statusMessage) statusMessage.innerText = "Sensor offline. " + t('manualInputBtn');
        updateUIState('error');
    }
}

function handleAccelerometerReading() {
    if (accelerometer.x !== null && accelerometer.y !== null && accelerometer.z !== null) {
        const pitchRad = Math.atan2(accelerometer.x, Math.sqrt(accelerometer.y ** 2 + accelerometer.z ** 2));
        const angle = Math.abs(pitchRad * (180 / Math.PI));
        const measurePage = document.getElementById('measurePage');
        if (measurePage && measurePage.classList.contains('active') && !isMeasuring) {
            if (angle >= 40 && angle <= 50 && !hasTiltedEnough && mainActionBtn.dataset.state === 'waiting_tilt') {
                hasTiltedEnough = true;
                updateUIState('ready_to_measure');
            } else if ((angle < 30 || angle > 60) && hasTiltedEnough && mainActionBtn.dataset.state === 'ready_to_measure') {
                hasTiltedEnough = false;
                updateUIState('waiting_tilt');
            }
        }
    }
}

function processGyroData(omega, now) {
    const sign = Math.sign(omega);
    if (lastSign !== null && sign !== lastSign && Math.abs(omega) < 0.15) {
        if (lastTime !== null) {
            const period = ((now - lastTime) / 1000) * 2;
            if (period >= 0.2 && period <= 2.0) lastPeriodReadings.push(period);
        }
        lastTime = now;
    }
    lastSign = sign;
}

// --- Fysica Model (Swingweight & Twistweight) ---
function calculateRacketMetrics(period) {
    const m_kg = parseFloat(racketMassInput.value) / 1000.0;
    const bp_m = parseFloat(racketBalanceInput.value) / 100.0;
    const d_mach_m = MACHINE_AXIS_CM / 100.0;
    const d_std_m = STANDARD_AXIS_CM / 100.0;

    const iTotal = KAPPA * Math.pow(period / (2 * Math.PI), 2);
    const iMach = Math.max(0, iTotal - I_0);

    if (currentMode === 'twist') {
        currentCalculatedTwist = iMach * 10000;
        valOverviewTW.innerText = currentCalculatedTwist.toFixed(1);
        return currentCalculatedTwist;
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
    const m_kg = parseFloat(racketMassInput.value) / 1000.0;
    const bp_m = parseFloat(racketBalanceInput.value) / 100.0;
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
    const defaultVal = currentMode === 'sw' ? "1.00" : "0.416";
    const modeName = currentMode === 'sw' ? t('swTitle') : t('twTitle');
    const hint = currentMode === 'sw' ? "~0.95 - 1.05s" : "~0.38 - 0.45s";
    
    const input = prompt(`${t('manualPrompt')} ${modeName}\n${t('manualPromptDesc')} (${hint}):`, defaultVal);
    if (input && !isNaN(parseFloat(input)) && parseFloat(input) > 0) {
        const calculatedVal = calculateRacketMetrics(parseFloat(input));
        addMeasurementToGroup(calculatedVal);
    }
}

function updateUIState(state) {
    if (!mainActionBtn) return;
    mainActionBtn.dataset.state = state;
    const modeLabel = currentMode === 'sw' ? 'SW' : 'TWIST';
    switch (state) {
        case 'waiting_tilt':
            mainActionBtn.textContent = t('btnHold');
            mainActionBtn.classList.remove('active-measure', 'disabled');
            if (statusMessage) statusMessage.innerText = `${t('waitTilt')} (${modeLabel})...`;
            break;
        case 'ready_to_measure':
            mainActionBtn.textContent = `Start ${modeLabel}`;
            mainActionBtn.classList.add('active-measure');
            mainActionBtn.classList.remove('disabled');
            if (statusMessage) statusMessage.innerText = t('tapStart');
            break;
        case 'recording':
            mainActionBtn.textContent = `${modeLabel}...`;
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

function startMeasurementWorkflow() {
    if (mainActionBtn.dataset.state !== 'ready_to_measure') return;

    lastPeriodReadings = [];
    lastSign = null;
    lastTime = null;
    isMeasuring = true;

    updateUIState('recording');
    clearTimeout(measurementTimeoutId);
    clearInterval(countdownIntervalId);

    measurementTimeoutId = setTimeout(() => {
        isMeasuring = false;
        if (lastPeriodReadings.length < 2) {
            if (statusMessage) statusMessage.innerText = "Error.";
            updateUIState('waiting_tilt');
            hasTiltedEnough = false;
            return;
        }

        const avgPeriod = lastPeriodReadings.reduce((a, b) => a + b, 0) / lastPeriodReadings.length;
        const val = calculateRacketMetrics(avgPeriod);
        addMeasurementToGroup(val);
        updateUIState('stopping');
        startCountdown();
    }, (SETTLE_DURATION_SEC + RECORD_DURATION_SEC) * 1000);
}

function startCountdown() {
    currentCountdown = WAIT_DURATION_SEC;
    clearInterval(countdownIntervalId);
    countdownIntervalId = setInterval(() => {
        currentCountdown--;
        if (currentCountdown <= 0) {
            clearInterval(countdownIntervalId);
            updateUIState('waiting_tilt');
            hasTiltedEnough = false;
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
        racketEntry.mass = parseFloat(racketMassInput.value);
        racketEntry.balance = parseFloat(racketBalanceInput.value);
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
            mass: parseFloat(racketMassInput.value),
            balance: parseFloat(racketBalanceInput.value),
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

    if (calResultKappa) calResultKappa.innerText = `${KAPPA.toFixed(4)} Nm/rad`;
    if (calResultI0) calResultI0.innerText = `${I_0.toFixed(5)} kg·m²`;

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
        if(activeModeBadge) activeModeBadge.innerText = t('badgeSW');
        if(historySectionTitle) historySectionTitle.innerText = t('historyTitleSW');
        updateMeasurementGroupDisplay();
        updateUIState('waiting_tilt');
    });

    modeTwistBtn.addEventListener('click', () => {
        currentMode = 'twist';
        modeTwistBtn.classList.add('active');
        modeSWBtn.classList.remove('active');
        cardTW.classList.add('active');
        cardSW.classList.remove('active');
        if(activeModeBadge) activeModeBadge.innerText = t('badgeTW');
        if(historySectionTitle) historySectionTitle.innerText = t('historyTitleTW');
        updateMeasurementGroupDisplay();
        updateUIState('waiting_tilt');
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
        promptManualInput();
    });

    cardTW.style.cursor = 'pointer';
    cardTW.addEventListener('click', () => {
        if (currentMode !== 'twist') modeTwistBtn.click();
        promptManualInput();
    });

    if (mainActionBtn) {
        mainActionBtn.addEventListener('click', () => {
            if (mainActionBtn.dataset.state === 'ready_to_measure') {
                startMeasurementWorkflow();
            } else if (mainActionBtn.dataset.state === 'error' || mainActionBtn.dataset.state === 'waiting_tilt') {
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
            updateUIState('waiting_tilt');
            hasTiltedEnough = false;
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
            const newMass = parseFloat(modalMassInput.value) || r.mass;
            const newBalance = parseFloat(modalBalanceInput.value) || r.balance;
            const newSW = parseFloat(modalSWInput.value) || 0;
            const newTwist = parseFloat(modalTwistInput.value) || 0;

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
            r.tensionMain = parseFloat(modalTensionMain.value) || 0;
            r.tensionCross = parseFloat(modalTensionCross.value) || 0;

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

    if (btnCalibrateT0) {
        btnCalibrateT0.addEventListener('click', () => {
            const t0 = prompt("T₀ sec:", "0.366");
            if (t0 && !isNaN(parseFloat(t0))) {
                tempT0 = parseFloat(t0);
                calT0Display.innerText = `${tempT0.toFixed(3)} s`;
                processCalibrationCalculations();
            }
        });
    }

    if (btnCalibrateT1) {
        btnCalibrateT1.addEventListener('click', () => {
            const t1 = prompt("T₁ sec:", "0.550");
            if (t1 && !isNaN(parseFloat(t1))) {
                tempT1 = parseFloat(t1);
                calT1Display.innerText = `${tempT1.toFixed(3)} s`;
                processCalibrationCalculations();
            }
        });
    }

    if (btnSaveCalibration) {
        btnSaveCalibration.addEventListener('click', () => {
            const result = processCalibrationCalculations();
            if (result) {
                KAPPA = result.kappa;
                I_0 = result.i0;
                localStorage.setItem('cal_kappa', KAPPA);
                localStorage.setItem('cal_i0', I_0);
                alert(t('alertSaved'));
            }
        });
    }
});

function processCalibrationCalculations() {
    if (!tempT0 || !tempT1) return;
    const m_kg = parseFloat(calRodMass.value) / 1000.0;
    const L_m = parseFloat(calRodLength.value) / 100.0;
    const d_m = parseFloat(calRodOffset.value) / 100.0;

    const iRod = (1.0 / 12.0) * m_kg * (L_m ** 2) + m_kg * (d_m ** 2);
    const factor0 = (tempT0 / (2 * Math.PI)) ** 2;
    const factor1 = (tempT1 / (2 * Math.PI)) ** 2;

    const calculatedKappa = iRod / (factor1 - factor0);
    const calculatedI0 = calculatedKappa * factor0;

    if (calResultKappa) calResultKappa.innerText = `${calculatedKappa.toFixed(4)} Nm/rad`;
    if (calResultI0) calResultI0.innerText = `${calculatedI0.toFixed(5)} kg·m²`;

    return { kappa: calculatedKappa, i0: calculatedI0 };
}

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