// ...existing code...
"use client";

import React, { useEffect } from "react";

export default function EditProfile() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).customElements?.get("ecg-edit-profile")) return;

    class ECGEditProfile extends HTMLElement {
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
              --bg: #ffffff;
              --accent: #123b47;
              --muted: #7b8b90;
              --danger: #d67b6f;
              display: block;
              min-height: 100vh;
              box-sizing: border-box;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
              background:
                radial-gradient(ellipse at 10% 80%, rgba(131,184,176,0.04) 0%, transparent 30%),
                radial-gradient(ellipse at 90% 20%, rgba(180,150,206,0.03) 0%, transparent 30%),
                var(--bg);
            }

            .page {
              max-width: 760px;
              margin: 48px auto;
              padding: 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            header {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 0 24px;
            }
            .logo { color: var(--accent); font-weight: 600; font-size: 20px; }

            .hero { text-align: center; padding: 12px 8px; max-width: 700px; width: 100%; }
            h1 { font-size: 32px; color: var(--accent); margin: 12px 0 6px; font-weight: 600; }
            p.sub { color: var(--danger); margin: 0 0 20px; font-size: 14px; }

            .form-card {
              width: 100%;
              border-radius: 8px;
              border: 1px solid rgba(18,59,71,0.12);
              padding: 22px;
              background: #fff;
              box-shadow: 0 8px 30px rgba(18,59,71,0.03);
            }

            .field {
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin-bottom: 18px;
            }
            label {
              color: var(--muted);
              font-size: 13px;
            }
            input[type="text"], input[type="email"], input[type="tel"] {
              padding: 14px 16px;
              border-radius: 12px;
              border: none;
              background: #f5f7f6;
              font-size: 14px;
              outline: none;
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
            }
            input:focus {
              box-shadow: 0 0 0 3px rgba(18,59,71,0.06);
            }

            .actions {
              display: flex;
              gap: 18px;
              justify-content: center;
              margin-top: 26px;
            }
            .btn {
              padding: 12px 34px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              border: none;
            }
            .btn.ghost {
              background: #fff;
              color: var(--accent);
              border: 1px solid rgba(18,59,71,0.08);
              box-shadow: 0 6px 18px rgba(18,59,71,0.04);
            }
            .btn.primary {
              background: linear-gradient(180deg, #123b47, #0e333a);
              color: #fff;
              box-shadow: 0 6px 18px rgba(18,59,71,0.12);
            }

            @media (max-width: 640px) {
              .page { padding: 18px; }
              h1 { font-size: 24px; }
              .actions { flex-direction: column; width: 100%; }
              .btn { width: 100%; }
            }
          </style>

          <div class="page" role="main" aria-labelledby="edit-title">
            <header>
              <div class="logo">Logo</div>
              <nav aria-hidden="true">
                <a href="#" style="color:transparent">menu</a>
              </nav>
            </header>

            <section class="hero" aria-labelledby="edit-title">
              <h1 id="edit-title">Edit Profile</h1>
              <p class="sub">Send a request to edit your personal details</p>

              <form class="form-card" id="editForm" novalidate>
                <div class="field">
                  <label for="name">Name</label>
                  <input id="name" name="name" type="text" value="Sandra Happiness" autocomplete="name" />
                </div>

                <div class="field">
                  <label for="email">Email Address</label>
                  <input id="email" name="email" type="email" value="sandaroj@jhmo.com" autocomplete="email" />
                </div>

                <div class="field">
                  <label for="phone">Phone Number</label>
                  <input id="phone" name="phone" type="tel" value="0902 443 422 3324" autocomplete="tel" />
                </div>
              </form>

              <div class="actions" role="toolbar" aria-label="form actions">
                <button class="btn ghost" id="backBtn" type="button">Back</button>
                <button class="btn primary" id="sendBtn" type="button">Send Request</button>
              </div>
            </section>
          </div>
        `;
      }

      addListeners() {
        const backBtn = this.shadow.querySelector(
          "#backBtn"
        ) as HTMLButtonElement | null;
        const sendBtn = this.shadow.querySelector(
          "#sendBtn"
        ) as HTMLButtonElement | null;
        const form = this.shadow.querySelector(
          "#editForm"
        ) as HTMLFormElement | null;

        backBtn?.addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("back", { bubbles: true, composed: true })
          );
        });

        sendBtn?.addEventListener("click", async () => {
          if (!form) return;
          const name = (
            this.shadow.querySelector("#name") as HTMLInputElement
          ).value.trim();
          const email = (
            this.shadow.querySelector("#email") as HTMLInputElement
          ).value.trim();
          const phone = (
            this.shadow.querySelector("#phone") as HTMLInputElement
          ).value.trim();

          // basic validation
          const valid =
            name.length > 0 && /\S+@\S+\.\S+/.test(email) && phone.length > 6;
          if (!valid) {
            this.dispatchEvent(
              new CustomEvent("validation-error", {
                detail: { name, email, phone },
                bubbles: true,
                composed: true,
              })
            );
            return;
          }

          sendBtn.textContent = "Sending…";
          sendBtn.setAttribute("disabled", "true");

          // simulate async request
          setTimeout(() => {
            sendBtn.textContent = "Send Request";
            sendBtn.removeAttribute("disabled");
            this.dispatchEvent(
              new CustomEvent("send-request", {
                detail: { name, email, phone },
                bubbles: true,
                composed: true,
              })
            );
          }, 900);
        });

        // allow Enter key to submit
        this.shadow.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            const active = this.shadow.activeElement as HTMLElement | null;
            // prevent accidental form submit when focus is on buttons
            if (active && active.tagName.toLowerCase() === "button") return;
            e.preventDefault();
            sendBtn?.click();
          }
        });
      }
    }

    (window as any).customElements.define("ecg-edit-profile", ECGEditProfile);
  }, []);

  return <ecg-edit-profile />;
}
// ...existing
