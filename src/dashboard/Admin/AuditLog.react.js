// Created: 2026-09-27
/*
 * Admin → Audit log: the latest admin actions (who, what, on what), from the
 * append-only AdminAudit class via adminAuditList — the same as the admin
 * phone app. Actions taken from this dashboard show as "master".
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when } from './adminApi';
import styles from './Admin.scss';

function details(d) {
  if (!d || typeof d !== 'object' || !Object.keys(d).length) {
    return '';
  }
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${v && typeof v === 'object' ? (v.iso || JSON.stringify(v)) : v}`)
    .join('\n');
}

class AuditLog extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Audit log';
    this.state = { loading: true, error: null, entries: [], action: '' };
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: null });
    try {
      const entries = await adminCall(this.context, 'adminAuditList', { limit: 200 });
      this.setState({ entries: entries || [], loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  renderContent() {
    const { loading, error, entries, action } = this.state;
    const actions = [...new Set(entries.map(e => e.action).filter(Boolean))].sort();
    const shown = action ? entries.filter(e => e.action === action) : entries;
    const toolbar = (
      <Toolbar section="Admin" subsection="Audit log">
        <div className={styles.barActions}>
          <select value={action} onChange={e => this.setState({ action: e.target.value })}>
            <option value="">All actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>The audit log couldn't be loaded: {error}</div>;
    } else if (!loading) {
      body = shown.length === 0 ? <div className={styles.empty}>No entries.</div> : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>On</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(e => (
              <tr key={e.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{when(e.at)}</td>
                <td>
                  <strong>{e.username || 'master'}</strong>
                  <div className={styles.meta}>{(e.roles || []).join(', ')}</div>
                </td>
                <td>{e.action}</td>
                <td className={styles.meta}>{e.targetType}{e.targetId ? ` ${e.targetId}` : ''}</td>
                <td><div className={styles.mono}>{details(e.details)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>{body}</div>
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default AuditLog;
