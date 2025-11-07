"use client";

import React from "react";
import { useRouter } from "expo-router";

export default function InviteDetailsModal() {
  const router = useRouter();

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Invite details"
    >
      <div style={styles.container}>
        <button
          onClick={() => router.back()}
          aria-label="Close"
          style={styles.closeBtn}
        >
          ✕
        </button>

        <div style={styles.content}>
          <h2 style={styles.title}>Invite Details</h2>

          <div style={styles.accessWrapper}>
            <div style={styles.accessLabel}>Access Code</div>
            <div style={styles.accessCode}>765 3E2</div>
          </div>

          <h3 style={styles.sectionTitle}>Guest Details</h3>
          <div style={styles.guestCard}>
            <div style={styles.row}>
              <div style={styles.left}>Name :</div>
              <div style={styles.right}>Sandy Happiness</div>
            </div>
            <div style={styles.row}>
              <div style={styles.left}>Gender :</div>
              <div style={styles.right}>Female</div>
            </div>
            <div style={styles.row}>
              <div style={styles.left}>Relationship :</div>
              <div style={styles.right}>Family</div>
            </div>
          </div>

          <h3 style={styles.sectionTitle}>Resident Details</h3>
          <div style={styles.residentCard}>
            <div style={styles.row}>
              <div style={styles.left}>Name :</div>
              <div style={styles.right}>Sandra Happiness</div>
            </div>
            <div style={styles.row}>
              <div style={styles.left}>Address :</div>
              <div style={styles.right}>
                Flat 1, 18A Olayinka Something Street, U3 Estate
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.left}>Email Address :</div>
              <div style={styles.right}>sandaroj@hmo.com</div>
            </div>
            <div style={styles.row}>
              <div style={styles.left}>Phone Number :</div>
              <div style={styles.right}>0902 443 422 3324</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* inline styles to keep file self-contained */
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6, 41, 50, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 900,
    borderRadius: 12,
    position: "relative",
    boxShadow: "0 30px 80px rgba(3,10,14,0.6)",
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 18,
    background: "transparent",
    border: "none",
    color: "#dff2f5",
    fontSize: 22,
    cursor: "pointer",
    padding: 8,
    lineHeight: 1,
  },
  content: {
    background: "transparent",
    padding: "44px 56px",
    color: "#e7f2f4",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: "#e9f6f7",
  },
  accessWrapper: {
    textAlign: "center",
    margin: "28px 0 36px",
  },
  accessLabel: {
    fontSize: 13,
    color: "#c9e6e9",
    marginBottom: 8,
  },
  accessCode: {
    fontSize: 48,
    letterSpacing: 3,
    fontWeight: 700,
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#cfe9ea",
    margin: "18px 0 12px",
    fontWeight: 500,
  },
  guestCard: {
    background: "#dff3f5",
    color: "#08333a",
    borderRadius: 8,
    padding: 18,
    marginBottom: 24,
  },
  residentCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: 18,
    marginBottom: 12,
    background: "transparent",
    color: "#dff3f5",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 6px",
    alignItems: "flex-start",
  },
  left: {
    color: "rgba(255,255,255,0.7)",
    width: 160,
    fontSize: 14,
  },
  right: {
    color: "inherit",
    textAlign: "right",
    flex: 1,
    fontSize: 14,
  },
};
