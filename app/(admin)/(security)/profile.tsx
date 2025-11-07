// ...existing code...
"use client";

import React, { useEffect } from "react";

export default function Profile() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).customElements?.get("ecg-profile-page")) return;

    class ECGProfilePage extends HTMLElement {
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
              --muted: #6b7d86;
              display: block;
              min-height: 100vh;
              box-sizing: border-box;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
              background: radial-gradient(ellipse at 10% 80%, rgba(131,184,176,0.06) 0%, transparent 30%),
                          radial-gradient(ellipse at 90% 20%, rgba(180,150,206,0.04) 0%, transparent 30%),
                          var(--bg);
            }

            .page {
              max-width: 980px;
              margin: 48px auto;
              padding: 24px;
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
              background: #fff;
              box-shadow: 0 1px 0 rgba(0,0,0,0.04), inset 0 -2px 0 rgba(0,0,0,0.06);
            }

            .hero {
              text-align: center;
              padding: 36px 12px;
            }
            h1 {
              font-size: 44px;
              font-weight: 600;
              color: var(--accent);
              margin: 8px 0 6px;
            }
            p.sub {
              color: #d67b6f;
              margin: 0 0 28px;
              font-size: 14px;
            }

            .card-wrap {
              display: flex;
              justify-content: center;
              margin-bottom: 28px;
            }

            .card {
              background: linear-gradient(180deg, rgba(8,44,53,0.98), rgba(15,52,60,0.98));
              color: #fff;
              padding: 28px 34px;
              border-radius: 8px;
              width: 560px;
              box-shadow: 0 8px 30px rgba(18,59,71,0.06);
            }

            .row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 24px;
              align-items: center;
              padding: 10px 0;
              border-radius: 6px;
            }
            .label {
              color: rgba(255,255,255,0.75);
              font-size: 14px;
            }
            .value {
              justify-self: end;
              color: #e6f2f4;
              font-size: 14px;
              text-align: right;
            }

            .actions {
              display: flex;
              gap: 18px;
              justify-content: center;
              margin-top: 18px;
            }
            .btn {
              padding: 12px 28px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              border: none;
            }
            .btn.ghost {
              background: #fff;
              color: var(--accent);
              border: 1px solid rgba(18,59,71,0.06);
              box-shadow: 0 6px 18px rgba(18,59,71,0.06);
            }
            .btn.primary {
              background: linear-gradient(180deg, #123b47, #0e333a);
              color: #fff;
              box-shadow: 0 6px 18px rgba(18,59,71,0.12);
            }

            @media (max-width: 640px) {
              h1 { font-size: 28px; }
              .card { width: 90%; padding: 20px; }
              .row { grid-template-columns: 1fr; gap: 6px 0; text-align: left; }
              .value { justify-self: start; text-align: left; }
              .actions { flex-direction: column; gap: 12px; }
              .btn { width: 100%; }
            }
          </style>

          <div class="page">
            <header>
              <div class="logo">Logo</div>
              <nav>
                <a href="#" id="nav-validate">Validate Code</a>
                <a class="active" href="#" id="nav-profile">My Profile</a>
              </nav>
            </header>

            <main class="hero" role="main" aria-labelledby="profile-title">
              <h1 id="profile-title">My Profile</h1>
              <p class="sub">Your personal details</p>

              <div class="card-wrap">
                <section class="card" aria-label="Profile details">
                  <div class="row">
                    <div class="label">Name :</div>
                    <div class="value" id="profile-name">Sandra Happiness</div>
                  </div>

                  <div class="row">
                    <div class="label">Email Address :</div>
                    <div class="value" id="profile-email">sandaroj@jhmo.com</div>
                  </div>

                  <div class="row">
                    <div class="label">Phone Number :</div>
                    <div class="value" id="profile-phone">0902 443 422 3324</div>
                  </div>
                </section>
              </div>

              <div class="actions">
                <button class="btn ghost" id="logoutBtn" aria-label="Log out">Log Out</button>
                <button class="btn primary" id="editBtn" aria-label="Edit request">Edit Request</button>
              </div>
            </main>
          </div>
        `;
      }

      addListeners() {
        const logout = this.shadow.querySelector(
          "#logoutBtn"
        ) as HTMLButtonElement | null;
        const edit = this.shadow.querySelector(
          "#editBtn"
        ) as HTMLButtonElement | null;
        const navValidate = this.shadow.querySelector(
          "#nav-validate"
        ) as HTMLAnchorElement | null;

        logout?.addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("logout", { bubbles: true, composed: true })
          );
        });

        edit?.addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("edit-request", { bubbles: true, composed: true })
          );
        });

        navValidate?.addEventListener("click", (e) => {
          e.preventDefault();
          this.dispatchEvent(
            new CustomEvent("navigate", {
              detail: { to: "validate" },
              bubbles: true,
              composed: true,
            })
          );
        });
      }
    }

    (window as any).customElements.define("ecg-profile-page", ECGProfilePage);
  }, []);

  return <ecg-profile-page />;
}
//
