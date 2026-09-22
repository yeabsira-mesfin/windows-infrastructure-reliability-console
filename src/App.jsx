import { useMemo, useState } from "react";
import "./App.css";

const baseNodes = [
  { id:"WEB-01", role:"Web Gateway", zone:"Zone A", status:"Healthy", cpu:34, memory:58, latency:18, dns:"web-a.lab.local", port:443 },
  { id:"WEB-02", role:"Web Gateway", zone:"Zone B", status:"Healthy", cpu:29, memory:52, latency:21, dns:"web-b.lab.local", port:443 },
  { id:"APP-01", role:"Application Service", zone:"Zone A", status:"Healthy", cpu:47, memory:64, latency:32, dns:"app-a.lab.local", port:8443 },
  { id:"DB-01", role:"Data Service", zone:"Zone B", status:"Healthy", cpu:41, memory:67, latency:13, dns:"data-b.lab.local", port:1433 }
];

const tabs = ["Overview", "Network", "Backup", "Events"];

function now() {
  return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

function App() {
  const [tab, setTab] = useState("Overview");
  const [nodes, setNodes] = useState(baseNodes);
  const [backup, setBackup] = useState("Verified");
  const [scan, setScan] = useState("Ready");
  const [events, setEvents] = useState([
    { level:"success", time:"09:41:15", message:"Backup integrity check passed." },
    { level:"info", time:"09:41:12", message:"Four infrastructure nodes loaded." }
  ]);

  const healthy = nodes.filter((node) => node.status === "Healthy").length;
  const availability = ((healthy / nodes.length) * 100).toFixed(1);
  const latency = useMemo(() => {
    const active = nodes.filter((node) => node.status === "Healthy");
    return Math.round(active.reduce((sum, node) => sum + node.latency, 0) / active.length);
  }, [nodes]);

  const addEvent = (level, message) => {
    setEvents((items) => [{ level, time:now(), message }, ...items].slice(0, 8));
  };

  const runScan = () => {
    setScan("Scanning");
    addEvent("info", "PowerShell health scan started.");
    window.setTimeout(() => {
      const count = nodes.filter((node) => node.status !== "Healthy").length;
      setScan(count ? count + " finding" : "All clear");
      addEvent(count ? "warning" : "success", count ? "Operator review required for one node." : "Health scan completed within demo thresholds.");
    }, 550);
  };

  const failNode = () => {
    setNodes((items) => items.map((node) => node.id === "WEB-01" ? { ...node, status:"Unavailable", latency:0 } : node));
    addEvent("warning", "WEB-01 unavailable. Simulated route moved to WEB-02.");
  };

  const restore = () => {
    setNodes(baseNodes);
    setScan("Ready");
    addEvent("success", "WEB-01 restored. Redundancy is healthy.");
  };

  const verifyBackup = () => {
    setBackup("Verifying");
    addEvent("info", "SHA-256 backup verification started.");
    window.setTimeout(() => {
      setBackup("Verified");
      addEvent("success", "Source and backup SHA-256 values match.");
    }, 600);
  };

  return (
    <main className="desktop">
      <div className="glow glowA" />
      <div className="glow glowB" />
      <section className="window">
        <header className="titlebar">
          <div className="brand">
            <span className="winIcon"><i/><i/><i/><i/></span>
            <div><strong>Infrastructure Reliability Console</strong><small>Windows Operations Lab</small></div>
          </div>
          <div className="windowControls"><span>−</span><span>□</span><span className="close">×</span></div>
        </header>

        <div className="workspace">
          <aside className="sidebar">
            <div className="env"><span className="liveDot"/><div><strong>Lab environment</strong><small>Simulation mode</small></div></div>
            <nav>
              {tabs.map((item) => (
                <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
                  <span className="navDot"/>{item}
                </button>
              ))}
            </nav>
            <div className="note"><strong>Portfolio project</strong><p>The UI is a local visualization. PowerShell scripts implement the automation checks.</p></div>
          </aside>

          <section className="content">
            <div className="heading">
              <div><p className="eyebrow">Enterprise infrastructure practice lab</p><h1>{tab}</h1><p className="intro">Service health, network paths, backup integrity, and safe recovery workflows.</p></div>
              <span className={"healthPill " + (healthy === nodes.length ? "" : "degraded")}><i/>{healthy === nodes.length ? "Operational" : "Degraded"}</span>
            </div>

            {tab === "Overview" && (
              <>
                <div className="metrics">
                  <Metric label="Availability" value={availability + "%"} sub={healthy + " of " + nodes.length + " nodes healthy"} />
                  <Metric label="Average latency" value={latency + " ms"} sub="Healthy service paths" />
                  <Metric label="Backup integrity" value={backup} sub="SHA-256 verification" />
                  <Metric label="Last health scan" value={scan} sub="PowerShell workflow model" />
                </div>

                <div className="mainGrid">
                  <article className="panel">
                    <div className="panelHead"><div><p className="eyebrow">Infrastructure</p><h2>Service nodes</h2></div><button className="ghost" onClick={runScan}>Run health scan</button></div>
                    <div className="nodeList">
                      {nodes.map((node) => (
                        <div className="node" key={node.id}>
                          <span className={"statusDot " + (node.status === "Healthy" ? "ok" : "bad")}/>
                          <div><strong>{node.id}</strong><small>{node.role}</small></div>
                          <span>{node.zone}</span>
                          <div className="meterWrap"><small>CPU {node.cpu}%</small><div className="meter"><i style={{width:node.cpu + "%"}}/></div></div>
                          <span className={"badge " + (node.status === "Healthy" ? "" : "bad")}>{node.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="actions"><button className="primary" onClick={failNode}>Simulate WEB-01 failure</button><button className="secondary" onClick={restore}>Restore redundancy</button></div>
                  </article>

                  <article className="panel"><div className="panelHead"><div><p className="eyebrow">Operations</p><h2>Recent events</h2></div></div><EventList events={events.slice(0,5)} /></article>
                </div>
              </>
            )}

            {tab === "Network" && (
              <article className="panel full">
                <div className="panelHead"><div><p className="eyebrow">Network services</p><h2>DNS and TCP paths</h2></div><span className="badge">4 configured paths</span></div>
                <div className="networkGrid">
                  {nodes.map((node) => (
                    <div className="networkCard" key={node.id}>
                      <div className="networkTop"><span className="serverGlyph">▦</span><span className={"statusDot " + (node.status === "Healthy" ? "ok" : "bad")}/></div>
                      <h3>{node.id}</h3><p>{node.role}</p>
                      <dl><div><dt>DNS</dt><dd>{node.dns}</dd></div><div><dt>TCP</dt><dd>{node.port}</dd></div><div><dt>Latency</dt><dd>{node.latency || "N/A"} ms</dd></div></dl>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {tab === "Backup" && (
              <div className="mainGrid">
                <article className="panel full"><p className="eyebrow">Recovery readiness</p><h2>Backup integrity</h2><p className="copy">The lab verifies matching SHA-256 values before reporting a successful backup.</p><Hash label="Source SHA-256"/><Hash label="Backup SHA-256"/><button className="primary" onClick={verifyBackup}>{backup === "Verifying" ? "Verifying..." : "Verify backup integrity"}</button></article>
                <article className="panel"><p className="eyebrow">Runbook</p><h2>Recovery controls</h2><ul className="checks"><li>✓ Evidence captured first</li><li>✓ Hash comparison available</li><li>✓ Failover simulation documented</li><li>✓ Post-recovery health check</li></ul></article>
              </div>
            )}

            {tab === "Events" && (
              <article className="panel full"><div className="panelHead"><div><p className="eyebrow">Evidence log</p><h2>Operational events</h2></div><button className="ghost" onClick={runScan}>Run another scan</button></div><EventList events={events}/></article>
            )}
          </section>
        </div>
      </section>
      <p className="disclaimer">Local portfolio simulation. No production infrastructure is connected or modified.</p>
    </main>
  );
}

function Metric({label,value,sub}) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>;
}

function EventList({events}) {
  return <div className="eventList">{events.map((event,index) => <div className="event" key={event.time + "-" + index}><span className={"eventDot " + event.level}/><div><strong>{event.message}</strong><small>{event.time} • local simulation</small></div></div>)}</div>;
}

function Hash({label}) {
  return <div className="hash"><span>{label}</span><code>8fe4c11451281c094a6578e6ddbf5eed...</code></div>;
}

export default App;
