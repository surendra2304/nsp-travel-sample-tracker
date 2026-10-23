# NSP Travel & Sample Tracker | WhatsApp Editor

A mobile-first, professional text editor website built for field travelers and technicians to track places, distances, and sample counts, and copy formatted messages directly into WhatsApp.

---

## ✨ Features

- **📱 Mobile-First Responsive Design**:
  - Optimized for smartphone screens (Android & iOS).
  - Clean touch targets, no horizontal scroll, perfectly sized typography.
- **⚡ Instant Visibility**:
  - The moment you type a place name and hit Enter, it appears **instantly** in the text editor below.
  - As you enter distance (KM), it updates the distance line and running total in real time.
- **🧪 Samples Validation on End**:
  - Samples defaults to blank `-` (`Collected samples   -   `).
  - If you click **"🏁 End"** without entering the number of samples, the samples box **shakes**, highlights red, and prompts you to enter the number of samples before completing.
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
  - Hyphens align vertically with a small gap past the longest place name (`Kalavapudi modi`).
  - Blank line below the date.
  - Blank line above totals.

---

## 🚀 Live Links

- **Live Website**: [https://surendra2304.github.io/nsp-kms/](https://surendra2304.github.io/nsp-kms/)
- **1-Click Vercel Deploy**: [Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/surendra2304/nsp-kms)
- **GitHub Repository**: [https://github.com/surendra2304/nsp-kms](https://github.com/surendra2304/nsp-kms)
