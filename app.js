/**
 * NSP Travel & Sample Tracker - Application Logic
 * Clean, centered text editor flow with perfectly aligned WhatsApp formatting.
 */

(function () {
  'use strict';

  // --- Constants & State ---
  const STORAGE_KEY = 'nsp_travel_logs_v2';
  const SETTINGS_KEY = 'nsp_settings_v2';
  const HYPHEN_COLUMN = 36; // Exact spacing column for all hyphens

  let appState = {
    currentDate: getTodayDateString(), // YYYY-MM-DD
    logsByDate: {},
    flowStep: 'PLACE', // 'PLACE' or 'KM'
    pendingPlace: '',
    settings: {
      theme: 'dark'
    }
  };

  // --- Preloaded Demo Data from User Request ---
  const DEMO_DATA = {
    '2026-10-18': {
      dateFormatted: '18-10-2026',
      samples: 12,
      stops: [
        { id: 'd1_1', place: 'Undi', km: 8 },
        { id: 'd1_2', place: 'Lab', km: 8 },
        { id: 'd1_3', place: 'Mourya', km: 6 },
        { id: 'd1_4', place: 'Lab', km: 3 },
        { id: 'd1_5', place: 'Bus stand', km: 6 },
        { id: 'd1_6', place: 'Lab', km: 3 },
        { id: 'd1_7', place: 'Kaikaluru', km: 45 },
        { id: 'd1_8', place: 'Konduru', km: 15 },
        { id: 'd1_9', place: 'Bhujabalapatnam', km: 15 },
        { id: 'd1_10', place: 'Kalavapudi modi', km: 30 },
        { id: 'd1_11', place: 'Bondadamodi', km: 15 },
        { id: 'd1_12', place: 'Lab', km: 16 },
        { id: 'd1_13', place: 'Room', km: 6 }
      ]
    },
    '2026-10-19': {
      dateFormatted: '19-10-2026',
      samples: 5,
      stops: [
        { id: 'd2_1', place: 'Mandavalli', km: 48 },
        { id: 'd2_2', place: 'Varahapatnam', km: 19 },
        { id: 'd2_3', place: 'Kala', km: 28 },
        { id: 'd2_4', place: 'Kailalanka', km: 9 },
        { id: 'd2_5', place: 'Lab', km: 19 },
        { id: 'd2_6', place: 'Room', km: 6 }
      ]
    },
    '2026-10-20': {
      dateFormatted: '20-10-2026',
      samples: 8,
      stops: [
        { id: 'd3_1', place: 'Gude akalanka', km: 49 },
        { id: 'd3_2', place: 'Varahapatnam', km: 39 },
        { id: 'd3_3', place: 'Tadinada', km: 15 },
        { id: 'd3_4', place: 'Kuppanapudi', km: 15 },
        { id: 'd3_5', place: 'Cheruku malli', km: 17 },
        { id: 'd3_6', place: 'Sesali', km: 13 },
        { id: 'd3_7', place: 'Lab', km: 13 },
        { id: 'd3_8', place: 'Room', km: 6 }
      ]
    }
  };

  // --- DOM Elements ---
  const logDateInput = document.getElementById('logDateInput');
  const formattedDateText = document.getElementById('formattedDateText');
  const btnToday = document.getElementById('btnToday');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const btnLoadDemo = document.getElementById('btnLoadDemo');
  const btnHistoryDrawer = document.getElementById('btnHistoryDrawer');
  const historyCount = document.getElementById('historyCount');

  // Center Flow Box
  const centerFlowCard = document.getElementById('centerFlowCard');
  const flowForm = document.getElementById('flowForm');
  const flowInput = document.getElementById('flowInput');
  const flowSubmitBtn = document.getElementById('flowSubmitBtn');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const stepPill = document.getElementById('stepPill');
  const stepHint = document.getElementById('stepHint');
  const placeIcon = document.getElementById('placeIcon');
  const kmIcon = document.getElementById('kmIcon');
  const flowSubActions = document.getElementById('flowSubActions');
  const activePlaceDisplay = document.getElementById('activePlaceDisplay');
  const btnCancelPlace = document.getElementById('btnCancelPlace');
  const quickChips = document.getElementById('quickChips');

  // Samples
  const samplesInput = document.getElementById('samplesInput');
  const btnSamplesDec = document.getElementById('btnSamplesDec');
  const btnSamplesInc = document.getElementById('btnSamplesInc');

  // Editor Area
  const whatsappOutput = document.getElementById('whatsappOutput');
  const btnCopyWhatsapp = document.getElementById('btnCopyWhatsapp');
  const copyBtnText = document.getElementById('copyBtnText');
  const btnShareWhatsapp = document.getElementById('btnShareWhatsapp');
  const totalDistanceDisplay = document.getElementById('totalDistanceDisplay');
  const stopsCount = document.getElementById('stopsCount');
  const btnUndoLast = document.getElementById('btnUndoLast');
  const btnClearAll = document.getElementById('btnClearAll');

  // History Modal & Toast
  const historyModal = document.getElementById('historyModal');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const historyList = document.getElementById('historyList');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // --- Helper Functions ---
  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDisplayDate(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return isoDateStr;
  }

  // --- Storage ---
  function loadFromStorage() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY);
      if (storedLogs) {
        appState.logsByDate = JSON.parse(storedLogs);
      }
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        appState.settings = { ...appState.settings, ...JSON.parse(storedSettings) };
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }

    if (appState.settings.theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.logsByDate));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(appState.settings));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  function getActiveDayData() {
    const dateKey = appState.currentDate;
    if (!appState.logsByDate[dateKey]) {
      appState.logsByDate[dateKey] = {
        dateFormatted: formatDisplayDate(dateKey),
        stops: [],
        samples: ''
      };
    }
    return appState.logsByDate[dateKey];
  }

  // --- Flow UI Controller (The Center Box) ---
  function updateFlowUI() {
    if (appState.flowStep === 'PLACE') {
      centerFlowCard.classList.remove('mode-km');
      stepPill.textContent = 'STEP 1';
      stepHint.textContent = 'Type place name & hit Enter';
      placeIcon.classList.remove('hidden');
      kmIcon.classList.add('hidden');
      flowInput.type = 'text';
      flowInput.placeholder = 'Enter Place Name (e.g. Undi, Lab, Room)...';
      flowInput.value = '';
      flowSubmitBtn.title = 'Next (Enter)';
      btnSubmitText.textContent = 'Next';
      flowSubActions.classList.add('hidden');
    } else {
      centerFlowCard.classList.add('mode-km');
      stepPill.textContent = 'STEP 2';
      stepHint.textContent = `Enter KM for "${appState.pendingPlace}"`;
      placeIcon.classList.add('hidden');
      kmIcon.classList.remove('hidden');
      flowInput.type = 'number';
      flowInput.step = 'any';
      flowInput.placeholder = `KM distance for ${appState.pendingPlace} (e.g. 8)...`;
      flowInput.value = '';
      flowSubmitBtn.title = 'Add Stop (Enter)';
      btnSubmitText.textContent = 'Add Stop';
      flowSubActions.classList.remove('hidden');
      activePlaceDisplay.textContent = appState.pendingPlace;
    }
    flowInput.focus();
  }

  function handleFlowSubmit() {
    const value = flowInput.value.trim();

    if (appState.flowStep === 'PLACE') {
      if (!value) {
        shakeElement(centerFlowCard);
        flowInput.focus();
        return;
      }
      appState.pendingPlace = value;
      appState.flowStep = 'KM';
      updateFlowUI();
    } else if (appState.flowStep === 'KM') {
      if (!value || isNaN(value) || parseFloat(value) < 0) {
        shakeElement(centerFlowCard);
        flowInput.focus();
        return;
      }

      const kmValue = parseFloat(value);
      const activeData = getActiveDayData();

      activeData.stops.push({
        id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        place: appState.pendingPlace,
        km: kmValue
      });

      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';

      saveToStorage();
      renderAll();
      updateFlowUI();
      showToast(`Added: ${activeData.stops[activeData.stops.length - 1].place} (${kmValue} km)`);
    }
  }

  function cancelPlaceStep() {
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    updateFlowUI();
  }

  // --- Exact WhatsApp Formatting Generator ---
  function generateFormattedText() {
    const dayData = getActiveDayData();
    const dateFormatted = dayData.dateFormatted || formatDisplayDate(appState.currentDate);
    const stops = dayData.stops || [];
    const samples = (dayData.samples !== undefined && dayData.samples !== '') ? dayData.samples : '';

    const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);

    let lines = [];

    // 1. Date on top
    lines.push(dateFormatted);

    // 2. An empty line directly below the date
    lines.push('');

    // 3. Each stop on two lines with hyphen and 3 spaces before number
    stops.forEach(stop => {
      lines.push(stop.place);
      const padding = ' '.repeat(HYPHEN_COLUMN);
      lines.push(`${padding}-   ${stop.km}`);
    });

    // 4. An empty line below the data and above the totals
    lines.push('');

    // 5. Total Distance and Collected samples perfectly aligned at HYPHEN_COLUMN
    const label1 = 'Total Distance';
    const label2 = 'Collected samples';

    const pad1 = ' '.repeat(Math.max(1, HYPHEN_COLUMN - label1.length));
    const pad2 = ' '.repeat(Math.max(1, HYPHEN_COLUMN - label2.length));

    lines.push(`${label1}${pad1}-   ${totalKm}`);
    lines.push(`${label2}${pad2}-   ${samples !== '' ? samples : ''}`);

    return lines.join('\n');
  }

  // --- Render All ---
  function renderAll() {
    const dayData = getActiveDayData();
    const stops = dayData.stops || [];

    // Date
    logDateInput.value = appState.currentDate;
    formattedDateText.textContent = dayData.dateFormatted || formatDisplayDate(appState.currentDate);

    // Metrics
    const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);
    totalDistanceDisplay.textContent = totalKm;
    stopsCount.textContent = `${stops.length} stop${stops.length === 1 ? '' : 's'}`;
    samplesInput.value = (dayData.samples !== undefined && dayData.samples !== '') ? dayData.samples : '';

    // Formatted Text
    whatsappOutput.value = generateFormattedText();

    // History count
    historyCount.textContent = Object.keys(appState.logsByDate).length;
  }

  // --- History Drawer ---
  function openHistoryDrawer() {
    historyList.innerHTML = '';
    const dateKeys = Object.keys(appState.logsByDate).sort().reverse();

    if (dateKeys.length === 0) {
      historyList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1.5rem;">No saved days yet.</p>';
    } else {
      dateKeys.forEach(dateKey => {
        const day = appState.logsByDate[dateKey];
        const stops = day.stops || [];
        const totalKm = stops.reduce((acc, s) => acc + (parseFloat(s.km) || 0), 0);
        const isActive = dateKey === appState.currentDate;

        const card = document.createElement('div');
        card.className = `history-card ${isActive ? 'active-day' : ''}`;
        card.innerHTML = `
          <div>
            <div class="history-date">${day.dateFormatted || formatDisplayDate(dateKey)} ${isActive ? '<span style="color:var(--accent-emerald);font-size:0.75rem;">(Active)</span>' : ''}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);">${stops.length} stops | Samples: <strong>${day.samples !== '' && day.samples !== undefined ? day.samples : '0'}</strong></div>
          </div>
          <div class="history-km">${totalKm} KM</div>
        `;
        card.addEventListener('click', () => {
          switchDate(dateKey);
          closeHistoryDrawer();
        });
        historyList.appendChild(card);
      });
    }

    historyModal.classList.remove('hidden');
  }

  function closeHistoryDrawer() {
    historyModal.classList.add('hidden');
  }

  function switchDate(isoDateStr) {
    appState.currentDate = isoDateStr;
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    renderAll();
    updateFlowUI();
  }

  // --- Copy & Share ---
  async function copyToClipboard() {
    const text = whatsappOutput.value;
    if (!text.trim()) {
      showToast('Nothing to copy yet!');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        whatsappOutput.select();
        document.execCommand('copy');
      }

      copyBtnText.textContent = 'Copied!';
      btnCopyWhatsapp.style.filter = 'brightness(1.2)';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy for WhatsApp';
        btnCopyWhatsapp.style.filter = 'none';
      }, 1800);

      showToast('Copied to clipboard! Ready to paste into WhatsApp.');
    } catch (err) {
      whatsappOutput.select();
      document.execCommand('copy');
      showToast('Copied text!');
    }
  }

  function shareToWhatsapp() {
    const text = whatsappOutput.value;
    if (!text.trim()) {
      showToast('Please add places or distance first!');
      return;
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  function loadDemoData() {
    appState.logsByDate = { ...appState.logsByDate, ...DEMO_DATA };
    appState.currentDate = '2026-10-18';
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    saveToStorage();
    renderAll();
    updateFlowUI();
    showToast('Loaded demo: 18-10-2026');
  }

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  function shakeElement(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  // --- Event Listeners ---
  function initEventListeners() {
    flowForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFlowSubmit();
    });

    flowInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFlowSubmit();
      } else if (e.key === 'Escape' && appState.flowStep === 'KM') {
        e.preventDefault();
        cancelPlaceStep();
      }
    });

    btnCancelPlace.addEventListener('click', cancelPlaceStep);

    quickChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const placeName = chip.getAttribute('data-place');
      if (placeName) {
        if (appState.flowStep === 'PLACE') {
          flowInput.value = placeName;
          handleFlowSubmit();
        } else {
          appState.pendingPlace = placeName;
          activePlaceDisplay.textContent = placeName;
          flowInput.placeholder = `KM distance for ${placeName}...`;
          flowInput.focus();
        }
      }
    });

    samplesInput.addEventListener('input', () => {
      const dayData = getActiveDayData();
      const val = samplesInput.value.trim();
      dayData.samples = val === '' ? '' : parseInt(val, 10) || 0;
      saveToStorage();
      whatsappOutput.value = generateFormattedText();
    });

    btnSamplesInc.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = parseInt(dayData.samples, 10) || 0;
      dayData.samples = current + 1;
      samplesInput.value = dayData.samples;
      saveToStorage();
      whatsappOutput.value = generateFormattedText();
    });

    btnSamplesDec.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = parseInt(dayData.samples, 10) || 0;
      if (current > 0) {
        dayData.samples = current - 1;
        samplesInput.value = dayData.samples;
        saveToStorage();
        whatsappOutput.value = generateFormattedText();
      }
    });

    logDateInput.addEventListener('change', (e) => {
      if (e.target.value) switchDate(e.target.value);
    });

    btnToday.addEventListener('click', () => {
      switchDate(getTodayDateString());
      showToast('Switched to Today');
    });

    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('theme-light');
      if (isLight) {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        appState.settings.theme = 'dark';
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        appState.settings.theme = 'light';
      }
      saveToStorage();
    });

    btnUndoLast.addEventListener('click', () => {
      const dayData = getActiveDayData();
      if (!dayData.stops || dayData.stops.length === 0) {
        showToast('No stops to undo.');
        return;
      }
      const popped = dayData.stops.pop();
      saveToStorage();
      renderAll();
      showToast(`Undid: ${popped.place} (${popped.km} km)`);
    });

    btnClearAll.addEventListener('click', () => {
      const dayData = getActiveDayData();
      if (!dayData.stops || dayData.stops.length === 0) {
        showToast('No stops to clear.');
        return;
      }
      if (confirm(`Clear all stops recorded for ${dayData.dateFormatted}?`)) {
        dayData.stops = [];
        saveToStorage();
        renderAll();
        showToast('All stops cleared.');
      }
    });

    btnCopyWhatsapp.addEventListener('click', copyToClipboard);
    btnShareWhatsapp.addEventListener('click', shareToWhatsapp);
    btnLoadDemo.addEventListener('click', loadDemoData);

    btnHistoryDrawer.addEventListener('click', openHistoryDrawer);
    btnCloseHistory.addEventListener('click', closeHistoryDrawer);
    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) closeHistoryDrawer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !historyModal.classList.contains('hidden')) {
        closeHistoryDrawer();
      }
    });
  }

  function init() {
    loadFromStorage();
    initEventListeners();
    renderAll();
    updateFlowUI();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
