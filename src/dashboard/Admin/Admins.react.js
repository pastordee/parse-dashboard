// Created: 2026-09-27
/*
 * Admin → Admins: who can use the admin console, their roles, and the
 * deactivate switch; find a user to make them an admin. Same functions as the
 * admin phone app (cloud/admin/admin.cjs): adminUsers, adminRoles,
 * adminFindUser, adminSetRole, adminSetActive. The server still refuses
 * anything unsafe (e.g. removing the last way back in).
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, ago } from './adminApi';
import styles from './Admin.scss';

const roleName = r => r.replace(/^admin_/, '').replace(/_/g, ' ');

class Admins extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Admins';
    this.state = { loading: true, error: null, users: [], roles: [], query: '', found: null, busy: false, toast: null };
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

  async load() {
    this.setState({ loading: true, error: null });
    try {
      const [users, roles] = await Promise.all([
        adminCall(this.context, 'adminUsers'),
        adminCall(this.context, 'adminRoles'),
      ]);
      this.setState({ users: users || [], roles: roles || [], loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  async run(fn, params, done) {
    this.setState({ busy: true });
    try {
      await adminCall(this.context, fn, params);
      this.say(done);
      await this.load();
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setState({ busy: false });
    }
  }

  toggleRole(user, role, grant) {
    const verb = grant ? 'Give' : 'Remove';
    if (!window.confirm(`${verb} "${roleName(role)}" ${grant ? 'to' : 'from'} ${user.username}?`)) {
      return;
    }
    return this.run('adminSetRole', { userId: user.userId || user.id, role, grant },
      grant ? `${user.username} is now ${roleName(role)}` : `Removed ${roleName(role)} from ${user.username}`);
  }

  setActive(user, active) {
    if (!active && !window.confirm(`Deactivate ${user.username}? They lose all admin access at once, whatever their roles.`)) {
      return;
    }
    return this.run('adminSetActive', { userId: user.userId, active },
      active ? `${user.username} reactivated` : `${user.username} deactivated`);
  }

  async find(e) {
    e && e.preventDefault();
    const query = this.state.query.trim();
    if (!query) {
      return;
    }
    try {
      const found = await adminCall(this.context, 'adminFindUser', { query });
      this.setState({ found: found || [] });
    } catch (err) {
      this.say(err.message || String(err), true);
    }
  }

  renderRoles(user) {
    const has = new Set(user.roles || []);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {this.state.roles.map(r => (
          <label key={r.name} className={styles.pill} title={(r.capabilities || []).join(', ')}
            style={{ cursor: this.state.busy ? 'default' : 'pointer', ...(has.has(r.name) ? { background: 'rgba(22,156,238,0.14)', color: '#0f7cbf' } : {}) }}>
            <input type="checkbox" checked={has.has(r.name)} disabled={this.state.busy}
              onChange={e => this.toggleRole(user, r.name, e.target.checked)} style={{ marginRight: 5 }} />
            {roleName(r.name)}
          </label>
        ))}
      </div>
    );
  }

  renderContent() {
    const { loading, error, users, roles, query, found, toast } = this.state;
    const toolbar = (
      <Toolbar section="Admin" subsection="Admins">
        <div className={styles.barActions}>
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Admins couldn't be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          <p className={styles.hint}>
            Tick a role to give it, untick to take it away (hover a role to see what it allows).
            Deactivating someone removes all their admin access at once.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Roles</th>
                <th>Last seen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} className={u.active ? '' : styles.dim}>
                  <td>
                    <strong>{u.displayName || u.username}</strong>
                    <div className={styles.meta}>@{u.username}{u.active ? '' : ' · deactivated'}</div>
                    {u.notes && <div className={styles.meta}>{u.notes}</div>}
                  </td>
                  <td>{this.renderRoles(u)}</td>
                  <td className={styles.meta}>{u.lastSeenAt ? ago(u.lastSeenAt) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={`${styles.linkBtn} ${u.active ? styles.danger : ''}`} disabled={this.state.busy}
                      onClick={() => this.setActive(u, !u.active)}>
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.sectionTitle}>Add an admin</div>
          <form className={styles.search} onSubmit={e => this.find(e)}>
            <input value={query} placeholder="Exact username or email" onChange={e => this.setState({ query: e.target.value })} />
            <Button value="Find" primary={true} onClick={() => this.find()} />
          </form>
          {found && found.length === 0 && <div className={styles.meta}>No user with that exact username or email.</div>}
          {found && found.map(f => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>@{f.username}</span>
                <span className={styles.meta}>{f.email || ''}{(f.roles || []).length ? ` · ${(f.roles || []).map(roleName).join(', ')}` : ''}</span>
              </div>
              {this.renderRoles({ ...f, userId: f.id })}
            </div>
          ))}
          {roles.length === 0 && <div className={styles.notice}>No admin roles exist — run the admin setup job.</div>}
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

export default Admins;
