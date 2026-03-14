"""
SD Paste Generation Data - Extension for Automatic1111
Allows pasting CivitAI/A1111 generation metadata and auto-filling all parameters.
"""

import gradio as gr
import modules.scripts as scripts
from modules import script_callbacks


def on_ui_tabs():
    pass


def on_ui_settings():
    pass


class PasteGenerationDataScript(scripts.Script):
    def title(self):
        return "Paste Generation Data"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def ui(self, is_img2img):
        tab_prefix = "img2img" if is_img2img else "txt2img"

        with gr.Group():
            with gr.Accordion("📋 Paste Generation Data (CivitAI)", open=False):
                paste_text = gr.Textbox(
                    label="Pega aquí los datos de generación de CivitAI",
                    placeholder=(
                        "(anime coloring:1.1), dramatic lighting...\n"
                        "Negative prompt: (bad quality,...)\n"
                        "Steps: 25, CFG scale: 3.5, Sampler: DPM++ 2M, "
                        "Seed: 1071487967, Size: 896x1152, ..."
                    ),
                    lines=6,
                    elem_id=f"{tab_prefix}_pgd_input",
                )

                with gr.Row():
                    apply_btn = gr.Button(
                        "✅ Aplicar Parámetros",
                        variant="primary",
                        elem_id=f"{tab_prefix}_pgd_apply_btn",
                    )
                    clear_btn = gr.Button(
                        "🗑️ Limpiar",
                        elem_id=f"{tab_prefix}_pgd_clear_btn",
                    )

                status = gr.Textbox(
                    label="Estado",
                    interactive=False,
                    elem_id=f"{tab_prefix}_pgd_status",
                    visible=True,
                )

                # Hidden fields to pass parsed data back to JS
                parsed_json = gr.Textbox(
                    visible=False,
                    elem_id=f"{tab_prefix}_pgd_parsed_json",
                )

                def parse_and_apply(text):
                    if not text or not text.strip():
                        return "", "⚠️ No hay texto para procesar."
                    import json, re

                    result = {}
                    lines = text.strip().split("\n")
                    prompt_lines = []
                    neg_lines = []
                    params_line = ""
                    in_neg = False
                    in_params = False

                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue

                        # Detect params line (starts with Steps:)
                        if re.match(r"^Steps\s*:", line, re.IGNORECASE):
                            params_line = line
                            in_params = True
                            in_neg = False
                            continue

                        if in_params:
                            params_line += " " + line
                            continue

                        # Detect negative prompt
                        neg_match = re.match(
                            r"^Negative\s*prompt\s*:\s*(.*)", line, re.IGNORECASE
                        )
                        if neg_match:
                            in_neg = True
                            neg_lines.append(neg_match.group(1))
                            continue

                        if in_neg:
                            neg_lines.append(line)
                        else:
                            prompt_lines.append(line)

                    result["prompt"] = "\n".join(prompt_lines).strip()
                    result["negative_prompt"] = "\n".join(neg_lines).strip()

                    # Parse params line
                    def extract(pattern, text, default=None):
                        m = re.search(pattern, text, re.IGNORECASE)
                        return m.group(1).strip() if m else default

                    result["steps"] = extract(r"Steps\s*:\s*(\d+)", params_line)
                    result["cfg_scale"] = extract(
                        r"CFG\s*scale\s*:\s*([\d.]+)", params_line
                    )
                    result["sampler"] = extract(
                        r"Sampler\s*:\s*([^,]+)", params_line
                    )
                    result["seed"] = extract(r"Seed\s*:\s*(\d+)", params_line)

                    size_match = re.search(
                        r"Size\s*:\s*(\d+)\s*x\s*(\d+)", params_line, re.IGNORECASE
                    )
                    if size_match:
                        result["width"] = size_match.group(1)
                        result["height"] = size_match.group(2)

                    # Hires upscale
                    result["hires_upscale"] = extract(
                        r"Hires\s+upscale\s*:\s*([\d.]+)", params_line
                    )
                    result["hires_upscaler"] = extract(
                        r"Hires\s+upscaler\s*:\s*([^,]+)", params_line
                    )
                    result["denoising_strength"] = extract(
                        r"Denoising\s+strength\s*:\s*([\d.]+)", params_line
                    )

                    # Build summary
                    summary_parts = []
                    if result.get("prompt"):
                        summary_parts.append(
                            f"✅ Prompt ({len(result['prompt'])} chars)"
                        )
                    if result.get("negative_prompt"):
                        summary_parts.append(
                            f"✅ Negativo ({len(result['negative_prompt'])} chars)"
                        )
                    if result.get("steps"):
                        summary_parts.append(f"✅ Steps: {result['steps']}")
                    if result.get("cfg_scale"):
                        summary_parts.append(f"✅ CFG: {result['cfg_scale']}")
                    if result.get("sampler"):
                        summary_parts.append(f"✅ Sampler: {result['sampler']}")
                    if result.get("seed"):
                        summary_parts.append(f"✅ Seed: {result['seed']}")
                    if result.get("width") and result.get("height"):
                        summary_parts.append(
                            f"✅ Size: {result['width']}x{result['height']}"
                        )
                    if result.get("hires_upscale"):
                        summary_parts.append(
                            f"✅ HiRes: {result['hires_upscale']}x "
                            f"({result.get('hires_upscaler', 'default')})"
                        )

                    status_msg = (
                        "Parámetros detectados:\n" + "\n".join(summary_parts)
                        if summary_parts
                        else "⚠️ No se detectaron parámetros. Revisa el formato."
                    )

                    return json.dumps(result), status_msg

                def clear_all():
                    return "", "", "🗑️ Limpiado."

                apply_btn.click(
                    fn=parse_and_apply,
                    inputs=[paste_text],
                    outputs=[parsed_json, status],
                )

                clear_btn.click(
                    fn=clear_all,
                    inputs=[],
                    outputs=[paste_text, parsed_json, status],
                )

        return [paste_text, apply_btn, clear_btn, status, parsed_json]
