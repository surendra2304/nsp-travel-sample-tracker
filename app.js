/**
 * NSP Travel & Sample Tracker - Professional Mobile-First Logic
 * - Exact WhatsApp column alignment for stops, Total Distance, and Samples
 * - Arrow navigation for dates + manual masked date input (e.g. 23/10/26)
 * - Zero stripping in samples field (no "08")
 * - Sample count validation before End (shakes and prompts if empty)
 * - Instant visibility in copy textarea as place & km are typed
 * - Preserves manual text editor changes (won't get overwritten)
 * - Clean professional UI without "Step" text
 * - Direct native WhatsApp deep link (whatsapp://send?text=...)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'nsp_travel_logs_v5';
  const CHIPS_KEY = 'nsp_quick_chips_v5';
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
  const manualDateInput = document.getElementById('manualDateInput');
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnToday = document.getElementById('btnToday');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const btnClearAll = document.getElementById('btnClearAll');

  // Center Flow Card
  const centerFlowCard = document.getElementById('centerFlowCard');
  const flowPromptText = document.getElementById('flowPromptText');
  const flowForm = document.getElementById('flowForm');
  const flowInput = document.getElementById('flowInput');
  const flowSubmitBtn = document.getElementById('flowSubmitBtn');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnEndRoute = document.getElementById('btnEndRoute');
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

  // --- Date Helper Utilities ---
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
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return isoDateStr;
  }

  function changeDateByDays(delta) {
    const parts = appState.currentDate.split('-').map(Number);
    if (parts.length !== 3) return;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + delta);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    switchDate(`${yyyy}-${mm}-${dd}`);
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
        samples: '', // Default blank
        isCustom: false,
        customText: ''
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

  // --- Flow UI Controller (Center Box) ---
  function updateFlowUI() {
    if (appState.flowStep === 'PLACE') {
      centerFlowCard.classList.remove('mode-km');
      flowPromptText.textContent = 'Enter Destination / Place';
      placeIcon.classList.remove('hidden');
      kmIcon.classList.add('hidden');
      flowInput.type = 'text';
      flowInput.placeholder = 'Enter place name (e.g. Undi, Lab, Room)...';
      flowInput.value = '';
      flowSubmitBtn.title = 'Next';
      btnSubmitText.textContent = 'Next';
      flowSubActions.classList.add('hidden');
      btnEndRoute.innerHTML = '<span>🏁 End</span>';
      btnEndRoute.title = 'Finish route and open WhatsApp';
    } else {
      centerFlowCard.classList.add('mode-km');
      flowPromptText.textContent = `Distance in KM for ${appState.pendingPlace}`;
      placeIcon.classList.add('hidden');
      kmIcon.classList.remove('hidden');
      flowInput.type = 'number';
      flowInput.step = 'any';
      flowInput.placeholder = `KM distance for ${appState.pendingPlace} (e.g. 15)...`;
      flowInput.value = '';
      flowSubmitBtn.title = 'Add KM';
      btnSubmitText.textContent = 'Add KM';
      flowSubActions.classList.remove('hidden');
      activePlaceDisplay.textContent = appState.pendingPlace;
      btnEndRoute.innerHTML = '<span>🏁 End (No KM)</span>';
      btnEndRoute.title = `Finish route at "${appState.pendingPlace}" without distance`;
    }
    flowInput.focus();
  }

  // --- Formatting Generator (Exact WhatsApp Alignment) ---
  function generateFormattedText(dayData) {
    const dateFormatted = dayData.dateFormatted || formatDisplayDate(appState.currentDate);
    const stops = dayData.stops || [];
    const samples = (dayData.samples !== undefined && dayData.samples !== null && dayData.samples !== '') 
      ? dayData.samples 
      : '';

    // Calculate total kilometers
    const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);

    // Calculate dynamic column alignment:
    // Longest label among:
    // 1) "Collected samples" (17 chars)
    // 2) "Total Distance" (14 chars)
    // 3) Any entered place name (e.g. "Kalavapudi modi" - 15 chars)
    const longestLabelLen = Math.max(
      17, // "Collected samples" length
      ...stops.map(s => (s.place ? s.place.length : 0))
    );

    // Position hyphen 3 spaces past the longest word (e.g. col 20)
    const hyphenCol = longestLabelLen + 3;

    let lines = [];

    // 1. Date on top
    lines.push(dateFormatted);

    // 2. An empty line directly below the date
    lines.push('');

    // 3. Each stop on two lines with hyphen and 3 spaces before number
    stops.forEach(stop => {
      if (stop.place) {
        lines.push(stop.place);
        if (stop.km !== null && stop.km !== undefined && stop.km !== '') {
          const padding = ' '.repeat(hyphenCol);
          lines.push(`${padding}-   ${stop.km}`);
        }
      }
    });

    // 4. An empty line below the data and above the totals
    lines.push('');

    // 5. Total Distance and Collected samples aligned at exact same column line
    const labelTotal = 'Total Distance';
    const labelSamples = 'Collected samples';

    const padTotal = ' '.repeat(Math.max(1, hyphenCol - labelTotal.length));
    const padSamples = ' '.repeat(Math.max(1, hyphenCol - labelSamples.length));

    lines.push(`${labelTotal}${padTotal}-   ${totalKm}`);
    lines.push(`${labelSamples}${padSamples}-   ${samples}`);

    return lines.join('\n');
  }

  // --- Manual Text Editor Preservation ---
  function updateStatsFromText(text) {
    // Extract numbers after "-   "
    const lines = text.split('\n');
    let totalKm = 0;
    let stopCount = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Total Distance')) {
        const match = line.match(/-\s+(\d+(?:\.\d+)?)/);
        if (match) totalKm = parseFloat(match[1]);
      } else if (!trimmed.startsWith('Collected samples') && /-\s+(\d+(?:\.\d+)?)/.test(line)) {
        stopCount++;
      }
    });

    totalDistanceDisplay.textContent = totalKm;
    stopsCount.textContent = `${stopCount} stop${stopCount === 1 ? '' : 's'}`;
  }

  function appendStopToCustom(dayData, place, km) {
    let text = dayData.customText || '';
    const totalMatch = text.search(/\n\s*Total Distance/i);
    const hyphenCol = Math.max(20, (place || '').length + 3);

    let snippet = `\n${place}`;
    if (km !== null && km !== undefined && km !== '') {
      snippet += `\n${' '.repeat(hyphenCol)}-   ${km}`;
    }

    if (totalMatch !== -1) {
      const before = text.slice(0, totalMatch).replace(/\n+$/, '');
      const after = text.slice(totalMatch);
      text = before + snippet + '\n\n' + after.replace(/^\n+/, '');
    } else {
      text = text.trimEnd() + snippet;
    }

    dayData.customText = text;
    whatsappOutput.value = text;
    updateStatsFromText(text);
  }

  function attachKmToLastStopInCustom(dayData, km) {
    let text = dayData.customText || '';
    const totalMatch = text.search(/\n\s*Total Distance/i);
    const hyphenCol = Math.max(20, (appState.pendingPlace || '').length + 3);
    const kmLine = `\n${' '.repeat(hyphenCol)}-   ${km}`;

    if (totalMatch !== -1) {
      const before = text.slice(0, totalMatch).replace(/\n+$/, '');
      const after = text.slice(totalMatch);
      text = before + kmLine + '\n\n' + after.replace(/^\n+/, '');
    } else {
      text = text.trimEnd() + kmLine;
    }

    dayData.customText = text;
    whatsappOutput.value = text;
    updateStatsFromText(text);
  }

  // --- Render All ---
  function renderAll(updateDateInput = true) {
    const dayData = getActiveDayData();
    const stops = dayData.stops || [];

    // Date
    if (updateDateInput) {
      manualDateInput.value = dayData.dateFormatted || formatDisplayDate(appState.currentDate);
    }

    // Samples input: blank default, zero stripped
    samplesInput.value = (dayData.samples !== undefined && dayData.samples !== null) ? dayData.samples : '';

    // Output Textarea: preserve manual edits if user edited it
    if (dayData.isCustom && dayData.customText) {
      whatsappOutput.value = dayData.customText;
      updateStatsFromText(dayData.customText);
    } else {
      const formatted = generateFormattedText(dayData);
      whatsappOutput.value = formatted;
      
      const totalKm = stops.reduce((acc, stop) => acc + (parseFloat(stop.km) || 0), 0);
      totalDistanceDisplay.textContent = totalKm;
      stopsCount.textContent = `${stops.length} stop${stops.length === 1 ? '' : 's'}`;
    }
  }

  function switchDate(isoDateStr, updateInput = true) {
    appState.currentDate = isoDateStr;
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    appState.activeStopIndex = null;
    const dayData = getActiveDayData();
    dayData.dateFormatted = formatDisplayDate(isoDateStr);
    saveToStorage();
    renderAll(updateInput);
    updateFlowUI();
  }

  // --- Flow Submit Handler ---
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

      // Add stop with pending KM
      activeData.stops.push({
        id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        place: placeName,
        km: ''
      });

      appState.activeStopIndex = activeData.stops.length - 1;
      appState.pendingPlace = placeName;
      appState.flowStep = 'KM';

      if (activeData.isCustom) {
        appendStopToCustom(activeData, placeName, '');
      }

      saveToStorage();
      renderAll(false);
      updateFlowUI();
    } else if (appState.flowStep === 'KM') {
      if (!value || isNaN(value) || parseFloat(value) < 0) {
        shakeElement(centerFlowCard);
        flowInput.focus();
        return;
      }

      const kmValue = parseFloat(value);
      const activeData = getActiveDayData();

      if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex]) {
        activeData.stops[appState.activeStopIndex].km = kmValue;
      } else {
        activeData.stops.push({
          id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          place: appState.pendingPlace,
          km: kmValue
        });
      }

      if (activeData.isCustom) {
        attachKmToLastStopInCustom(activeData, kmValue);
      }

      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;

      saveToStorage();
      renderAll(false);
      updateFlowUI();
      showToast(`Added: ${kmValue} km`);
    }
  }

  // --- End Route Handler ---
  function handleEndRoute() {
    const activeData = getActiveDayData();

    // 1. VALIDATION: Samples must not be blank
    const samplesVal = samplesInput.value.trim();
    if (samplesVal === '' && (activeData.samples === '' || activeData.samples === undefined || activeData.samples === null)) {
      shakeElement(samplesWrapper);
      samplesWrapper.classList.add('error-highlight');
      setTimeout(() => {
        samplesWrapper.classList.remove('error-highlight');
      }, 1500);
      samplesInput.focus();
      showToast('⚠️ Please enter number of collected samples before ending!');
      return;
    }

    // 2. Finalize pending place without requiring KM
    if (appState.flowStep === 'KM' && appState.pendingPlace) {
      if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex]) {
        activeData.stops[appState.activeStopIndex].km = null;
      }
      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;
    } else {
      const currentVal = flowInput.value.trim();
      if (currentVal) {
        const placeName = capitalizeFirst(currentVal);
        activeData.stops.push({
          id: 'stop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          place: placeName,
          km: null
        });
        if (activeData.isCustom) {
          appendStopToCustom(activeData, placeName, null);
        }
        flowInput.value = '';
      }
    }

    saveToStorage();
    renderAll(false);
    updateFlowUI();

    // 3. Automatically copy to clipboard & trigger direct native WhatsApp link for NSP Kms!
    copyToClipboard();
    openDirectWhatsApp();
  }

  function cancelPlaceStep() {
    const activeData = getActiveDayData();
    if (appState.activeStopIndex !== null && activeData.stops[appState.activeStopIndex] && activeData.stops[appState.activeStopIndex].km === '') {
      activeData.stops.splice(appState.activeStopIndex, 1);
    }
    appState.flowStep = 'PLACE';
    appState.pendingPlace = '';
    appState.activeStopIndex = null;
    saveToStorage();
    renderAll(false);
    updateFlowUI();
  }

  // --- Direct WhatsApp Native Opener (No Chrome tab opening) ---
  function openDirectWhatsApp() {
    const text = whatsappOutput.value;
    if (!text.trim()) {
      showToast('Please add places first!');
      return;
    }

    const encoded = encodeURIComponent(text);
    // Direct native WhatsApp deep link scheme
    const nativeWhatsAppUri = `whatsapp://send?text=${encoded}`;
    window.location.href = nativeWhatsAppUri;
    showToast('Opening WhatsApp for group NSP Kms...');
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
        copyBtnText.textContent = 'Copy';
        btnCopyWhatsapp.style.filter = 'none';
      }, 1600);

      showToast('Copied to clipboard! Ready to paste into NSP Kms.');
    } catch (err) {
      if (document.execCommand) {
        whatsappOutput.select();
        document.execCommand('copy');
      }
      showToast('Copied text!');
    }
  }

  // --- Toast & Animation Helpers ---
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

  // --- Event Listeners Initialization ---
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

    // Auto-capitalize first word live while typing place name
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
          renderAll(false);
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
          flowPromptText.textContent = `Distance in KM for ${placeName}`;
          flowInput.placeholder = `KM distance for ${placeName}...`;
          flowInput.focus();
        }
      }
    });

    btnAddChip.addEventListener('click', handleAddCustomChip);

    // Samples input (default blank, zero stripped on typing)
    samplesInput.addEventListener('input', () => {
      let val = samplesInput.value.replace(/\D/g, '');
      // Strip leading zeros (typing 8 doesn't show 08)
      if (val.length > 1 && val.startsWith('0')) {
        val = val.replace(/^0+/, '') || '0';
      }
      samplesInput.value = val;

      const dayData = getActiveDayData();
      dayData.samples = val;
      if (dayData.isCustom && dayData.customText) {
        dayData.customText = dayData.customText.replace(
          /(Collected samples\s*-\s*).*$/m,
          (m, p1) => p1 + val
        );
      }
      saveToStorage();
      renderAll(false);
    });

    btnSamplesInc.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = dayData.samples === '' ? 0 : (parseInt(dayData.samples, 10) || 0);
      dayData.samples = current + 1;
      samplesInput.value = dayData.samples;
      saveToStorage();
      renderAll(false);
    });

    btnSamplesDec.addEventListener('click', () => {
      const dayData = getActiveDayData();
      const current = dayData.samples === '' ? 0 : (parseInt(dayData.samples, 10) || 0);
      if (current > 0) {
        dayData.samples = current - 1;
        samplesInput.value = dayData.samples;
        saveToStorage();
        renderAll(false);
      }
    });

    // Date navigation: Previous and Next arrows
    btnPrevDay.addEventListener('click', () => {
      changeDateByDays(-1);
      showToast('Switched to Previous Day');
    });

    btnNextDay.addEventListener('click', () => {
      changeDateByDays(1);
      showToast('Switched to Next Day');
    });

    btnToday.addEventListener('click', () => {
      switchDate(getTodayDateString());
      showToast('Switched to Today');
    });

    // Manual date input with automatic "/" slashes insertion (e.g. 23 -> 23/, 10 -> 23/10/, 26 -> 23/10/26)
    manualDateInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const val = manualDateInput.value;
        if (val.endsWith('/')) {
          e.preventDefault();
          manualDateInput.value = val.slice(0, -2);
          manualDateInput.dispatchEvent(new Event('input'));
        }
      }
    });

    manualDateInput.addEventListener('input', (e) => {
      let digits = manualDateInput.value.replace(/\D/g, '');
      if (digits.length > 8) digits = digits.slice(0, 8);

      let formatted = '';
      if (digits.length > 0) {
        formatted = digits.slice(0, 2);
        if (digits.length >= 2) {
          formatted += '/';
          if (digits.length > 2) {
            formatted += digits.slice(2, 4);
            if (digits.length >= 4) {
              formatted += '/';
              if (digits.length > 4) {
                formatted += digits.slice(4, 8);
              }
            }
          }
        }
      }
      manualDateInput.value = formatted;

      // When full date is entered (6 digits: DDMMYY or 8 digits: DDMMYYYY)
      if (digits.length === 6 || digits.length === 8) {
        const d = parseInt(digits.slice(0, 2), 10);
        const m = parseInt(digits.slice(2, 4), 10);
        let y = parseInt(digits.slice(4), 10);
        if (digits.length === 6) {
          y = y < 100 ? 2000 + y : y;
        }
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2099) {
          const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (isoDate !== appState.currentDate) {
            switchDate(isoDate, false);
          }
        }
      }
    });

    // Editor textarea input: Preserve user's manual edits
    whatsappOutput.addEventListener('input', () => {
      const dayData = getActiveDayData();
      dayData.isCustom = true;
      dayData.customText = whatsappOutput.value;
      saveToStorage();
      updateStatsFromText(whatsappOutput.value);
    });

    // Action buttons
    btnCopyWhatsapp.addEventListener('click', copyToClipboard);
    btnShareWhatsapp.addEventListener('click', openDirectWhatsApp);

    // Theme toggle
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

    // Undo Last Stop
    btnUndoLast.addEventListener('click', () => {
      const dayData = getActiveDayData();
      if (!dayData.stops || dayData.stops.length === 0) {
        showToast('No stops to undo.');
        return;
      }
      const popped = dayData.stops.pop();
      dayData.isCustom = false;
      dayData.customText = '';
      appState.flowStep = 'PLACE';
      appState.pendingPlace = '';
      appState.activeStopIndex = null;
      saveToStorage();
      renderAll(false);
      updateFlowUI();
      showToast(`Undid: ${popped.place}`);
    });

    // Clear All (Far Right)
    btnClearAll.addEventListener('click', () => {
      const dayData = getActiveDayData();
      if ((!dayData.stops || dayData.stops.length === 0) && !dayData.isCustom && !dayData.samples) {
        showToast('Already clear.');
        return;
      }
      if (confirm(`Clear all stops and custom edits for ${dayData.dateFormatted}?`)) {
        dayData.stops = [];
        dayData.samples = '';
        dayData.isCustom = false;
        dayData.customText = '';
        appState.flowStep = 'PLACE';
        appState.pendingPlace = '';
        appState.activeStopIndex = null;
        saveToStorage();
        renderAll(false);
        updateFlowUI();
        showToast('All stops cleared.');
      }
    });
  }

  function init() {
    loadFromStorage();
    initEventListeners();
    renderQuickChips();
    renderAll(true);
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
