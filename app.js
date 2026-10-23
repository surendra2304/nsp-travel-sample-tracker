/**
 * NSP Travel & Sample Tracker - Professional Logic
 * Precise column alignment based on longest place name with a small gap.
 * Includes "End Route" button, clean 0 default for samples, and customizable Quick Select.
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY = 'nsp_travel_logs_v3';
  const CHIPS_KEY = 'nsp_quick_chips_v3';

  // Clean default chips: Only Lab and Room as requested
  const DEFAULT_CHIPS = ['Lab', 'Room'];

  let appState = {
    currentDate: getTodayDateString(),
    logsByDate: {},
    quickChips: [...DEFAULT_CHIPS],
    flowStep: 'PLACE', // 'PLACE' or 'KM'
    pendingPlace: '',
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

  // Center Flow Form
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

  // --- Date Helpers ---
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
        samples: 0 // Default 0 as requested
      };
    }
    // Guarantee samples defaults to 0
    if (appState.logsByDate[dateKey].samples === undefined || appState.logsByDate[dateKey].samples === '') {
      appState.logsByDate[dateKey].samples = 0;
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

      // Allow removing custom chips
      if (!isDefault) {
        const removeSpan = document.createElement('span');
        removeSpan.className = 'chip-remove';
        removeSpan.title = 'Remove chip';
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
      const trimmed = newPlace.trim();
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
      flowInput.placeholder = 'Enter Place Name (e.g. Undi, Lab, Room)...';
      flowInput.value = '';
      flowSubmitBtn.title = 'Next (Enter)';
      btnSubmitText.textContent = 'Next';
      flowSubActions.classList.add('hidden');
      btnEndRoute.innerHTML = '<span>🏁 End</span>';
      btnEndRoute.title = 'Finish route and copy text';
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
      btnEndRoute.innerHTML = '<span>🏁 End (No KM)</span>';
      btnEndRoute.title = `Finish trip at "${appState.pendingPlace}" without entering kilometers`;
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

  // --- End Route Handler ---
  function handleEndRoute() {
    const activeData = getActiveDayData();

    if (appState.flowStep === 'KM' && appState.pendingPlace) {
      // User entered a place name (e.g. Room) and clicked End Route -> No KM needed!
      activeData.stops.push({
        id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        place: appState.pendingPlace,
        km: null // No distance after last place!
      });
      const endedPlace = appState.pendingPlace;
      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';

      saveToStorage();
      renderAll();
      updateFlowUI();
      showToast(`Finished route at ${endedPlace}! Ready to copy.`);
      btnCopyWhatsapp.focus();
      return;
    }

    // If at Step 1 and user typed a place name
    const currentVal = flowInput.value.trim();
    if (currentVal) {
      activeData.stops.push({
        id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        place: currentVal,
        km: null
      });
      flowInput.value = '';
      saveToStorage();
      renderAll();
      updateFlowUI();
      showToast(`Finished route at ${currentVal}! Ready to copy.`);
      btnCopyWhatsapp.focus();
      return;
    }

    // If input is empty, finalize and focus copy button
    if (activeData.stops.length > 0) {
      showToast('Route complete! Ready to copy for WhatsApp.');
      btnCopyWhatsapp.focus();
    } else {
      showToast('Please enter at least one place first.');
      flowInput.focus();
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
    const samples = (dayData.samples !== undefined && dayData.samples !== '') ? dayData.samples : 0;

    // Calculate total kilometers (ignoring null/ended places)
    const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);

    // Dynamic column alignment:
    // Find the longest place name (like "Kalavapudi modi" - 15) or label length (17)
    // Small gap of 3 spaces past the longest word as requested
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

    // 5. Total Distance and Collected samples perfectly aligned in the exact same line/column
    const label1 = 'Total Distance';
    const label2 = 'Collected samples';

    const pad1 = ' '.repeat(Math.max(1, hyphenCol - label1.length));
    const pad2 = ' '.repeat(Math.max(1, hyphenCol - label2.length));

    lines.push(`${label1}${pad1}-   ${totalKm}`);
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
    samplesInput.value = dayData.samples !== undefined ? dayData.samples : 0;

    // Formatted Text in Textarea
    whatsappOutput.value = generateFormattedText();
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

    // Samples stepper & input (default 0)
    samplesInput.addEventListener('input', () => {
      const dayData = getActiveDayData();
      const val = samplesInput.value.trim();
      dayData.samples = val === '' ? 0 : parseInt(val, 10) || 0;
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
        dayData.samples = 0;
        saveToStorage();
        renderAll();
        showToast('All stops cleared.');
      }
    });

    btnCopyWhatsapp.addEventListener('click', copyToClipboard);
    btnShareWhatsapp.addEventListener('click', shareToWhatsapp);
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
