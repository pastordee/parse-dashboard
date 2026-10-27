// Created: 2026-10-27
/*
 * Admin → Storage: what's in R2 (the media bucket), what nothing links any
 * more, and the trash — the weekly storage sweep, the same as the admin phone
 * app's Storage screen. Plan: prayer_circle docs/r2_storage_plan.md.
 *
 * cloud/admin/storage.cjs: adminStorageReport (latest sweep), adminStorageSweepNow
 * ({move} — Check now / Move unused to trash), adminStorageTrash,
 * adminStorageRestore ({key} or {date}), adminStorageJob (how a started job is
 * going). Moving puts each unused file in trash/<date>/; it stays there 30
 * days, then the sweep deletes it for good. Moves and restores are written to
 * the audit log.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from './adminApi';
import styles from './Admin.scss';

const POLL_MS = 3000;

function size(b) {
  b = b || 0;
  if (b >= 1 << 30) {
    return `${(b / (1 << 30)).toFixed(1)} GB`;
  }
  if (b >= 1 << 20) {
    return `${(b / (1 << 20)).toFixed(1)} MB`;
  }
  if (b >= 1 << 10) {
    return `${Math.round(b / (1 << 10))} KB`;
  }
  return `${b} B`;
}

class StoragePage extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Storage';
    this.state = {
      loading: true, error: null, report: null, trash: null, tab: 'unused',
      running: null, open: {}, toast: null,
    };
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    this.gone = true;
    clearTimeout(this.toastTimer);
  }

  say(text, bad = false) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: { text, bad } });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), bad ? 8000 : 5000);
  }

  async load(quiet = false) {
    if (!quiet) {
      this.setState({ loading: true, error: null });
    }
    try {
      const [report, trash] = await Promise.all([
        adminCall(this.context, 'adminStorageReport'),
        adminCall(this.context, 'adminStorageTrash'),
      ]);
      this.setState({ report, trash, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  // Starts a job, waits for it, then reloads.
  async run(fn, params, what) {
    this.setState({ running: what });
    try {
      const { jobId } = await adminCall(this.context, fn, params);
      for (let i = 0; i < 200 && !this.gone; i++) {
        await new Promise(r => setTimeout(r, POLL_MS));
        const j = await adminCall(this.context, 'adminStorageJob', { id: jobId }).catch(() => null);
        if (!j || j.status === 'running' || j.status === 'pending') {
          continue;
        }
        if (j.status === 'succeeded') {
          this.say(`${what}: done.${j.message ? `\n${j.message}` : ''}`);
        } else {
          this.say(`${what} failed: ${j.message || j.status}`, true);
        }
        break;
      }
      await this.load(true);
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setState({ running: null });
    }
  }

  check() {
    this.run('adminStorageSweepNow', { move: false }, 'Checking storage');
  }

  moveUnused() {
    const n = this.state.report?.latest?.counts?.orphan?.files || 0;
    if (!window.confirm(
      `Check storage again and move every unused file to trash?\n\nThe last check found ${n}. ` +
      'They stay in trash for 30 days and can be put back from here.')) {
      return;
    }
    this.run('adminStorageSweepNow', { move: true }, 'Moving unused files to trash');
  }

  restore(item) {
    if (!window.confirm(`Put this file back?\n\n${item.key.split('/').slice(2).join('/')}`)) {
      return;
    }
    this.run('adminStorageRestore', { key: item.key }, 'Restoring a file');
  }

  restoreDay(d) {
    if (!window.confirm(
      `Put back all ${d.files} files moved to trash on ${d.day}?\n\n` +
      'Files with a newer copy in place are left as they are.')) {
      return;
    }
    this.run('adminStorageRestore', { date: d.day }, `Restoring ${d.day}`);
  }

  renderFiles(list, action) {
    if (!list || !list.length) {
      return <div className={styles.empty}>None.</div>;
    }
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>File</th>
            <th style={{ textAlign: 'right' }}>Size</th>
            <th>Last changed</th>
            {action && <th />}
          </tr>
        </thead>
        <tbody>
          {list.map(f => (
            <tr key={f.key}>
              <td><div className={styles.mono}>{f.key}</div></td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{size(f.size)}</td>
              <td style={{ whiteSpace: 'nowrap' }} className={styles.meta}>{when(f.modified)}</td>
              {action && <td style={{ textAlign: 'right' }}>{action(f)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderTrash() {
    const { trash, running, open } = this.state;
    if (!trash || !trash.days.length) {
      return <div className={styles.empty}>Trash is empty.</div>;
    }
    return trash.days.map(d => {
      const age = Math.floor((Date.now() - new Date(`${d.day}T00:00:00Z`).getTime()) / 86400000);
      const left = Math.max(0, trash.keepDays - age);
      const isOpen = !!open[d.day];
      return (
        <div key={d.day} className={styles.card}>
          <div className={styles.cardHead} style={{ marginBottom: isOpen ? 10 : 0 }}>
            <span className={styles.cardTitle}>{d.day}</span>
            <span className={styles.meta}>{d.files} files · {size(d.bytes)}</span>
            <span className={`${styles.pill} ${left <= 3 ? styles.pillRed : ''}`}>
              deleted for good in {left} day{left === 1 ? '' : 's'}
            </span>
            <span style={{ flex: 1 }} />
            <button className={styles.linkBtn} onClick={() => this.setState({ open: { ...open, [d.day]: !isOpen } })}>
              {isOpen ? 'Hide files' : 'Show files'}
            </button>
            <button className={styles.linkBtn} disabled={!!running} onClick={() => this.restoreDay(d)}>Restore all</button>
          </div>
          {isOpen && this.renderFiles(d.items, f => (
            <button className={styles.linkBtn} disabled={!!running} onClick={() => this.restore(f)}>Restore</button>
          ))}
          {isOpen && d.items.length < d.files && (
            <div className={styles.meta}>Showing the first {d.items.length} of {d.files}.</div>
          )}
        </div>
      );
    });
  }

  renderReport() {
    const { report, tab } = this.state;
    const r = report && report.latest;
    if (!r) {
      return <div className={styles.empty}>No check has run yet. It runs every Sunday at 04:00 (London), or use Check now.</div>;
    }
    const n = k => (r.counts && r.counts[k]) || { files: 0, bytes: 0 };
    const days = r.minAgeDays || 7;
    const stat = (title, c, hint, colour) => (
      <div className={styles.card}>
        <div className={styles.meta}>{title}</div>
        <div className={styles.bigNum} style={colour ? { color: colour } : null}>{size(c.bytes)}</div>
        <div className={styles.meta}>{c.files} files · {hint}</div>
      </div>
    );
    const folders = Object.entries(r.folders || {}).sort((a, b) => b[1].bytes - a[1].bytes);
    const tabs = [
      ['unused', `Unused (${(r.orphans || []).length})`],
      ['weak', `Old links only (${(r.weak || []).length})`],
      ['trash', `Trash (${this.state.trash ? this.state.trash.days.reduce((s, d) => s + d.files, 0) : 0})`],
      ['folders', 'Folders'],
      ['users', 'Biggest users'],
    ];

    let list = null;
    if (tab === 'unused') {
      list = (
        <>
          <p className={styles.hint}>
            {r.mode === 'move'
              ? 'These were moved to trash on this run.'
              : 'Move unused to trash moves these (after checking again).'}
          </p>
          {this.renderFiles(r.orphans)}
        </>
      );
    } else if (tab === 'weak') {
      list = (
        <>
          <p className={styles.hint}>Linked only from old push notifications, stale lists or share snapshots. They are kept.</p>
          {this.renderFiles(r.weak)}
        </>
      );
    } else if (tab === 'trash') {
      list = this.renderTrash();
    } else if (tab === 'folders') {
      list = (
        <table className={styles.table}>
          <thead>
            <tr><th>Folder</th><th style={{ textAlign: 'right' }}>Files</th><th style={{ textAlign: 'right' }}>Size</th><th style={{ textAlign: 'right' }}>Unused</th></tr>
          </thead>
          <tbody>
            {folders.map(([name, f]) => (
              <tr key={name}>
                <td><div className={styles.mono}>{name}/</div></td>
                <td style={{ textAlign: 'right' }}>{f.files}</td>
                <td style={{ textAlign: 'right' }}>{size(f.bytes)}</td>
                <td style={{ textAlign: 'right' }} className={f.orphanFiles ? styles.danger : styles.meta}>
                  {f.orphanFiles ? `${f.orphanFiles} · ${size(f.orphanBytes)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      list = (
        <table className={styles.table}>
          <thead>
            <tr><th>User folder</th><th style={{ textAlign: 'right' }}>Files</th><th style={{ textAlign: 'right' }}>Size</th></tr>
          </thead>
          <tbody>
            {(r.users || []).slice(0, 30).map(u => (
              <tr key={u.id}>
                <td><div className={styles.mono}>Users/{u.id}/</div></td>
                <td style={{ textAlign: 'right' }}>{u.files}</td>
                <td style={{ textAlign: 'right' }}>{size(u.bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <>
        <p className={styles.hint}>
          {r.objects} files · {size(r.bytes)} · checked {ago(r.finishedAt)} ({when(r.finishedAt)}),{' '}
          {r.mode === 'move' ? 'unused files moved to trash' : 'report only'}.
          Unused = nothing in the database links it and it is over {days} days old.
          app_assets/, PrayerCircle/ and trash/ are never judged.
        </p>
        <div className={styles.statGrid}>
          {stat('In use', n('linked'), 'linked from the database', '#3c9d31')}
          {stat('Unused', n('orphan'), `no link, over ${days} days`, '#e74c3c')}
          {stat('Old links only', n('weak'), 'kept', '#e0930b')}
          {stat('Too new to judge', n('recent'), `under ${days} days`)}
          {r.moved && stat('Moved last run', { files: r.moved.files, bytes: r.moved.bytes },
            `to trash/${r.moved.date}${r.moved.failed ? ` · ${r.moved.failed} failed` : ''}`)}
        </div>
        <div className={styles.tabs} style={{ marginTop: 20 }}>
          {tabs.map(([id, label]) => (
            <button key={id} className={`${styles.tab} ${tab === id ? styles.tabOn : ''}`} onClick={() => this.setState({ tab: id })}>
              {label}
            </button>
          ))}
        </div>
        {list}
      </>
    );
  }

  renderContent() {
    const { loading, error, running, toast } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Storage">
        <div className={styles.barActions}>
          <Button value={running === 'Checking storage' ? 'Checking…' : 'Check now'} primary={false} disabled={!!running} onClick={() => this.check()} />
          <Button value={running && running.startsWith('Moving') ? 'Moving…' : 'Move unused to trash'} primary={true} disabled={!!running} onClick={() => this.moveUnused()} />
          <Button value="Refresh" primary={false} disabled={!!running} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );
    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>
            {running && <div className={styles.notice}>{running}… this takes about a minute.</div>}
            {error ? <div className={styles.error}>Storage could not be loaded: {error}</div> : !loading && this.renderReport()}
          </div>
        </LoaderContainer>
        {toolbar}
        {toast && <div className={`${styles.toast} ${toast.bad ? styles.toastBad : ''}`}>{toast.text}</div>}
      </div>
    );
  }
}

export default StoragePage;
