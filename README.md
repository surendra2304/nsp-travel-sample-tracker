# NSP Travel & Sample Tracker | WhatsApp Editor

A mobile-first, professional text editor application built for field travelers and technicians to track travel routes, distances, and sample counts, and send cleanly formatted messages directly to WhatsApp group **NSP Kms**.

---

## ✨ Features

- **📱 Mobile-First Responsive Design**:
  - Engineered specifically for smartphone screens (Android & iOS).
  - Clean touch targets, no horizontal scroll, and responsive typography.
- **📅 Smart Date Navigation & Masked Input**:
  - Arrow buttons (`◀` and `▶`) to switch days instantly.
  - Manual typing with auto-masking: typing `23` auto-inserts `/` $\rightarrow$ `23/`, typing `10` auto-inserts `/` $\rightarrow$ `23/10/`, and typing `26` completes $\rightarrow$ `23/10/26`.
  - "Today" quick button to return to the current day.
- **⚡ Instant Visibility**:
  - The moment you type a place name and hit Enter, it appears **instantly** in the text editor below.
  - As you type distance (KM), it updates the distance line and running total in real time.
- **🧪 Samples Validation on End**:
  - Samples defaults to blank `-` (`Collected samples   -   `).
  - No leading zero: typing `8` displays `8`, never `08`.
  - If you click **"🏁 End"** without entering the number of samples, the samples box **shakes**, highlights red, and prompts you to enter the number of samples before completing.
- **✏️ Preserves Manual Textarea Edits**:
  - Any edits made directly in the text editor are preserved and not overwritten when adding subsequent places or distances.
- **📲 Direct to WhatsApp (NSP Kms)**:
  - Uses native `whatsapp://send?text=...` deep linking to open the native WhatsApp application directly without opening Chrome tabs.
  - Automatically copies the formatted text to your clipboard simultaneously.
- **🏁 End Route Button**:
  - Finish your route at your final stop (e.g. `Room`) without needing to enter distance for it.
- **🏷️ Quick Select with Custom Add**:
  - Defaults to **🏢 Lab** and **🏠 Room**.
  - Click **"+ Add more"** to add any custom frequent stops that persist in your browser.
- **🔤 Auto-Capitalization**:
  - Automatically capitalizes the first letter of place names live and on submit.
- **📐 Column-Aligned WhatsApp Formatting**:
  - Formatted strictly on 2 lines per stop.
  - Hyphens align into a single vertical column with a small gap past the longest place name (`Kalavapudi modi`).
  - Blank line below the date.
  - Blank line above totals.
  - `Total Distance` and `Collected samples` hyphens and numbers align at the exact same vertical column as the stops above.
- **🧹 Clear Button**:
  - Placed at the far right of the top header.
  - Action buttons cleanly named **"Copy"** and **"WhatsApp"**.
  - No "Step" text for a clean, professional aesthetic.

---

## 🚀 Live Links

- **Live Website**: [https://surendra2304.github.io/nsp-travel-sample-tracker/](https://surendra2304.github.io/nsp-travel-sample-tracker/)
- **1-Click Vercel Deploy**: [Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/surendra2304/nsp-travel-sample-tracker)
- **GitHub Repository**: [https://github.com/surendra2304/nsp-travel-sample-tracker](https://github.com/surendra2304/nsp-travel-sample-tracker)
