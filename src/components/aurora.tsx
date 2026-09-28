export function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <span
        className="animate-float"
        style={{
          width: 520,
          height: 520,
          left: "-8%",
          top: "-10%",
          background: "radial-gradient(circle, #818cf8, transparent 70%)",
        }}
      />
      <span
        className="animate-float"
        style={{
          width: 460,
          height: 460,
          right: "-6%",
          top: "12%",
          animationDelay: "2.5s",
          background: "radial-gradient(circle, #f472b6, transparent 70%)",
        }}
      />
      <span
        className="animate-float"
        style={{
          width: 560,
          height: 560,
          left: "28%",
          bottom: "-22%",
          animationDelay: "4.5s",
          background: "radial-gradient(circle, #22d3ee, transparent 70%)",
        }}
      />
    </div>
  );
}
