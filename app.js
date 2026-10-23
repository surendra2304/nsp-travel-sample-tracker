/**
 * NSP Travel & Sample Tracker - Professional Mobile-First Logic
 * - Instant visibility: Place & KM update in copy field immediately on Enter
 * - Samples default blank with -
 * - Shakes samples box if End clicked without entering samples
 * - Direct native WhatsApp deep link (whatsapp://send) for NSP Kms
 * - Fully responsive for mobile
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'nsp_travel_logs_v4';
  const CHIPS_KEY = 'nsp_quick_chips_v4';
  const DEFAULT_CHIPS = ['Lab', 'Room'];

  let appState = {
    currentDate: getTodayDateString(),
    logsByDate: {},
    quickChips: [...DEFAULT_CHIPS],
    flowStep: 'PLACE', // 'PLACE' or 'KM'
    pendingPlace: '',
    activeStopIndex: null,
    settings: {
      theme: 'dark'
    }
  };

  // --- DOM Elements ---
  const logDateInput = document.getElementById('logDateInput');
  const formattedDateText = document.getElementById('formattedDateText');
  const btnToday = document.getElementById('btnToday');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const btnClearAll = document.getElementById('btnClearAll');

  // Center Flow
  const centerFlowCard = document.getElementById('centerFlowCard');
  const flowForm = document.getElementById('flowForm');
  const flowInput = document.getElementById('flowInput');
  const flowSubmitBtn = document.getElementById('flowSubmitBtn');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnEndRoute = document.getElementById('btnEndRoute');
  const stepPill = document.getElementById('stepPill');
  const stepHint = document.getElementById('stepHint');
  const placeIcon = document.getElementById('placeIcon');
  const kmIcon = document.getElementById('kmIcon');
  const flowSubActions = document.getElementById('flowSubActions');
  const activePlaceDisplay = document.getElementById('activePlaceDisplay');
  const btnCancelPlace = document.getElementById('btnCancelPlace');

  // Quick Chips & Samples
  const quickChipsList = document.getElementById('quickChipsList');
  const btnAddChip = document.getElementById('btnAddChip');
  const samplesWrapper = document.getElementById('samplesWrapper');
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

  // Toast
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

  function capitalizeFirst(str) {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // --- Storage ---
  function loadFromStorage() {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY);
      if (storedLogs) {
        appState.logsByDate = JSON.parse(storedLogs);
      }
      const storedChips = localStorage.getItem(CHIPS_KEY);
      if (storedChips) {
        appState.quickChips = JSON.parse(storedChips);
      } else {
        appState.quickChips = [...DEFAULT_CHIPS];
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
      localStorage.setItem(CHIPS_KEY, JSON.stringify(appState.quickChips));
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
        samples: '' // Default blank as requested
      };
    }
    return appState.logsByDate[dateKey];
  }

  // --- Quick Chips Renderer ---
  function renderQuickChips() {
    quickChipsList.innerHTML = '';
    appState.quickChips.forEach((chipName) => {
      const isDefault = DEFAULT_CHIPS.includes(chipName);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('data-place', chipName);

      const icon = chipName.toLowerCase().includes('lab') ? '🏢 ' : (chipName.toLowerCase().includes('room') ? '🏠 ' : '📍 ');
      btn.innerHTML = `<span>${icon}${escapeHtml(chipName)}</span>`;

      if (!isDefault) {
        const removeSpan = document.createElement('span');
        removeSpan.className = 'chip-remove';
        removeSpan.title = 'Remove';
        removeSpan.textContent = '✕';
        removeSpan.addEventListener('click', (ev) => {
          ev.stopPropagation();
          appState.quickChips = appState.quickChips.filter(c => c !== chipName);
          saveToStorage();
          renderQuickChips();
        });
        btn.appendChild(removeSpan);
      }

      quickChipsList.appendChild(btn);
    });
  }

  function handleAddCustomChip() {
    const newPlace = prompt('Enter place name to add to Quick Select:');
    if (newPlace && newPlace.trim()) {
      const trimmed = capitalizeFirst(newPlace.trim());
      if (!appState.quickChips.includes(trimmed)) {
        appState.quickChips.push(trimmed);
        saveToStorage();
        renderQuickChips();
        showToast(`Added "${trimmed}" to Quick Select`);
      }
    }
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
      flowInput.placeholder = 'Enter Place Name (e.g. Undi, Lab)...';
      flowInput.value = '';
      flowSubmitBtn.title = 'Next (Enter)';
      btnSubmitText.textContent = 'Next ↵';
      flowSubActions.classList.add('hidden');
      btnEndRoute.innerHTML = '<span>🏁 End</span>';
      btnEndRoute.title = 'Finish route and open WhatsApp';
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
      flowSubmitBtn.title = 'Add Distance (Enter)';
      btnSubmitText.textContent = 'Add KM ↵';
      flowSubActions.classList.remove('hidden');
      activePlaceDisplay.textContent = appState.pendingPlace;
      btnEndRoute.innerHTML = '<span>🏁 End (No KM)</span>';
      btnEndRoute.title = `Finish route at "${appState.pendingPlace}" without entering distance`;
    }
    flowInput.focus();
  }

  // Submit Handler: Place & KM update copy field INSTANTLY
  function handleFlowSubmit() {
    const value = flowInput.value.trim();

    if (appState.flowStep === 'PLACE') {
      if (!value) {
        shakeElement(centerFlowCard);
        flowInput.focus();
        return;
      }

      const placeName = capitalizeFirst(value);
      const activeData = getActiveDayData();

      // INSTANT VISIBILITY: Place name immediately added to copy field!
      activeData.stops.push({
        id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        place: placeName,
        km: '' // KM waiting to be typed
      });

      appState.activeStopIndex = activeData.stops.length - 1;
      appState.pendingPlace = placeName;
      appState.flowStep = 'KM';

      saveToStorage();
      renderAll(); // Shows place name immediately in textarea!
      updateFlowUI();
    } else if (appState.flowStep === 'KM') {
      if (!value || isNaN(value) || parseFloat(value) < 0) {
        shakeElement(centerFlowCard);
        flowInput.focus();
        return;
      }

      const kmValue = parseFloat(value);
      const activeData = getActiveDayData();

      // Assign KM to the active stop immediately
      if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex]) {
        activeData.stops[appState.activeStopIndex].km = kmValue;
      } else {
        activeData.stops.push({
          id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          place: appState.pendingPlace,
          km: kmValue
        });
      }

      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;

      saveToStorage();
      renderAll(); // KM line and updated total distance shown instantly!
      updateFlowUI();
      showToast(`Added: ${kmValue} km`);
    }
  }

  // --- End Route Handler ---
  function handleEndRoute() {
    const activeData = getActiveDayData();

    // 1. VALIDATION: Check if samples is entered. If blank, shake samples card and prompt!
    const samplesVal = samplesInput.value.trim();
    if (samplesVal === '' && (activeData.samples === '' || activeData.samples === undefined || activeData.samples === null)) {
      shakeElement(samplesWrapper);
      samplesWrapper.classList.add('error-highlight');
      setTimeout(() => {
        samplesWrapper.classList.remove('error-highlight');
      }, 1500);
      samplesInput.focus();
      showToast('⚠️ Please enter number of collected samples before ending!');
      return; // Do not complete until samples entered!
    }

    // 2. Finalize any pending place without requiring KM
    if (appState.flowStep === 'KM' && appState.pendingPlace) {
      if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex]) {
        activeData.stops[appState.activeStopIndex].km = null; // No KM needed for last place
      }
      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;
    } else {
      const currentVal = flowInput.value.trim();
      if (currentVal) {
        activeData.stops.push({
          id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          place: capitalizeFirst(currentVal),
          km: null
        });
        flowInput.value = '';
      }
    }

    saveToStorage();
    renderAll();
    updateFlowUI();

    // 3. Automatically copy to clipboard & trigger direct native WhatsApp link for NSP Kms!
    copyToClipboard();
    openDirectWhatsApp();
  }

  function cancelPlaceStep() {
    const activeData = getActiveDayData();
    // If we cancel KM step, remove the pending place from stops if it had no KM
    if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex] && activeData.stops[appState.activeStopIndex].km === '') {
      activeData.stops.splice(appState.activeStopIndex, 1);
    }
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    appState.activeStopIndex = null;
    saveToStorage();
    renderAll();
    updateFlowUI();
  }

  // --- Exact WhatsApp Formatting Generator ---
  function generateFormattedText() {
    const dayData = getActiveDayData();
    const dateFormatted = dayData.dateFormatted || formatDisplayDate(appState.currentDate);
    const stops = dayData.stops || [];
    const samples = (dayData.samples !== undefined && dayData.samples !== null && dayData.samples !== '') ? dayData.samples : '';

    // Calculate total kilometers
    const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);

    // Dynamic column alignment:
    // Aligns after longest place name (like "Kalavapudi modi" - 15) with a small gap of 3 spaces
    const longestWord = Math.max(
      15, // minimum baseline (Kalavapudi modi / Bhujabalapatnam)
      'Total Distance'.length, // 14
      'Collected samples'.length, // 17
      ...stops.map(s => (s.place ? s.place.length : 0))
    );
    const hyphenCol = longestWord + 3;

    let lines = [];

    // 1. Date on top
    lines.push(dateFormatted);

    // 2. An empty line directly below the date
    lines.push('');

    // 3. Each stop on two lines with hyphen and 3 spaces before number
    stops.forEach(stop => {
      lines.push(stop.place);
      if (stop.km !== null && stop.km !== undefined && stop.km !== '') {
        const padding = ' '.repeat(hyphenCol);
        lines.push(`${padding}-   ${stop.km}`);
      }
    });

    // 4. An empty line below the data and above the totals
    lines.push('');

    // 5. Total Distance and Collected samples aligned at exact same column line
    const label1 = 'Total Distance';
    const label2 = 'Collected samples';

    const pad1 = ' '.repeat(Math.max(1, hyphenCol - label1.length));
    const pad2 = ' '.repeat(Math.max(1, hyphenCol - label2.length));

    lines.push(`${label1}${pad1}-   ${totalKm}`);
    // Left blank as default with - as requested
    lines.push(`${label2}${pad2}-   ${samples}`);

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

    // Samples: default blank with placeholder '-'
    samplesInput.value = (dayData.samples !== undefined && dayData.samples !== null) ? dayData.samples : '';

    // Formatted Text in Textarea
    whatsappOutput.value = generateFormattedText();
  }

  function switchDate(isoDateStr) {
    appState.currentDate = isoDateStr;
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    appState.activeStopIndex = null;
    renderAll();
    updateFlowUI();
  }

  // --- Copy to Clipboard ---
  async function copyToClipboard() {
    const text = whatsappOutput.value;
    if (!text.trim()) {
      showToast('Nothing to copy yet!');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (document.execCommand) {
        whatsappOutput.select();
        document.execCommand('copy');
      }

      copyBtnText.textContent = 'Copied!';
      btnCopyWhatsapp.style.filter = 'brightness(1.2)';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy for WhatsApp';
        btnCopyWhatsapp.style.filter = 'none';
      }, 1800);

      showToast('Copied to clipboard! Ready to paste into NSP Kms.');
    } catch (err) {
      if (document.execCommand) {
        whatsappOutput.select();
        document.execCommand('copy');
      }
      showToast('Copied text!');
    }
  }

  // --- Direct WhatsApp Native Opener (No Chrome tab opening) ---
  function openDirectWhatsApp() {
    const text = whatsappOutput.value;
    if (!text.trim()) {
      showToast('Please add places first!');
      return;
    }

    const encoded = encodeURIComponent(text);
    // whatsapp:// URI scheme launches the native WhatsApp application directly on mobile/desktop without opening Chrome
    const nativeWhatsAppUri = `whatsapp://send?text=${encoded}`;
    
    // Trigger native app directly
    window.location.href = nativeWhatsAppUri;
    showToast('Opening WhatsApp for group NSP Kms...');
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
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

    // Auto-capitalize first word live while typing
    flowInput.addEventListener('input', () => {
      if (appState.flowStep === 'PLACE' && flowInput.value.length > 0) {
        const val = flowInput.value;
        const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
        if (val !== capitalized) {
          const start = flowInput.selectionStart;
          const end = flowInput.selectionEnd;
          flowInput.value = capitalized;
          flowInput.setSelectionRange(start, end);
        }
      } else if (appState.flowStep === 'KM' && appState.activeStopIndex !== null) {
        // While typing KM, update distance live in the copy field!
        const val = flowInput.value.trim();
        const activeData = getActiveDayData();
        if (val && !isNaN(val)) {
          activeData.stops[appState.activeStopIndex].km = parseFloat(val);
          renderAll();
        }
      }
    });

    btnCancelPlace.addEventListener('click', cancelPlaceStep);
    btnEndRoute.addEventListener('click', handleEndRoute);

    // Quick Chips delegation
    quickChipsList.addEventListener('click', (e) => {
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

    btnAddChip.addEventListener('click', handleAddCustomChip);

    // Samples input (default blank)
    samplesInput.addEventListener('input', () => {
      const dayData = getActiveDayData();
      const val = samplesInput.value.trim();
      dayData.samples = val === '' ? '' : parseInt(val, 10);
      saveToStorage();
      whatsappOutput.value = generateFormattedText();
    });

    btnSamplesInc.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = dayData.samples === '' ? 0 : (parseInt(dayData.samples, 10) || 0);
      dayData.samples = current + 1;
      samplesInput.value = dayData.samples;
      saveToStorage();
      whatsappOutput.value = generateFormattedText();
    });

    btnSamplesDec.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = dayData.samples === '' ? 0 : (parseInt(dayData.samples, 10) || 0);
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
      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;
      saveToStorage();
      renderAll();
      updateFlowUI();
      showToast(`Undid: ${popped.place}`);
    });

    btnClearAll.addEventListener('click', () => {
      const dayData = getActiveDayData();
      if (!dayData.stops || dayData.stops.length === 0) {
        showToast('Already clear.');
        return;
      }
      if (confirm(`Clear all stops recorded for ${dayData.dateFormatted}?`)) {
        dayData.stops = [];
        dayData.samples = '';
        appState.flowStep = 'PLACE';
        appState.pendingPlace = '';
        appState.activeStopIndex = null;
        saveToStorage();
        renderAll();
        updateFlowUI();
        showToast('All stops cleared.');
      }
    });

    btnCopyWhatsapp.addEventListener('click', copyToClipboard);
    btnShareWhatsapp.addEventListener('click', openDirectWhatsApp);
  }

  function init() {
    loadFromStorage();
    initEventListeners();
    renderQuickChips();
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
