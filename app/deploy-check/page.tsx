export default function DeployCheck() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ fontWeight: 900, fontSize: 20 }}>DEPLOY CHECK</div>
      <div style={{ marginTop: 8 }}>If you can see this, your new build is live.</div>
      <div style={{ marginTop: 8, opacity: 0.7 }}>
        Timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
}