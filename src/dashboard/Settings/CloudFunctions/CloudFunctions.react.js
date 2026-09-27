// Created: 2026-09-27
/*
 * App Settings → Cloud functions: every cloud function, job and trigger the
 * server registers, with the file and line it comes from, call counts since
 * the last restart, and a read-only view of its code.
 *
 * Data: adminListCloudFunctions / adminCloudFunctionSource (master key only),
 * from cloud/system/functionRegistry.cjs on the server. Deliberately
 * view-only — code is changed in the editor, not from a web page.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from 'dashboard/Admin/adminApi';
import styles from 'dashboard/Admin/Admin.scss';

const TABS = [
  { key: 'functions', label: 'Functions' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'triggers', label: 'Triggers' },
];

const folderOf = file => (file && file.includes('/') ? file.split('/')[0] : '(top level)');

class CloudFunctions extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'App Settings';
    this.subsection = 'Cloud functions';
    this.state = {
      loading: true, error: null, data: null, tab: 'functions', search: '', sort: 'folder',
      open: null, source: null, sourceError: null,
    };
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: null });
    try {
      const data = await adminCall(this.context, 'adminListCloudFunctions');
      this.setState({ data, loading: false });
    } catch (e) {
      const msg = e.message || String(e);
      this.setState({
        error: /Invalid function/i.test(msg)
          ? 'The server does not have the function list yet — it arrives with the next Parse restart.'
          : msg,
        loading: false,
      });
    }
  }

  async toggleSource(row) {
    const key = `${row.kind}:${row.name}:${row.className}:${row.file}:${row.line}`;
    if (this.state.open === key) {
      this.setState({ open: null, source: null, sourceError: null });
      return;
    }
    this.setState({ open: key, source: null, sourceError: null });
    if (!row.file) {
      this.setState({ sourceError: "Where this was defined couldn't be worked out." });
      return;
    }
    try {
      const source = await adminCall(this.context, 'adminCloudFunctionSource', { file: row.file, line: row.line });
      if (this.state.open === key) {
        this.setState({ source });
      }
    } catch (e) {
      this.setState({ sourceError: e.message || String(e) });
    }
  }

  rows() {
    const { data, tab, search, sort } = this.state;
    const q = search.trim().toLowerCase();
    let rows = (data[tab] || []).filter(r => !q ||
      [r.name, r.className, r.file].some(v => v && String(v).toLowerCase().includes(q)));
    rows = [...rows];
    if (sort === 'calls') {
      rows.sort((a, b) => (b.calls || 0) - (a.calls || 0) || a.name.localeCompare(b.name));
    } else if (sort === 'errors') {
      rows.sort((a, b) => (b.errors || 0) - (a.errors || 0) || (b.calls || 0) - (a.calls || 0));
    } else if (sort === 'name') {
      rows.sort((a, b) => (a.className || a.name).localeCompare(b.className || b.name));
    } else {
      // Folder first, so files directly in cloud/ (main.cjs…) form one group
      // instead of sorting in among the folders and repeating the heading.
      rows.sort((a, b) => folderOf(a.file).localeCompare(folderOf(b.file)) ||
        (a.file || '').localeCompare(b.file || '') || (a.line || 0) - (b.line || 0));
    }
    return rows;
  }

  renderFlags(r) {
    const flags = [];
    if (r.retired) {
      flags.push(<span key="r" className={styles.pill} title="Listed in system/retiredFunctions.cjs — never registered">retired</span>);
    }
    if (r.duplicate) {
      flags.push(<span key="d" className={`${styles.pill} ${styles.pillAmber}`} title="Defined more than once — the last definition wins">defined twice</span>);
    }
    if (r.registered === false && !r.retired) {
      flags.push(<span key="n" className={`${styles.pill} ${styles.pillRed}`} title="Recorded but not held by parse-server">not registered</span>);
    }
    return flags;
  }

  renderSource() {
    const { source, sourceError } = this.state;
    if (sourceError) {
      return <div className={styles.error} style={{ margin: 0 }}>{sourceError}</div>;
    }
    if (!source) {
      return <div className={styles.meta}>Loading code…</div>;
    }
    return (
      <div>
        <div className={styles.meta} style={{ marginBottom: 6 }}>
          cloud/{source.file} from line {source.startLine} — read-only
        </div>
        <pre style={{
          margin: 0, maxHeight: 460, overflow: 'auto', background: '#1e2433', color: '#e6e9ef',
          borderRadius: 6, padding: '12px 14px', fontSize: 12, lineHeight: 1.5,
        }}>{source.code}</pre>
      </div>
    );
  }

  renderTable(rows) {
    const { tab, open, sort } = this.state;
    const counted = tab !== 'triggers';
    const colSpan = counted ? 5 : 3;
    let lastFolder = null;
    const body = [];
    for (const r of rows) {
      const key = `${r.kind}:${r.name}:${r.className}:${r.file}:${r.line}`;
      const folder = folderOf(r.file);
      if (sort === 'folder' && folder !== lastFolder) {
        lastFolder = folder;
        body.push(
          <tr key={`folder:${folder}`}>
            <td colSpan={colSpan} style={{ background: '#f5f6fa', fontWeight: 700, fontSize: 12, color: '#7f8c8d' }}>
              {folder}/
            </td>
          </tr>
        );
      }
      body.push(
        <tr key={key} onClick={() => this.toggleSource(r)} style={{ cursor: 'pointer' }}
          className={r.retired ? styles.dim : ''}>
          <td>
            <strong>{tab === 'triggers' ? (r.className || '—') : r.name}</strong>
            {tab === 'triggers' && <span className={styles.meta}> · {r.kind}</span>}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>{this.renderFlags(r)}</div>
          </td>
          <td className={styles.meta}>{r.file ? `${r.file}:${r.line}` : '—'}</td>
          {counted && <td>{(r.calls || 0).toLocaleString()}</td>}
          {counted && (
            <td className={r.errors ? styles.danger : ''} title={r.lastError || ''}>
              {(r.errors || 0).toLocaleString()}
            </td>
          )}
          <td className={styles.meta}>{counted ? (r.lastAt ? ago(r.lastAt) : 'not since restart') : ''}</td>
        </tr>
      );
      if (open === key) {
        body.push(
          <tr key={`${key}:src`}>
            <td colSpan={colSpan} style={{ background: '#fafbfc' }}>{this.renderSource()}</td>
          </tr>
        );
      }
    }
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{tab === 'triggers' ? 'Class · trigger' : 'Name'}</th>
            <th>Defined in (cloud/)</th>
            {counted && <th>Calls</th>}
            {counted && <th>Errors</th>}
            <th>{counted ? 'Last called' : ''}</th>
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    );
  }

  renderContent() {
    const { loading, error, data, tab, search, sort } = this.state;
    const toolbar = (
      <Toolbar section="App Settings" subsection="Cloud functions">
        <div className={styles.barActions}>
          <select value={tab} onChange={e => this.setState({ tab: e.target.value, open: null })}>
            {TABS.map(t => (
              <option key={t.key} value={t.key}>
                {t.label}{data ? ` (${(data[t.key] || []).length})` : ''}
              </option>
            ))}
          </select>
          <select value={sort} onChange={e => this.setState({ sort: e.target.value })}>
            <option value="folder">By folder</option>
            <option value="name">By name</option>
            <option value="calls">Most called</option>
            <option value="errors">Most errors</option>
          </select>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>{error}</div>;
    } else if (data) {
      const rows = this.rows();
      body = (
        <>
          <p className={styles.hint}>
            Everything the server registered at start-up ({when(data.startedAt)}), with where it is defined.
            Calls and errors count since then. Click a row to read its code.
            {tab === 'jobs' && <> Run jobs from <a href="../jobs">Core → Jobs</a>.</>}
          </p>
          <form className={styles.search} onSubmit={e => e.preventDefault()}>
            <input value={search} placeholder="Search by name, class or file" onChange={e => this.setState({ search: e.target.value })} />
            <span className={styles.meta} style={{ alignSelf: 'center' }}>{rows.length} shown</span>
          </form>
          {rows.length ? this.renderTable(rows) : <div className={styles.empty}>Nothing matches.</div>}
        </>
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

export default CloudFunctions;
