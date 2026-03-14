/**
 * SD Paste Generation Data - JavaScript
 * Watches for parsed JSON and applies parameters to the A1111 UI components.
 */

(function () {
  "use strict";

  // ─── Sampler name normalization map ───────────────────────────────────────
  const SAMPLER_MAP = {
    "dpm++ 2m": "DPM++ 2M",
    "dpm++ 2m karras": "DPM++ 2M Karras",
    "dpm++ sde": "DPM++ SDE",
    "dpm++ sde karras": "DPM++ SDE Karras",
    "dpm++ 2s a": "DPM++ 2S a",
    "dpm++ 2s a karras": "DPM++ 2S a Karras",
    "dpm++ 3m sde": "DPM++ 3M SDE",
    "dpm++ 3m sde karras": "DPM++ 3M SDE Karras",
    "euler a": "Euler a",
    euler: "Euler",
    lms: "LMS",
    heun: "Heun",
    dpm2: "DPM2",
    "dpm2 a": "DPM2 a",
    "dpm2 karras": "DPM2 Karras",
    "dpm2 a karras": "DPM2 a Karras",
    ddim: "DDIM",
    plms: "PLMS",
    unipc: "UniPC",
    "lcm": "LCM",
  };

  function normalizeSampler(name) {
    if (!name) return null;
    return SAMPLER_MAP[name.toLowerCase().trim()] || name.trim();
  }

  // ─── Gradio helpers ────────────────────────────────────────────────────────

  /** Set value on a Gradio textarea/input and fire change events */
  function setTextarea(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const input = el.querySelector("textarea") || el.querySelector("input");
    if (!input) return false;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ) || Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    );
    if (nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  /** Set value on a Gradio number/slider input */
  function setNumber(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const input = el.querySelector("input[type='number']") || el.querySelector("input");
    if (!input) return false;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    );
    if (nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(input, String(value));
    } else {
      input.value = String(value);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  /** Set value on a Gradio dropdown */
  function setDropdown(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return false;

    // Try Gradio v3/v4 select
    const select = el.querySelector("select");
    if (select) {
      const option = Array.from(select.options).find(
        (o) => o.text.toLowerCase() === value.toLowerCase() ||
               o.value.toLowerCase() === value.toLowerCase()
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }

    // Gradio v4 custom dropdown
    const input = el.querySelector("input");
    if (input) {
      const nativeSet = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      );
      if (nativeSet && nativeSet.set) {
        nativeSet.set.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      // Try clicking matching list item
      setTimeout(() => {
        const items = document.querySelectorAll(".options .item, ul[role='listbox'] li");
        for (const item of items) {
          if (item.textContent.trim().toLowerCase() === value.toLowerCase()) {
            item.click();
            break;
          }
        }
      }, 100);
      return true;
    }
    return false;
  }

  // ─── Apply data to a tab ───────────────────────────────────────────────────

  function applyToTab(prefix, data) {
    const applied = [];
    const failed = [];

    function trySet(label, fn) {
      try {
        if (fn()) applied.push(label);
        else failed.push(label);
      } catch (e) {
        failed.push(`${label} (error: ${e.message})`);
      }
    }

    if (data.prompt !== undefined && data.prompt !== null) {
      trySet("prompt", () => setTextarea(`#${prefix}_prompt`, data.prompt));
    }

    if (data.negative_prompt !== undefined && data.negative_prompt !== null) {
      trySet("negative_prompt", () =>
        setTextarea(`#${prefix}_neg_prompt`, data.negative_prompt)
      );
    }

    if (data.steps) {
      trySet("steps", () => setNumber(`#${prefix}_steps`, parseInt(data.steps)));
    }

    if (data.cfg_scale) {
      trySet("cfg_scale", () =>
        setNumber(`#${prefix}_cfg_scale`, parseFloat(data.cfg_scale))
      );
    }

    if (data.sampler) {
      const normalized = normalizeSampler(data.sampler);
      trySet("sampler", () =>
        setDropdown(`#${prefix}_sampling`, normalized)
      );
    }

    if (data.seed) {
      trySet("seed", () => setNumber(`#${prefix}_seed`, parseInt(data.seed)));
    }

    if (data.width) {
      trySet("width", () => setNumber(`#${prefix}_width`, parseInt(data.width)));
    }

    if (data.height) {
      trySet("height", () =>
        setNumber(`#${prefix}_height`, parseInt(data.height))
      );
    }

    // Hires fix
    if (data.hires_upscale || data.hires_upscaler || data.denoising_strength) {
      // Enable hires fix checkbox if present
      const hiresCheckbox = document.querySelector(
        `#${prefix}_enable_hr input[type='checkbox']`
      );
      if (hiresCheckbox && !hiresCheckbox.checked) {
        hiresCheckbox.click();
        applied.push("hires_fix_enabled");
      }

      setTimeout(() => {
        if (data.hires_upscale) {
          setNumber(`#${prefix}_hr_scale`, parseFloat(data.hires_upscale));
          applied.push("hires_upscale");
        }
        if (data.hires_upscaler) {
          setDropdown(`#${prefix}_hr_upscaler`, data.hires_upscaler.trim());
          applied.push("hires_upscaler");
        }
        if (data.denoising_strength) {
          setNumber(
            `#${prefix}_denoising_strength`,
            parseFloat(data.denoising_strength)
          );
          applied.push("denoising_strength");
        }
      }, 300);
    }

    return { applied, failed };
  }

  // ─── Watch for parsed JSON changes ────────────────────────────────────────

  function watchParsedJson(prefix) {
    const statusId = `${prefix}_pgd_status`;
    let lastValue = null;

    const observer = new MutationObserver(() => {
      const jsonEl = document.querySelector(`#${prefix}_pgd_parsed_json textarea`);
      if (!jsonEl) return;
      const val = jsonEl.value;
      if (!val || val === lastValue) return;
      lastValue = val;

      let data;
      try {
        data = JSON.parse(val);
      } catch (e) {
        return;
      }

      if (!data || Object.keys(data).length === 0) return;

      const { applied, failed } = applyToTab(prefix, data);

      // Update status
      const statusEl = document.querySelector(`#${statusId} textarea`);
      if (statusEl) {
        const msg =
          `✅ Aplicado: ${applied.join(", ") || "ninguno"}` +
          (failed.length ? `\n⚠️ No encontrado: ${failed.join(", ")}` : "");
        const nativeSet = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        );
        if (nativeSet && nativeSet.set) {
          nativeSet.set.call(statusEl, msg);
        } else {
          statusEl.value = msg;
        }
        statusEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Start observing once the element exists
    function startObserver() {
      const target = document.querySelector(`#${prefix}_pgd_parsed_json`);
      if (target) {
        observer.observe(target, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
        });
      } else {
        setTimeout(startObserver, 500);
      }
    }

    startObserver();
  }

  // ─── Floating quick-paste button ──────────────────────────────────────────

  function addFloatingButton() {
    const btn = document.createElement("button");
    btn.id = "pgd_float_btn";
    btn.title = "Pegar datos de generación (CivitAI)";
    btn.innerHTML = "📋";
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f97316;
      color: white;
      font-size: 20px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: transform 0.2s, background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    btn.onmouseenter = () => {
      btn.style.background = "#ea6800";
      btn.style.transform = "scale(1.1)";
    };
    btn.onmouseleave = () => {
      btn.style.background = "#f97316";
      btn.style.transform = "scale(1)";
    };

    btn.onclick = () => showQuickModal();
    document.body.appendChild(btn);
  }

  function showQuickModal() {
    // Determine active tab
    const activeTab = document.querySelector(
      "#tabs .tab-nav button.selected"
    );
    const tabText = activeTab ? activeTab.textContent.toLowerCase() : "";
    const prefix = tabText.includes("img2img") ? "img2img" : "txt2img";

    // Create modal
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      z-index: 10000; display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #1f2937; border-radius: 12px; padding: 24px;
      width: 600px; max-width: 90vw; max-height: 80vh;
      display: flex; flex-direction: column; gap: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      font-family: system-ui, sans-serif;
    `;

    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin:0;color:#f3f4f6;font-size:18px">
          📋 Pegar Datos de Generación
        </h2>
        <button id="pgd_modal_close" style="
          background:none;border:none;color:#9ca3af;font-size:24px;
          cursor:pointer;line-height:1;padding:0;
        ">×</button>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:13px">
        Pega los datos de generación copiados de CivitAI. Tab activo: <strong style="color:#f97316">${prefix}</strong>
      </p>
      <textarea id="pgd_modal_input" style="
        width:100%;height:180px;background:#111827;color:#f3f4f6;
        border:1px solid #374151;border-radius:8px;padding:10px;
        font-size:13px;resize:vertical;box-sizing:border-box;
        font-family:monospace;
      " placeholder="(anime coloring:1.1), dramatic lighting...
Negative prompt: (bad quality,...),
Steps: 25, CFG scale: 3.5, Sampler: DPM++ 2M, Seed: 1071487967, Size: 896x1152, ..."></textarea>
      <div id="pgd_modal_status" style="
        color:#10b981;font-size:13px;min-height:20px;white-space:pre-wrap;
      "></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="pgd_modal_clear" style="
          padding:8px 16px;border-radius:6px;border:1px solid #374151;
          background:#374151;color:#f3f4f6;cursor:pointer;font-size:14px;
        ">🗑️ Limpiar</button>
        <button id="pgd_modal_apply" style="
          padding:8px 20px;border-radius:6px;border:none;
          background:#f97316;color:white;cursor:pointer;font-size:14px;
          font-weight:600;
        ">✅ Aplicar Parámetros</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById("pgd_modal_close").onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });

    document.getElementById("pgd_modal_clear").onclick = () => {
      document.getElementById("pgd_modal_input").value = "";
      document.getElementById("pgd_modal_status").textContent = "";
      document.getElementById("pgd_modal_status").style.color = "#10b981";
    };

    document.getElementById("pgd_modal_apply").onclick = () => {
      const text = document.getElementById("pgd_modal_input").value.trim();
      if (!text) {
        document.getElementById("pgd_modal_status").style.color = "#ef4444";
        document.getElementById("pgd_modal_status").textContent =
          "⚠️ No hay datos para procesar.";
        return;
      }
      applyAndClose(text);
    };

    function applyAndClose(text) {
      const data = parseGenerationData(text);
      const { applied, failed } = applyToTab(prefix, data);
      const statusEl = document.getElementById("pgd_modal_status");
      if (!statusEl) return;
      if (applied.length === 0) {
        statusEl.style.color = "#ef4444";
        statusEl.textContent = "⚠️ No se encontraron parámetros válidos.";
      } else {
        statusEl.style.color = "#10b981";
        statusEl.textContent =
          `✅ Aplicado: ${applied.join(", ")}` +
          (failed.length ? `\n⚠️ No encontrado en UI: ${failed.join(", ")}` : "");
        setTimeout(close, 2000);
      }
    }

    // ─── Auto-read clipboard on open ──────────────────────────────────────
    function setClipboardText(text) {
      if (!text || !text.trim()) return;
      const textarea = document.getElementById("pgd_modal_input");
      const statusEl = document.getElementById("pgd_modal_status");
      if (!textarea) return;

      // Only fill if it looks like generation data (has Steps: or a prompt-like structure)
      const looksLikeGenData =
        /Steps\s*:/i.test(text) ||
        /Negative\s*prompt\s*:/i.test(text) ||
        /CFG\s*scale\s*:/i.test(text) ||
        /Sampler\s*:/i.test(text);

      if (!looksLikeGenData) {
        if (statusEl) {
          statusEl.style.color = "#f59e0b";
          statusEl.textContent =
            "⚠️ El portapapeles no contiene datos de generación válidos.";
        }
        textarea.focus();
        return;
      }

      textarea.value = text.trim();

      if (statusEl) {
        statusEl.style.color = "#10b981";
        statusEl.textContent = "📋 Datos cargados desde el portapapeles. Revisa y aplica.";
      }

      textarea.focus();
      textarea.select();
    }

    // Try modern Clipboard API first, fallback to execCommand
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard
        .readText()
        .then((text) => setClipboardText(text))
        .catch((err) => {
          // Permission denied or not available — let user paste manually
          const statusEl = document.getElementById("pgd_modal_status");
          if (statusEl) {
            statusEl.style.color = "#f59e0b";
            statusEl.textContent =
              "⚠️ Sin permiso de portapapeles. Pega manualmente con Ctrl+V.";
          }
          document.getElementById("pgd_modal_input")?.focus();
        });
    } else {
      // Fallback: try execCommand paste into a temp element
      try {
        const temp = document.createElement("textarea");
        temp.style.cssText = "position:fixed;opacity:0;top:0;left:0;";
        document.body.appendChild(temp);
        temp.focus();
        const success = document.execCommand("paste");
        const text = temp.value;
        document.body.removeChild(temp);
        if (success && text) {
          setClipboardText(text);
        } else {
          document.getElementById("pgd_modal_input")?.focus();
        }
      } catch (e) {
        document.getElementById("pgd_modal_input")?.focus();
      }
    }
  }

  // ─── Pure JS parser (mirrors Python logic) ────────────────────────────────

  function parseGenerationData(text) {
    const result = {};
    const lines = text.trim().split("\n");
    const promptLines = [];
    const negLines = [];
    let paramsLine = "";
    let inNeg = false;
    let inParams = false;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (/^Steps\s*:/i.test(line)) {
        paramsLine = line;
        inParams = true;
        inNeg = false;
        continue;
      }

      if (inParams) {
        paramsLine += " " + line;
        continue;
      }

      const negMatch = line.match(/^Negative\s*prompt\s*:\s*(.*)/i);
      if (negMatch) {
        inNeg = true;
        negLines.push(negMatch[1]);
        continue;
      }

      if (inNeg) {
        negLines.push(line);
      } else {
        promptLines.push(line);
      }
    }

    result.prompt = promptLines.join("\n").trim();
    result.negative_prompt = negLines.join("\n").trim();

    const extract = (pattern) => {
      const m = paramsLine.match(pattern);
      return m ? m[1].trim() : null;
    };

    result.steps = extract(/Steps\s*:\s*(\d+)/i);
    result.cfg_scale = extract(/CFG\s*scale\s*:\s*([\d.]+)/i);
    result.sampler = extract(/Sampler\s*:\s*([^,]+)/i);
    result.seed = extract(/Seed\s*:\s*(\d+)/i);

    const sizeMatch = paramsLine.match(/Size\s*:\s*(\d+)\s*x\s*(\d+)/i);
    if (sizeMatch) {
      result.width = sizeMatch[1];
      result.height = sizeMatch[2];
    }

    result.hires_upscale = extract(/Hires\s+upscale\s*:\s*([\d.]+)/i);
    result.hires_upscaler = extract(/Hires\s+upscaler\s*:\s*([^,]+)/i);
    result.denoising_strength = extract(/Denoising\s+strength\s*:\s*([\d.]+)/i);

    return result;
  }

  // ─── Keyboard shortcut Ctrl+Shift+V ───────────────────────────────────────

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "V") {
      e.preventDefault();
      showQuickModal();
    }
  });

  // ─── Init ──────────────────────────────────────────────────────────────────

  function init() {
    watchParsedJson("txt2img");
    watchParsedJson("img2img");
    addFloatingButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // Wait for Gradio to fully load
    setTimeout(init, 1500);
  }
})();
