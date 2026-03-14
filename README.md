# 📋 SD Paste Generation Data

Extension for **Automatic1111 Stable Diffusion WebUI** that replicates the "Paste Generation Data" functionality from tensor.art — allowing you to copy image metadata from CivitAI and automatically apply all parameters.

---

## ✨ Features

- Parses the full A1111/CivitAI standard format:
  - Positive and negative prompt
  - Steps, CFG Scale, Sampler, Seed
  - Size (Width × Height)
  - HiRes Fix (upscale factor, upscaler, denoising strength)
- Works on both **txt2img** and **img2img** tabs
- **Floating button 📋** always visible in the corner
- **Quick access**: `Ctrl + Shift + V`
- Panel integrated inside each tab (tensor.art style)

---

## 🚀 Installation

### Method 1 — From A1111 UI (recommended)
1. Open A1111 WebUI
2. Go to **Extensions → Install from URL**
3. Paste the repository URL or local path
4. Click **Install**
5. Go to **Installed → Apply and restart UI**

### Method 2 — Manual
1. Copy the entire `sd-paste-generation` folder into:
   ```
   stable-diffusion-webui/extensions/sd-paste-generation/
   ```
2. Restart A1111 WebUI

---

## 📖 Usage

### Option A — Floating button (fastest)
1. Click the orange **📋** button in the bottom-right corner
2. Paste the generation data copied from CivitAI
3. Click **✅ Apply Parameters**
4. Done! All fields are filled in automatically

### Option B — Integrated panel
1. In the txt2img or img2img tab, find the accordion
   **"📋 Paste Generation Data (CivitAI)"**
2. Paste the data text
3. Click **Apply Parameters**

### Keyboard shortcut
- **`Ctrl + Shift + V`** → Opens the quick-paste modal

---

## 📋 Supported format

```
(anime coloring:1.1), dramatic lighting, intricate details, (masterpiece:1.1), (best quality:1.1)
Negative prompt: (bad quality,worst detail), error, bad anatomy, watermark
Steps: 25, CFG scale: 3.5, Sampler: DPM++ 2M, Seed: 1071487967, Size: 896x1152, Model: waiUtopia-v1.0, Hires upscale: 1.5, Hires upscaler: remacri_original, Denoising strength: 0.7
```

---

## 🔧 Detected parameters

| Parameter | Example |
|---|---|
| Positive prompt | `(anime coloring:1.1), dramatic lighting...` |
| Negative prompt | `Negative prompt: (bad quality,...` |
| Steps | `Steps: 25` |
| CFG Scale | `CFG scale: 3.5` |
| Sampler | `Sampler: DPM++ 2M` |
| Seed | `Seed: 1071487967` |
| Size | `Size: 896x1152` |
| HiRes upscale | `Hires upscale: 1.5` |
| HiRes upscaler | `Hires upscaler: remacri_original` |
| Denoising | `Denoising strength: 0.7` |

---

## 📁 Project structure

```
sd-paste-generation/
├── scripts/
│   └── paste_generation_data.py   # Gradio backend (integrated panel)
├── javascript/
│   └── paste_generation_data.js   # Frontend (floating button + modal + apply logic)
└── README.md
```

---

## ⚠️ Compatibility

- ✅ Automatic1111 WebUI v1.6+
- ✅ CivitAI standard metadata format
- ✅ A1111 standard metadata format
- ⚠️ Models and LoRAs: must be installed locally to be applied

---

## ☕ Support the project

If this extension saves you time and you'd like to support its development, a coffee is always appreciated!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/danielgs20019)

Every contribution helps keep the project maintained and motivates new features. Thank you! 🙏
