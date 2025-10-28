// ...existing code...
"use client";

import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).customElements?.get("ecg-search-page")) return;

    class ECGSearchPage extends HTMLElement {
      shadow: ShadowRoot;
      constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
      }

      connectedCallback() {
        this.render();
        this.addListeners();
      }

      render() {
        this.shadow.innerHTML = `
          <style>
            :host {
              --bg: #fbf0ee;
              --accent: #123b47;
              --muted: #6b7d86;
              display: block;
              min-height: 100vh;
              box-sizing: border-box;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
              background: radial-gradient(ellipse at 10% 80%, rgba(131,184,176,0.08) 0%, transparent 30%),
                          radial-gradient(ellipse at 90% 20%, rgba(180,150,206,0.06) 0%, transparent 30%),
                          var(--bg);
            }
            .page {
              max-width: 980px;
              margin: 48px auto;
              padding: 24px;
              position: relative;
            }
            header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 0 40px;
            }
            .logo {
              color: var(--accent);
              font-weight: 600;
              font-size: 20px;
            }
            nav {
              display: flex;
              gap: 18px;
              align-items: center;
              margin: 0 auto;
            }
            nav a {
              color: #2b4a52;
              text-decoration: none;
              padding: 10px 16px;
              border-radius: 6px;
              font-size: 14px;
            }
            nav a.active {
              background: #fff0f0;
              box-shadow: inset 0 -2px 0 rgba(0,0,0,0.06);
              border-bottom: 3px solid rgba(18,59,71,0.08);
            }

            .hero {
              text-align: center;
              margin-top: 30px;
              padding: 48px 12px;
            }
            h1 {
              font-size: 40px;
              font-weight: 700;
              color: var(--accent);
              margin: 8px 0 6px;
            }
            p.lead {
              color: var(--muted);
              margin: 0 0 28px;
              font-size: 14px;
            }

            .code-row {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 28px;
            }
            .code-box {
              width: 56px;
              height: 56px;
              background: #ffffff;
              border: 1.5px solid rgba(18,59,71,0.08);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 14px rgba(18,59,71,0.03);
            }
            .code-box input {
              width: 100%;
              height: 100%;
              text-align: center;
              border: none;
              outline: none;
              font-size: 22px;
              background: transparent;
              caret-color: var(--accent);
            }

            .btn {
              display: inline-block;
              background: linear-gradient(180deg, #123b47, #0e333a);
              color: #fff;
              padding: 14px 36px;
              border-radius: 10px;
              font-size: 15px;
              border: none;
              cursor: pointer;
              box-shadow: 0 6px 18px rgba(18,59,71,0.12);
            }

            /* responsive */
            @media (max-width: 640px) {
              h1 { font-size: 28px; }
              .code-box { width: 44px; height: 44px; }
            }
          </style>

          <div class="page">
            <header>
              <div class="logo">Logo</div>
              <nav>
                <a class="active" href="#">Validate Code</a>
                <a href="#">My Profile</a>
              </nav>
            </header>

            <main class="hero" role="main">
              <h1>Search Code</h1>
              <p class="lead">Enter Guest Code to Validate</p>

              <div class="code-row" aria-label="Guest code">
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-1"></label>
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-2"></label>
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-3"></label>
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-4"></label>
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-5"></label>
                <label class="code-box"><input inputmode="numeric" maxlength="1" aria-label="digit-6"></label>
              </div>

              <button class="btn" id="validateBtn">Validate Code</button>
            </main>
          </div>
        `;
      }

      addListeners() {
        const inputs = Array.from(this.shadow.querySelectorAll("input"));
        const btn = this.shadow.querySelector(
          "#validateBtn"
        ) as HTMLButtonElement;

        // auto focus first
        if (inputs.length) (inputs[0] as HTMLInputElement).focus();

        inputs.forEach((input, idx) => {
          input.addEventListener("input", (e: Event) => {
            const t = e.target as HTMLInputElement;
            const v = t.value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 1);
            t.value = v.toUpperCase();
            if (v && idx < inputs.length - 1) {
              (inputs[idx + 1] as HTMLInputElement).focus();
            }
          });

          input.addEventListener("keydown", (e: KeyboardEvent) => {
            const t = e.target as HTMLInputElement;
            if (e.key === "Backspace" && !t.value && idx > 0) {
              (inputs[idx - 1] as HTMLInputElement).focus();
            }
            if (e.key === "ArrowLeft" && idx > 0) {
              (inputs[idx - 1] as HTMLInputElement).focus();
            }
            if (e.key === "ArrowRight" && idx < inputs.length - 1) {
              (inputs[idx + 1] as HTMLInputElement).focus();
            }
          });

          input.addEventListener("paste", (e: ClipboardEvent) => {
            e.preventDefault();
            const paste = (
              e.clipboardData || (window as any).clipboardData
            ).getData("text");
            const chars = paste
              .replace(/\s+/g, "")
              .slice(0, inputs.length)
              .split("");
            chars.forEach((ch, i) => {
              (inputs[i] as HTMLInputElement).value = ch.toUpperCase();
            });
            const next = Math.min(chars.length, inputs.length - 1);
            (inputs[next] as HTMLInputElement).focus();
          });
        });

        btn?.addEventListener("click", () => {
          const code = inputs
            .map((i) => (i as HTMLInputElement).value || "")
            .join("");
          this.dispatchEvent(new CustomEvent("validate", { detail: { code } }));
          // simple visual feedback
          btn.textContent = "Validating…";
          setTimeout(() => {
            btn.textContent = "Validate Code";
            // emit result (in real app you'd call API)
            const valid = code.length === inputs.length;
            this.dispatchEvent(
              new CustomEvent("validated", { detail: { code, valid } })
            );
          }, 700);
        });
      }
    }

    (window as any).customElements.define("ecg-search-page", ECGSearchPage);
  }, []);

  return <ecg-search-page />;
}
