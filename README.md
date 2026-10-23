# NSP Travel & Sample Log | WhatsApp Distance Formatter

A fast, distraction-free travel log web application designed specifically for field workers, lab sample collectors, and daily travelers to track stops, calculate kilometers, and format logs for pasting into WhatsApp.

---

## ✨ Features

- **⚡ Fast Center-Box Keyboard Flow**:
  - Center input box for maximum typing speed.
  - Type Place Name → press `Enter` ↵.
  - Type Distance (KM) → press `Enter` ↵.
  - Automatically loops to the 2nd place, 3rd place, and so on without touching the mouse!
- **📅 Today's Date at the Top**:
  - Automatically defaults to today's date formatted as `DD-MM-YYYY`.
  - Date picker to view or log past and future days.
- **🔢 Auto-Calculated Distance & Sample Tracking**:
  - Automatic calculation of total kilometers.
  - Dedicated stepper & input for `Collected samples`.
- **💬 WhatsApp-Ready Formatted Text**:
  - Always strictly 2 lines per stop (Place on top, distance on the line below).
  - Hyphen placed with **3 spaces** before the number (`-   8`).
  - Blank line separating the stops and the totals.
  - All hyphens vertically aligned across every stop, `Total Distance`, and `Collected samples`:
    ```text
    18-10-2026

    Undi
                                        -   8
    Lab
                                        -   8
    Mourya
                                        -   6
    ...
    Room
                                        -   6

    Total Distance                      -   176
    Collected samples                   -   12
    ```
- **🎛️ Real-Time Formatting Toolbar**:
  - **Layout Toggle**: Switch between **2 Lines** (place on top, `- km` indented below) and **1 Line** (place and `- km` on the same line, column-aligned).
  - **Gap / Indent Slider**: Adjust the spacing live from 2 spaces to 18 spaces.
  - **Digit Alignment Option**: Optional toggle to align numbers by ones/tens/hundreds digits (` 8` vs `176`).
- **📋 One-Click Copy & Direct Share**:
  - **"Copy for WhatsApp"** button copies directly to clipboard with instant confirmation toast.
  - **"WhatsApp"** button opens WhatsApp Web or the WhatsApp mobile app directly.
- **🏷️ Quick Select Chips**:
  - Fast clickable shortcuts for frequently repeated destinations like `Lab`, `Room`, `Bus stand`, etc.
- **✏️ Stop Editing & History Drawer**:
  - Edit or delete any stop inline.
  - Saved history across multiple days stored locally in your browser (`localStorage`).
  - **"Sample Demo"** button preloads the exact examples from October 18, 19, and 20.
- **🌓 Dark & Light Modes**:
  - Sleek modern UI inspired by WhatsApp emerald and modern slate themes.
- **📱 Offline / PWA Support**:
  - Works completely offline in rural field areas without an active internet connection.

---

## 🚀 How to Run

### Option 1: Direct in Browser
Simply double-click `index.html` or drag it into any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Web Server
You can start a local server using Python or Node:

```powershell
# Using Python
python -m http.server 8080

# Or using Node / npx
npx serve .
```
Then open `http://localhost:8080` in your browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Enter` ↵ | Submit current step (Place → KM → Next Place) |
| `Escape` | Cancel KM step and return to editing place / Close modal |
