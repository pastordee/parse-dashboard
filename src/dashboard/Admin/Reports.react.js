// Created: 2026-09-27
/*
 * Admin → Reports: things people reported in the app (prayers, posts, reels,
 * comments…), with Hide or Dismiss. Same functions as the admin phone app
 * (cloud/admin/reports.cjs): adminReportsList { scope } and
 * adminReportAct { reportId, action: 'hide' | 'dismiss' }.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, ago } from './adminApi';
import styles from './Admin.scss';

const person = p => (p ? p.name || p.username || p.id : 'unknown');

class Reports extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Reports';
    this.state = { loading: true, error: null, scope: 'open', reports: [], busy: null, toast: null };
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    clearTimeout(this.toastTimer);
  }

  say(text, bad = false) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: { text, bad } });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), bad ? 8000 : 3500);
  }

  async load(scope = this.state.scope) {
    this.setState({ loading: true, error: null, scope });
    try {
      const r = await adminCall(this.context, 'adminReportsList', { scope });
      this.setState({ reports: r.reports || [], loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  async act(report, action) {
    if (action === 'hide' && !window.confirm(`Hide this ${report.label}? It disappears from the app for everyone.`)) {
      return;
    }
    this.setState({ busy: report.id });
    try {
      await adminCall(this.context, 'adminReportAct', { reportId: report.id, action });
      this.say(action === 'hide' ? 'Hidden' : 'Dismissed');
      await this.load();
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setState({ busy: null });
    }
  }

  renderReport(r) {
    const open = !r.moderationAction;
    return (
      <div key={r.id} className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.pill}>{r.label}</span>
          {open
            ? <span className={`${styles.pill} ${styles.pillAmber}`}>Open</span>
            : <span className={`${styles.pill} ${r.moderationAction === 'hide' ? styles.pillRed : ''}`}>
              {r.moderationAction === 'hide' ? 'Hidden' : 'Dismissed'}
            </span>}
          {r.churchModerated && <span className={`${styles.pill} ${styles.pillBlue}`}>Church moderated</span>}
          <span className={styles.meta}>reported {ago(r.createdAt)}</span>
        </div>
        <div className={styles.body}>
          {r.contentMissing ? <em>The reported item no longer exists.</em> : (r.excerpt || <em>(no text)</em>)}
        </div>
        <div className={styles.meta} style={{ marginTop: 8 }}>
          By {person(r.author)} · reported by {person(r.reporter)}
          {r.reason ? ` · reason: ${r.reason}` : ''}
          {!open && ` · ${r.moderationAction === 'hide' ? 'hidden' : 'dismissed'} by ${r.moderationBy || 'someone'} ${ago(r.moderationAt)}`}
        </div>
        {open && (
          <div className={styles.actions}>
            {this.state.busy === r.id ? <span className={styles.meta}>Working…</span> : (
              <>
                {r.hideable && !r.contentMissing && <Button value="Hide it" primary={true} color="red" onClick={() => this.act(r, 'hide')} />}
                <Button value="Dismiss" primary={false} onClick={() => this.act(r, 'dismiss')} />
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  renderContent() {
    const { loading, error, scope, reports, toast } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Reports">
        <div className={styles.barActions}>
          <select value={scope} onChange={e => this.load(e.target.value)}>
            <option value="open">Open reports</option>
            <option value="all">All reports</option>
          </select>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Reports couldn't be loaded: {error}</div>;
    } else if (!loading) {
      body = reports.length
        ? reports.map(r => this.renderReport(r))
        : <div className={styles.empty}>{scope === 'open' ? 'No open reports. 🎉' : 'No reports yet.'}</div>;
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

export default Reports;
