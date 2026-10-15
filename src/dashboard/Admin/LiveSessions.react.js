// Created: 2026-10-10
/*
 * Admin → Live: every live session running now — Creator live sermons
 * (preparing or on air), Creator live reels, church feed livestreams, group
 * prayer rooms, and any
 * LiveKit room with nothing behind it (stuck) — how long each has been on,
 * who is in it, whether it has been reported, and Shut down.
 *
 * cloud/admin/liveSessions.cjs: adminLiveSessions, adminEndLiveSession. Ending
 * stops the recording, closes the room for everyone in it and resets the
 * session; it is written to the audit log with the reason given here.
 * Refreshes itself every 15 seconds while the page is open.
 *
 * 2026-10-15 — what it costs (owner: "if 100 sermons are live at once, what
 * strain does that put on the server"): cloud/admin/liveMetrics.cjs, fed every
 * 15 s by the EU box's live-metrics agent.
 *   Now      server load (CPU, memory, bandwidth), "room for N more
 *            recordings" from the measured cost of one, and per session the
 *            recording's CPU / memory with its graph since it started.
 *   History  past sessions and what each cost.
 *   Reports  the daily report (any day with lives) and Sunday's weekly one —
 *            the same text that is emailed to admin@.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when } from './adminApi';
import styles from './Admin.scss';

const REFRESH_MS = 15000;

// The server sends each session's label; these are only the fallback for an
// older server.
const KIND = {
  sermon: 'Live sermon',
  reel: 'Live reel',
  feed: 'Feed livestream',
  group: 'Prayer room',
  room: 'Room only',
};

// "2h 14m" since a start time.
function running(start, now) {
  if (!start) {
    return '—';
  }
  const mins = Math.max(0, Math.round((new Date(now) - new Date(start)) / 60000));
  return duration(mins);
}

function duration(mins) {
  if (mins == null) {
    return '—';
  }
  if (mins < 60) {
    return `${mins}m`;
  }
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ${mins % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

function statusPill(s) {
  if (s.status === 'live') {
    return styles.pillRed;
  }
  if (s.status === 'on break' || s.status === 'preparing') {
    return styles.pillAmber;
  }
  return styles.pillBlue;
}

const gb = mb => (mb == null ? '—' : `${(mb / 1024).toFixed(1)} GB`);
const pct = v => (v == null ? '—' : `${Math.round(v)}%`);

/// A small line graph. `points` = numbers, `max` = top of the scale.
function Spark({ points, max, width = 220, height = 38 }) {
  if (!points || points.length < 2) {
    return <div className={styles.meta}>Not enough readings yet</div>;
  }
  const top = Math.max(max || 0, ...points, 1);
  const step = width / (points.length - 1);
  const d = points.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / top) * (height - 2) - 1).toFixed(1)}`).join(' ');
  return (
    <svg className={styles.spark} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={d} fill="none" strokeWidth="1.5" />
    </svg>
  );
}

/// A bar filled to `value` of `max`, amber past 60%, red past 80%.
function Meter({ value, max }) {
  const share = max ? Math.min(1, Math.max(0, value / max)) : 0;
  const tone = share > 0.8 ? styles.meterRed : share > 0.6 ? styles.meterAmber : styles.meterGreen;
  return (
    <div className={styles.meter}>
      <div className={`${styles.meterFill} ${tone}`} style={{ width: `${Math.round(share * 100)}%` }} />
    </div>
  );
}

class LiveSessions extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Live';
    this.state = {
      loading: true, error: null, sessions: [], now: null, livekit: true, busy: null, toast: null,
      tab: 'now', metrics: null, metricsError: null, open: {},
      historyDays: 7, history: null, reports: null, report: null,
    };
  }

  componentDidMount() {
    this.load();
    this.timer = setInterval(() => !document.hidden && this.state.tab === 'now' && this.load(true), REFRESH_MS);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    clearTimeout(this.toastTimer);
  }

  say(text, bad = false) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: { text, bad } });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), bad ? 8000 : 3500);
  }

  async load(quiet = false) {
    if (!quiet) {
      this.setState({ loading: true, error: null });
    }
    // The session list must never wait on (or fail with) the metrics.
    const metrics = adminCall(this.context, 'adminLiveMetrics')
      .then(m => this.setState({ metrics: m, metricsError: null }))
      .catch(e => this.setState({ metricsError: e.message || String(e) }));
    try {
      const r = await adminCall(this.context, 'adminLiveSessions');
      this.setState({ sessions: r.sessions || [], now: r.now, livekit: r.livekit !== false, loading: false, error: null });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
    await metrics;
  }

  async loadHistory(days = this.state.historyDays) {
    this.setState({ historyDays: days, history: null });
    try {
      const r = await adminCall(this.context, 'adminLiveHistory', { days });
      this.setState({ history: r.sessions || [] });
    } catch (e) {
      this.say(e.message || String(e), true);
      this.setState({ history: [] });
    }
  }

  async loadReports() {
    this.setState({ reports: null });
    try {
      this.setState({ reports: await adminCall(this.context, 'adminLiveReports') });
    } catch (e) {
      this.say(e.message || String(e), true);
      this.setState({ reports: [] });
    }
  }

  async openReport(id) {
    try {
      this.setState({ report: await adminCall(this.context, 'adminLiveReports', { id }) });
    } catch (e) {
      this.say(e.message || String(e), true);
    }
  }

  setTab(tab) {
    this.setState({ tab, report: null });
    if (tab === 'history' && !this.state.history) {
      this.loadHistory();
    }
    if (tab === 'reports' && !this.state.reports) {
      this.loadReports();
    }
  }

  async end(s) {
    const what = `${s.label || KIND[s.kind] || 'Session'}: "${s.title}"${s.host ? ` (${s.host})` : ''}`;
    const reason = window.prompt(
      `Shut down ${what}?\n\nEveryone in it is disconnected at once and any recording stops. ` +
      'This cannot be undone.\n\nReason (kept in the audit log):', s.reports ? 'Reported' : '');
    if (reason === null) {
      return;
    }
    this.setState({ busy: s.id });
    try {
      await adminCall(this.context, 'adminEndLiveSession', { kind: s.kind, id: s.id, roomName: s.roomName, reason });
      this.say(`Shut down: ${s.title}`);
      await this.load(true);
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setState({ busy: null });
    }
  }

  // ── Now ───────────────────────────────────────────────────────────────

  renderLoad() {
    const { metrics, metricsError } = this.state;
    if (metricsError) {
      return <div className={styles.notice}>Server load couldn’t be loaded: {metricsError}</div>;
    }
    if (!metrics) {
      return null;
    }
    const n = metrics.now;
    if (!n) {
      return <div className={styles.notice}>No readings from the live server yet. The live-metrics agent on the EU box sends one every 15 seconds.</div>;
    }
    const cap = metrics.capacity;
    const hour = metrics.lastHour || [];
    return (
      <>
        {!metrics.agentOnline && (
          <div className={styles.notice}>The live-metrics agent hasn’t reported since {when(n.at)} — these numbers are old.</div>
        )}
        <div className={styles.statGrid}>
          <div className={styles.card}>
            <div className={styles.meta}>CPU ({n.cores} threads)</div>
            <div className={styles.bigNum}>{pct(n.cpuPct)}</div>
            <Meter value={n.cpuPct} max={100} />
            <div className={styles.meta}>recordings use {pct(n.recordingCpuPct / Math.max(1, n.cores))} of it · load {n.load1}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.meta}>Memory</div>
            <div className={styles.bigNum}>{gb(n.memUsedMB)}</div>
            <Meter value={n.memUsedMB} max={n.memTotalMB} />
            <div className={styles.meta}>of {gb(n.memTotalMB)} · disk {pct(n.diskUsedPct)}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.meta}>Bandwidth (1 Gbit/s link)</div>
            <div className={styles.bigNum}>{n.netOutMbps} <span className={styles.unit}>Mbit/s out</span></div>
            <Meter value={Math.max(n.netOutMbps, n.netInMbps)} max={1000} />
            <div className={styles.meta}>{n.netInMbps} Mbit/s in (cameras arriving)</div>
          </div>
          <div className={styles.card}>
            <div className={styles.meta}>On air</div>
            <div className={styles.bigNum}>{n.lives} <span className={styles.unit}>live</span></div>
            <div className={styles.meta}>{n.recordings} recording · {n.viewers} watching over LiveKit</div>
          </div>
          <div className={styles.card}>
            <div className={styles.meta}>Capacity</div>
            {cap ? (
              <>
                <div className={styles.bigNum}>{cap.moreRecordings} <span className={styles.unit}>more recordings</span></div>
                <div className={styles.meta}>
                  This box: about {cap.recordingsPerBox} at once (keeping {100 - cap.headroomPct}% spare) ·
                  one recording ≈ {cap.perRecordingCpuPct}% of a thread{cap.perRecordingMemMB ? `, ${gb(cap.perRecordingMemMB)}` : ''}
                  {cap.limitedBy === 'memory' ? ' · limited by memory' : ''}
                </div>
              </>
            ) : (
              <div className={styles.meta}>Shown once something has been recorded — it is worked out from what recordings really cost.</div>
            )}
          </div>
        </div>
        {hour.length > 1 && (
          <div className={`${styles.card} ${styles.graphs}`}>
            <div>
              <div className={styles.meta}>CPU, last hour</div>
              <Spark points={hour.map(h => h[1])} max={100} width={260} />
            </div>
            <div>
              <div className={styles.meta}>Live sessions, last hour</div>
              <Spark points={hour.map(h => h[4])} width={260} />
            </div>
            <div>
              <div className={styles.meta}>Bandwidth out, last hour</div>
              <Spark points={hour.map(h => h[3])} width={260} />
            </div>
          </div>
        )}
      </>
    );
  }

  renderDetails(m) {
    if (!m) {
      return <div className={styles.meta}>No readings for this session yet.</div>;
    }
    const series = m.series || [];
    return (
      <div className={styles.details}>
        <div>
          <div className={styles.meta}>Viewers (peak {m.peakViewers}, average {m.avgViewers})</div>
          <Spark points={series.map(p => p[1])} />
        </div>
        <div>
          <div className={styles.meta}>
            Recording CPU {m.recording ? `(average ${m.recCpuAvg}%, peak ${m.recCpuPeak}% of a thread)` : '(not recording)'}
          </div>
          <Spark points={series.map(p => p[2])} max={100} />
        </div>
        <div>
          <div className={styles.meta}>Recording memory {m.recMemPeakMB ? `(peak ${gb(m.recMemPeakMB)})` : ''}</div>
          <Spark points={series.map(p => p[3])} />
        </div>
        <div className={styles.meta}>
          Total recording work so far: {Math.round((m.recCpuSeconds || 0) / 60)} CPU-minutes · first reading {when(m.startedAt)}
        </div>
      </div>
    );
  }

  renderNow() {
    const { sessions, now, livekit, busy, metrics, open } = this.state;
    const byRoom = {};
    for (const m of (metrics && metrics.sessions) || []) {
      byRoom[m.roomName] = m;
    }
    return (
      <>
        <p className={styles.hint}>
          Everything live or getting ready right now, and what it costs the live server. Refreshes every 15 seconds.
          Shut down disconnects everyone in the session and stops its recording.
        </p>
        {this.renderLoad()}
        {!livekit && <div className={styles.notice}>The live server isn’t configured here — viewer counts and stuck rooms can’t be shown.</div>}
        {sessions.length === 0 ? (
          <div className={styles.empty}>Nothing is live right now.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Session</th>
                <th>Status</th>
                <th>Running</th>
                <th>In it</th>
                <th>Recording</th>
                <th>Reports</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const key = `${s.kind}-${s.id}`;
                const m = byRoom[s.roomName];
                const last = m && m.series && m.series.length ? m.series[m.series.length - 1] : null;
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td>
                        <strong>{s.title}</strong>
                        <div className={styles.meta}>
                          {s.label || KIND[s.kind] || s.kind}
                          {s.where && s.where !== s.title ? ` · ${s.where}` : ''}
                          {s.host ? ` · host ${s.host}` : ''}
                        </div>
                        <div className={`${styles.meta} ${styles.mono}`}>{s.roomName || s.id}</div>
                      </td>
                      <td>
                        <span className={`${styles.pill} ${statusPill(s)}`}>{s.status}</span>
                        {s.broadcasterGoneAt && <div className={styles.meta}>host left {when(s.broadcasterGoneAt)}</div>}
                      </td>
                      <td>
                        {running(s.startedAt, now)}
                        <div className={styles.meta}>since {when(s.startedAt) || '—'}</div>
                      </td>
                      <td>
                        {s.participants}
                        {s.waiting ? <div className={styles.meta}>{s.waiting} waiting</div> : null}
                        {m ? <div className={styles.meta}>peak {m.peakViewers}</div> : null}
                      </td>
                      <td>
                        {m && m.recording ? (
                          <>
                            {last ? `${last[2]}% CPU` : '—'}
                            <div className={styles.meta}>{last ? gb(last[3]) : ''} · avg {m.recCpuAvg}%</div>
                          </>
                        ) : '—'}
                      </td>
                      <td>{s.reports ? <span className={`${styles.pill} ${styles.pillRed}`}>{s.reports}</span> : '—'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className={styles.linkBtn} onClick={() => this.setState({ open: { ...open, [key]: !open[key] } })}>
                          {open[key] ? 'Hide' : 'Details'}
                        </button>
                        {' · '}
                        <button className={`${styles.linkBtn} ${styles.danger}`} disabled={!!busy} onClick={() => this.end(s)}>
                          {busy === s.id ? 'Shutting down…' : 'Shut down'}
                        </button>
                      </td>
                    </tr>
                    {open[key] && (
                      <tr>
                        <td colSpan={7}>{this.renderDetails(m)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ── History ───────────────────────────────────────────────────────────

  renderHistory() {
    const { history, historyDays } = this.state;
    return (
      <>
        <div className={styles.cardHead}>
          {[1, 7, 30, 90].map(d => (
            <button key={d} className={`${styles.tab} ${historyDays === d ? styles.tabOn : ''}`} onClick={() => this.loadHistory(d)}>
              {d === 1 ? 'Last 24 hours' : `Last ${d} days`}
            </button>
          ))}
        </div>
        {!history ? (
          <div className={styles.empty}>Loading…</div>
        ) : history.length === 0 ? (
          <div className={styles.empty}>No live sessions in this period.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Started</th>
                <th>Session</th>
                <th>Length</th>
                <th>Viewers</th>
                <th>Recording CPU</th>
                <th>Memory</th>
                <th>CPU-minutes</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>{when(h.startedAt)}</td>
                  <td>
                    <strong>{h.title}</strong>
                    <div className={styles.meta}>{KIND[h.kind] || h.kind}{h.church ? ` · ${h.church}` : ''}</div>
                  </td>
                  <td>{duration(h.minutes)}</td>
                  <td>{h.peakViewers}<div className={styles.meta}>avg {h.avgViewers}</div></td>
                  <td>{h.recording ? `${h.recCpuAvg}%` : '—'}<div className={styles.meta}>{h.recording ? `peak ${h.recCpuPeak}%` : 'not recorded'}</div></td>
                  <td>{h.recMemPeakMB ? gb(h.recMemPeakMB) : '—'}</td>
                  <td>{h.recording ? Math.round(h.recCpuSeconds / 60) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ── Reports ───────────────────────────────────────────────────────────

  renderReports() {
    const { reports, report } = this.state;
    if (report) {
      return (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <button className={styles.linkBtn} onClick={() => this.setState({ report: null })}>← All reports</button>
            <span className={`${styles.pill} ${report.type === 'weekly' ? styles.pillBlue : styles.pillGreen}`}>{report.type}</span>
            <span className={styles.meta}>{report.day}</span>
          </div>
          <pre className={styles.reportText}>{report.text}</pre>
        </div>
      );
    }
    return (
      <>
        <p className={styles.hint}>
          A report for every day that had lives, made at 23:45 London time, and a weekly one on Sunday nights.
          Each is also emailed to admin@.
        </p>
        {!reports ? (
          <div className={styles.empty}>Loading…</div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>No reports yet — the first comes tonight after a day with lives.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Type</th>
                <th>Summary</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>{r.day}</td>
                  <td><span className={`${styles.pill} ${r.type === 'weekly' ? styles.pillBlue : styles.pillGreen}`}>{r.type}</span></td>
                  <td>{r.headline || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.linkBtn} onClick={() => this.openReport(r.id)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  renderContent() {
    const { loading, error, toast, tab } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Live">
        <div className={styles.barActions}>
          <Button value="Refresh" primary={false} onClick={() => (tab === 'history' ? this.loadHistory() : tab === 'reports' ? this.loadReports() : this.load())} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Live sessions couldn’t be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          <div className={styles.tabs}>
            {[['now', 'Now'], ['history', 'History'], ['reports', 'Reports']].map(([id, label]) => (
              <button key={id} className={`${styles.tab} ${tab === id ? styles.tabOn : ''}`} onClick={() => this.setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'now' && this.renderNow()}
          {tab === 'history' && this.renderHistory()}
          {tab === 'reports' && this.renderReports()}
        </>
      );
    }

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>{body}</div>
        </LoaderContainer>
        {toolbar}
        {toast && <div className={`${styles.toast} ${toast.bad ? styles.toastBad : ''}`}>{toast.text}</div>}
      </div>
    );
  }
}

export default LiveSessions;
