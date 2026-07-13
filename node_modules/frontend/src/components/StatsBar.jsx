import React from "react";
import { FaClock, FaMusic, FaHeadphones } from "react-icons/fa";

export default function StatsBar({ minutes, tracks, sessions }) {
  return (
    <div className="stats-bar" style={containerStyle}>
      <StatItem icon={<FaHeadphones style={iconStyle} />} label="Tracks" value={tracks} />
      <StatItem icon={<FaMusic style={iconStyle} />} label="Unique Tracks" value={sessions} />
      <StatItem icon={<FaClock style={iconStyle} />} label="Minutes" value={minutes} />
    </div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div style={itemStyle}>
      {icon}
      <span style={valueStyle}>{value}</span>
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  gap: "24px",
  justifyContent: "center",
  marginTop: "16px",
};
const itemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "var(--card-bg, rgba(255,255,255,0.03))",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "12px 16px",
};
const iconStyle = { fontSize: "1.4rem", color: "var(--saffron)", marginBottom: "6px" };
const valueStyle = { fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" };
const labelStyle = { fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" };
