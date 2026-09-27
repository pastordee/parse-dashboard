// Created: 2026-09-27
/*
 * Push → Announcements: the in-app announcement banners (class Announcement),
 * with how many people dismissed each. Does what the website's Admin Portal
 * page does (server: routes/announcements-admin.js) using the dashboard's own
 * access, so no second login. Field rules match that route.
 */
import React from 'react';
import Parse from 'parse';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import styles from './Announcements.scss';

const TYPES = ['feature', 'maintenance', 'info', 'warning'];
const DAY = 24 * 60 * 60 * 1000;

// datetime-local wants local time without a zone.
function toLocalInput(date) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 16);
}

const emptyForm = () => ({
  id: null,
  type: 'feature',
  title: '',
  message: '',
  icon: '',
  color: '',
  actionLabel: '',
  priority: 0,
  featureName: '',
  expiresAt: toLocalInput(new Date(Date.now() + 30 * DAY)),
  isActive: true,
});

class Announcements extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Push';
    this.subsection = 'Announcements';
    this.state = { loading: true, error: null, items: [], form: null, saving: false };
    this.load = this.load.bind(this);
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: null });
    try {
      this.context.setParseKeys();
      const rows = await new Parse.Query('Announcement')
        .descending('createdAt')
        .limit(200)
        .find({ useMasterKey: true });
      const items = await Promise.all(
        rows.map(async a => ({
          object: a,
          dismissals: await new Parse.Query('AnnouncementDismissal')
            .equalTo('announcementId', a)
            .count({ useMasterKey: true }),
        }))
      );
      this.setState({ items, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  edit(a) {
    this.setState({
      form: {
        id: a.id,
        type: a.get('type') || 'info',
        title: a.get('title') || '',
        message: a.get('message') || '',
        icon: a.get('icon') || '',
        color: a.get('color') || '',
        actionLabel: a.get('actionLabel') || '',
        priority: a.get('priority') || 0,
        featureName: a.get('featureName') || '',
        expiresAt: toLocalInput(a.get('expiresAt')),
        isActive: a.get('isActive') !== false,
      },
    });
  }

  setField(key, value) {
    this.setState(({ form }) => ({ form: { ...form, [key]: value } }));
  }

  async save(e) {
    e.preventDefault();
    const f = this.state.form;
    if (!f.title.trim() || !f.message.trim()) {
      this.setState({ error: 'Title and message are required.' });
      return;
    }
    this.setState({ saving: true, error: null });
    try {
      this.context.setParseKeys();
      const a = f.id
        ? await new Parse.Query('Announcement').get(f.id, { useMasterKey: true })
        : new Parse.Object('Announcement');
      a.set('type', f.type);
      a.set('title', f.title.trim());
      a.set('message', f.message.trim());
      a.set('icon', f.icon.trim());
      a.set('color', f.color.trim());
      a.set('actionLabel', f.actionLabel.trim() || 'Dismiss');
      a.set('priority', parseInt(f.priority, 10) || 0);
      a.set('isActive', !!f.isActive);
      a.set('expiresAt', f.expiresAt ? new Date(f.expiresAt) : new Date(Date.now() + 30 * DAY));
      if (f.featureName.trim()) {
        a.set('featureName', f.featureName.trim());
      } else if (f.id) {
        a.unset('featureName');
      }
      await a.save(null, { useMasterKey: true });
      this.setState({ form: null, saving: false });
      this.load();
    } catch (err) {
      this.setState({ error: err.message || String(err), saving: false });
    }
  }

  async toggleActive(a) {
    try {
      this.context.setParseKeys();
      a.set('isActive', a.get('isActive') === false);
      await a.save(null, { useMasterKey: true });
      this.forceUpdate();
    } catch (err) {
      a.revert();
      this.setState({ error: err.message || String(err) });
    }
  }

  async remove(a) {
    if (!window.confirm(`Delete "${a.get('title')}"? This can't be undone.`)) {
      return;
    }
    try {
      this.context.setParseKeys();
      await a.destroy({ useMasterKey: true });
      this.load();
    } catch (err) {
      this.setState({ error: err.message || String(err) });
    }
  }

  renderForm() {
    const f = this.state.form;
    const field = (key, label, props = {}) => (
      <label className={styles.field}>
        <span>{label}</span>
        <input value={f[key]} onChange={e => this.setField(key, e.target.value)} {...props} />
      </label>
    );
    return (
      <form className={styles.form} onSubmit={e => this.save(e)}>
        <div className={styles.formTitle}>{f.id ? 'Edit announcement' : 'New announcement'}</div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Type</span>
            <select value={f.type} onChange={e => this.setField('type', e.target.value)}>
              {TYPES.map(t => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>
          {field('title', 'Title', { required: true })}
          <label className={`${styles.field} ${styles.wide}`}>
            <span>Message</span>
            <textarea value={f.message} rows={3} required onChange={e => this.setField('message', e.target.value)} />
          </label>
          {field('icon', 'Icon (e.g. videocam, info, warning)')}
          {field('color', 'Colour (hex, e.g. #2563EB)')}
          {field('actionLabel', 'Button label', { placeholder: 'Dismiss' })}
          {field('priority', 'Priority (0–10)', { type: 'number', min: 0, max: 10 })}
          {field('featureName', 'Feature name (for features)')}
          {field('expiresAt', 'Expires', { type: 'datetime-local' })}
          <label className={styles.check}>
            <input type="checkbox" checked={f.isActive} onChange={e => this.setField('isActive', e.target.checked)} />
            Showing in the app
          </label>
        </div>
        <div className={styles.formActions}>
          <Button value={f.id ? 'Save changes' : 'Create'} primary={true} disabled={this.state.saving} onClick={e => this.save(e)} />
          <Button value="Cancel" primary={false} onClick={() => this.setState({ form: null })} />
        </div>
      </form>
    );
  }

  renderContent() {
    const { loading, error, items, form } = this.state;
    const now = Date.now();
    const toolbar = (
      <Toolbar section="Push" subsection="Announcements">
        <div className={styles.barActions}>
          <Button value="New announcement" primary={true} onClick={() => this.setState({ form: emptyForm() })} />
          <Button value="Refresh" primary={false} onClick={this.load} />
        </div>
      </Toolbar>
    );

    return (
      <div>
        <LoaderContainer loading={loading} solid={false}>
          <div className={styles.page}>
            {error && <div className={styles.error}>{error}</div>}
            {form && this.renderForm()}
            {!loading && items.length === 0 && <div className={styles.empty}>No announcements yet.</div>}
            {items.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Announcement</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Expires</th>
                    <th>Dismissed</th>
                    <th>Showing</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ object: a, dismissals }) => {
                    const expires = a.get('expiresAt');
                    const expired = expires && new Date(expires).getTime() < now;
                    return (
                      <tr key={a.id} className={a.get('isActive') === false || expired ? styles.off : ''}>
                        <td>
                          <div className={styles.title}>
                            {a.get('color') && <i className={styles.swatch} style={{ background: a.get('color') }} />}
                            {a.get('title')}
                          </div>
                          <div className={styles.message}>{a.get('message')}</div>
                        </td>
                        <td>{a.get('type')}</td>
                        <td>{a.get('priority') || 0}</td>
                        <td>
                          {expires ? new Date(expires).toLocaleDateString() : '—'}
                          {expired && <div className={styles.expired}>expired</div>}
                        </td>
                        <td>{(dismissals || 0).toLocaleString()}</td>
                        <td>
                          <label className={styles.switch}>
                            <input type="checkbox" checked={a.get('isActive') !== false} onChange={() => this.toggleActive(a)} />
                            <span />
                          </label>
                        </td>
                        <td className={styles.rowActions}>
                          <a onClick={() => this.edit(a)}>Edit</a>
                          <a className={styles.danger} onClick={() => this.remove(a)}>Delete</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </LoaderContainer>
        {toolbar}
      </div>
    );
  }
}

export default Announcements;
