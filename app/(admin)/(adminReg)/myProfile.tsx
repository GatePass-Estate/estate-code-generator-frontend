import React from "react";

export default function MyProfile() {
  return (
    <div
      style={{
        padding: "48px 0 0 0",
        background: "#f8fafa",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0b1a18" }}>
          My Profile
        </h1>
        <div
          style={{
            color: "#c05621",
            fontSize: 16,
            marginBottom: 24,
            marginTop: 4,
          }}
        >
          My personal details
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              border: "1px solid #b5c6c3",
              borderRadius: 8,
              padding: "0 18px",
              background: "#fff",
              minHeight: 56,
              fontSize: 18,
              fontWeight: 500,
              color: "#243a3f",
            }}
          >
            My access code :&nbsp;
            <span style={{ letterSpacing: 2, fontWeight: 700 }}>90t 76E</span>
            <button
              style={{
                marginLeft: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span role="img" aria-label="refresh">
                🔄
              </span>
            </button>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              border: "1px solid #b5c6c3",
              borderRadius: 8,
              padding: "0 18px",
              background: "#fff",
              minHeight: 56,
              fontSize: 18,
              fontWeight: 500,
              color: "#243a3f",
            }}
          >
            My Password :&nbsp;
            <span style={{ letterSpacing: 2 }}>************</span>
            <button
              style={{
                marginLeft: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span role="img" aria-label="edit">
                ✏️
              </span>
            </button>
          </div>
        </div>
        <div style={{ color: "#c05621", fontSize: 14, marginBottom: 18 }}>
          <span style={{ color: "#e53e3e" }}>
            &#9888; Code expires on 31st May 2003 : Regenerate Code now
          </span>
        </div>
        <div
          style={{
            background: "#f3fcfa",
            borderRadius: 8,
            padding: 32,
            border: "1px solid #b5c6c3",
            marginBottom: 32,
            maxWidth: 600,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <b>Name :</b> &nbsp; Sandra Happiness
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Address :</b> &nbsp; Flat 1, 18A Olayinka Something Street, U3
            Estate
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Email Address :</b> &nbsp; sandaroj@hmo.com
          </div>
          <div>
            <b>Phone Number :</b> &nbsp; 0902 443 422 3324
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            style={{
              background: "#243a3f",
              color: "#fff",
              fontWeight: 600,
              fontSize: 17,
              border: "none",
              borderRadius: 8,
              padding: "14px 36px",
              cursor: "pointer",
            }}
          >
            Edit Request
          </button>
        </div>
      </div>
    </div>
  );
}
