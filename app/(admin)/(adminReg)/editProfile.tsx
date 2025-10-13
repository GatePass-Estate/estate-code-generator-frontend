import React from "react";

export default function EditProfile() {
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
          Edit Profile
        </h1>
        <div
          style={{
            color: "#c05621",
            fontSize: 16,
            marginBottom: 24,
            marginTop: 4,
          }}
        >
          Send a request to edit your personal details
        </div>
        <form
          style={{
            background: "#fff",
            border: "1px solid #b5c6c3",
            borderRadius: 8,
            padding: 32,
            maxWidth: 700,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#667a75", fontSize: 15 }}>Name</label>
            <input
              type="text"
              value="Sandra Happiness"
              readOnly
              style={{
                width: "100%",
                marginTop: 8,
                padding: "14px 18px",
                borderRadius: 8,
                border: "none",
                background: "#f8fafa",
                fontSize: 17,
                color: "#243a3f",
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#667a75", fontSize: 15 }}>
              Email Address
            </label>
            <input
              type="email"
              value="sandaroj@hmo.com"
              readOnly
              style={{
                width: "100%",
                marginTop: 8,
                padding: "14px 18px",
                borderRadius: 8,
                border: "none",
                background: "#f8fafa",
                fontSize: 17,
                color: "#243a3f",
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#667a75", fontSize: 15 }}>Address</label>
            <input
              type="text"
              value="Flat 1, 18A Olayinka Something Street, U3 Estate"
              readOnly
              style={{
                width: "100%",
                marginTop: 8,
                padding: "14px 18px",
                borderRadius: 8,
                border: "none",
                background: "#f8fafa",
                fontSize: 17,
                color: "#243a3f",
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#667a75", fontSize: 15 }}>
              Phone Number
            </label>
            <input
              type="text"
              value="0902 443 422 3324"
              readOnly
              style={{
                width: "100%",
                marginTop: 8,
                padding: "14px 18px",
                borderRadius: 8,
                border: "none",
                background: "#f8fafa",
                fontSize: 17,
                color: "#243a3f",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 24 }}>
            <button
              type="button"
              style={{
                background: "none",
                color: "#243a3f",
                fontWeight: 500,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel Request
            </button>
            <button
              type="submit"
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
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
