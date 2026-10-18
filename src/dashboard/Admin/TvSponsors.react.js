// Created: 2026-10-18
/*
 * Admin → TV sponsors: the sponsors who buy advert slots on Church TV (the
 * churches' scheduled TV channels).
 *
 *   Awaiting approval  new sponsors and new adverts. Prayer Circle is a
 *                      Christian organisation, so every advert is WATCHED here
 *                      before it can play; the price per 1,000 plays of 30 s
 *                      is set (or adjusted) when approving — longer adverts
 *                      (up to 2 min) pay pro rata. New sponsors show what the
 *                      portal asked: person, phone, organisation and its
 *                      number, address, what they'll advertise, budget.
 *                      The message to the sponsor comes pre-filled (welcome
 *                      / approved, with the advertising standards link).
 *   Sponsors           every sponsor with their campaigns: plays, spend of
 *                      budget, dates, on/off, and editing a campaign's title,
 *                      price, budget, dates.
 *   Monthly report     plays and spend for a month, split 70% to the churches
 *                      (per church) and 30% to Prayer Circle.
 *
 * Cloud functions (master key, like the rest of Admin): tvSponsors,
 * tvReviewSponsor, tvReviewCampaign, tvSaveSponsor, tvSaveCampaign,
 * tvSponsorReport. Money is in pence; `mode` stays "test" until real money is
 * switched on, and the page says so in a banner.
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall } from './adminApi';
import styles from './Admin.scss';

// 12345 → "£123.45"
const money = pence =>
  `£${((pence || 0) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "123.45" → 12345, or null when it isn't a number.
const toPence = text => {
  const n = parseFloat(String(text).replace(/[£,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

const toPounds = pence => (pence == null ? '' : ((pence || 0) / 100).toFixed(2));

const asDate = d => (d ? new Date(d.iso || d) : null);

const day = d => {
  const x = asDate(d);
  return x ? x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

// <input type="date"> value.
const dateInput = d => {
  const x = asDate(d);
  if (!x) {
    return '';
  }
  const off = x.getTimezoneOffset() * 60000;
  return new Date(x - off).toISOString().slice(0, 10);
};

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const seconds = ms => {
  const half = Math.round((ms || 0) / 30000);
  return (ms || 0) < 60000 ? `${Math.round((ms || 0) / 1000)} s` : `${Math.floor(half / 2)}${half % 2 ? '½' : ''} min`;
};

// The price is per 1,000 plays of 30 s; an advert pays for its length
// (owner, 2026-10-18 — adverts up to 2 minutes).
const priceForSlot = (cpmPence, slotMs) => Math.round(((cpmPence || 0) * (slotMs || 30000)) / 30000);

// What the sponsor portal's application asks (the server keeps the same lists, tv.cjs).
const ORG_TYPES = { business: 'Business', charity: 'Charity', church: 'Church or ministry', other: 'Other' };
const CATEGORIES = {
  'christian-media': 'Christian books, music & media', education: 'Education & courses', events: 'Events & conferences',
  'charity-mission': 'Charity & mission', 'food-drink': 'Food & drink', health: 'Health & wellbeing',
  'local-business': 'Local business & services', 'finance-legal': 'Finance & legal', other: 'Something else',
};
const BUDGETS = { 'under-100': 'Under £100 a month', '100-500': '£100 – £500 a month', '500-2000': '£500 – £2,000 a month', '2000-plus': 'Over £2,000 a month' };

// The sponsor's message box starts with these (owner, 2026-10-18): the
// reviewer adds to them if needed. Every one points at the advertising
// standards page on the website's sponsor portal.
const STANDARDS_URL = 'https://prayercircle.co.uk/sponsors/standards';
const sponsorWelcome = s =>
  `Welcome to Church TV, ${s.contactName || s.name}! Your sponsor account is approved, so you can now upload adverts from your sponsor account. ` +
  `Prayer Circle is a Christian platform and we watch every advert before it plays, so please read our advertising standards first: ${STANDARDS_URL} ` +
  'An advert that doesn’t meet them will be turned down.';
const sponsorTurnDown = () => 'Thank you for applying to sponsor Church TV. We can’t approve your account because ';
const campaignApproved = c =>
  `Your advert “${c.title}” is approved. It plays in churches’ breaks from ${day(c.from)} to ${day(c.until)}, or until its budget is spent. ` +
  `Thank you for keeping to our advertising standards: ${STANDARDS_URL}`;
const campaignTurnDown = c =>
  `Thank you for your advert. We can’t approve “${c.title}” because it doesn’t meet our advertising standards (${STANDARDS_URL}): `;

function statusChip(status) {
  const cls = { approved: styles.pillGreen, pending: styles.pillAmber, rejected: styles.pillRed }[status] || '';
  const label = { approved: 'Approved', pending: 'Awaiting approval', rejected: 'Turned down' }[status] || status || '—';
  return <span className={`${styles.pill} ${cls}`}>{label}</span>;
}

class TvSponsors extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'TV sponsors';
    this.state = {
      loading: true,
      error: null,
      mode: null,
      sponsors: [],
      campaigns: [],
      notes: {}, // 'sponsor:id' / 'campaign:id' → review note
      prices: {}, // campaignId → £ text for the approval price
      watched: {}, // campaignId → true once its advert has been played
      busy: null,
      edit: null, // campaign being edited (form values)
      newSponsor: null, // name being typed, or null when the form is closed
      month: thisMonth(),
      report: null,
      reportLoading: false,
      reportError: null,
      toast: null,
    };
    this.load = this.load.bind(this);
  }

  componentDidMount() {
    this.load();
    this.loadReport();
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
      const r = await adminCall(this.context, 'tvSponsors');
      this.setState({
        mode: r.mode,
        sponsors: r.sponsors || [],
        campaigns: r.campaigns || [],
        loading: false,
      });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  async loadReport(month = this.state.month) {
    this.setState({ month, reportLoading: true, reportError: null });
    try {
      const report = await adminCall(this.context, 'tvSponsorReport', { month });
      this.setState({ report, reportLoading: false });
    } catch (e) {
      this.setState({ report: null, reportError: e.message || String(e), reportLoading: false });
    }
  }

  async run(key, fn, done) {
    this.setState({ busy: key });
    try {
      await fn();
      if (done) {
        this.say(done);
      }
      await this.load();
      return true;
    } catch (e) {
      this.say(e.message || String(e), true);
      return false;
    } finally {
      this.setState({ busy: null });
    }
  }

  setNote(key, value) {
    this.setState(({ notes }) => ({ notes: { ...notes, [key]: value } }));
  }

  // The message as it stands: what the reviewer typed, else the pre-filled one.
  noteText(key, prefill) {
    const typed = this.state.notes[key];
    return typed != null ? typed : prefill;
  }

  // Turning down needs a reason. While the box still holds the welcome (or
  // the bare start of a turn-down), it becomes the start of a turn-down to
  // finish, and nothing is sent yet.
  reasonGiven(key, note, welcome, turnDown) {
    if (note && note !== welcome.trim() && note !== turnDown.trim()) {
      return true;
    }
    this.setNote(key, turnDown);
    this.say('Finish the message saying why it was turned down — the sponsor sees it — then press Turn down again.', true);
    return false;
  }

  // ── Review ──────────────────────────────────────────────────────────────

  reviewSponsor(s, approve) {
    const key = `sponsor:${s.sponsorId}`;
    const note = this.noteText(key, sponsorWelcome(s)).trim();
    if (!approve && !this.reasonGiven(key, note, sponsorWelcome(s), sponsorTurnDown())) {
      return;
    }
    this.run(
      key,
      () => adminCall(this.context, 'tvReviewSponsor', { sponsorId: s.sponsorId, approve, note }),
      approve ? `${s.name} approved` : `${s.name} turned down`
    );
  }

  reviewCampaign(c, approve) {
    const key = `campaign:${c.campaignId}`;
    const note = this.noteText(key, campaignApproved(c)).trim();
    const params = { campaignId: c.campaignId, approve, note };
    if (approve) {
      const priceText = this.state.prices[c.campaignId];
      const cpmPence = toPence(priceText != null ? priceText : toPounds(c.cpmPence));
      if (!cpmPence) {
        this.say('Set the price per 1,000 plays before approving.', true);
        return;
      }
      if (!this.state.watched[c.campaignId] &&
        !window.confirm(`You haven't played "${c.title}" here yet. Approve it without watching?`)) {
        return;
      }
      params.cpmPence = cpmPence;
    } else if (!this.reasonGiven(key, note, campaignApproved(c), campaignTurnDown(c))) {
      return;
    }
    this.run(
      key,
      () => adminCall(this.context, 'tvReviewCampaign', params),
      approve ? `"${c.title}" approved` : `"${c.title}" turned down`
    );
  }

  // ── Sponsors and campaigns ──────────────────────────────────────────────

  toggleSponsor(s) {
    this.run(`sponsor:${s.sponsorId}`, () =>
      adminCall(this.context, 'tvSaveSponsor', {
        sponsorId: s.sponsorId,
        name: s.name,
        logoUrl: s.logoUrl,
        active: !s.active,
      })
    );
  }

  addSponsor(e) {
    e.preventDefault();
    const name = (this.state.newSponsor || '').trim();
    if (!name) {
      return;
    }
    this.run('newSponsor', () => adminCall(this.context, 'tvSaveSponsor', { name, active: true }), `${name} added`)
      .then(ok => ok && this.setState({ newSponsor: null }));
  }

  campaignParams(c, changes = {}) {
    return {
      campaignId: c.campaignId,
      sponsorId: c.sponsorId,
      title: c.title,
      videoUrl: c.videoUrl,
      thumbnailUrl: c.thumbnailUrl,
      durationMs: c.durationMs,
      cpmPence: c.cpmPence,
      budgetPence: c.budgetPence,
      from: c.from,
      until: c.until,
      active: c.active,
      ...changes,
    };
  }

  toggleCampaign(c) {
    this.run(`campaign:${c.campaignId}`, () =>
      adminCall(this.context, 'tvSaveCampaign', this.campaignParams(c, { active: !c.active }))
    );
  }

  startEdit(c) {
    this.setState({
      edit: {
        campaignId: c.campaignId,
        title: c.title || '',
        price: toPounds(c.cpmPence),
        budget: toPounds(c.budgetPence),
        from: dateInput(c.from),
        until: dateInput(c.until),
        active: !!c.active,
      },
    });
  }

  setEdit(key, value) {
    this.setState(({ edit }) => ({ edit: { ...edit, [key]: value } }));
  }

  saveEdit(e, c) {
    e.preventDefault();
    const f = this.state.edit;
    const cpmPence = toPence(f.price);
    const budgetPence = toPence(f.budget);
    if (!f.title.trim()) {
      this.say('The campaign needs a title.', true);
      return;
    }
    if (cpmPence == null || budgetPence == null) {
      this.say('Price and budget must be amounts in £.', true);
      return;
    }
    if (f.from && f.until && f.until < f.from) {
      this.say('The end date is before the start date.', true);
      return;
    }
    const changes = {
      title: f.title.trim(),
      cpmPence,
      budgetPence,
      active: f.active,
      from: f.from ? new Date(`${f.from}T00:00:00`).toISOString() : c.from,
      until: f.until ? new Date(`${f.until}T23:59:59`).toISOString() : c.until,
    };
    this.run(
      `campaign:${c.campaignId}`,
      () => adminCall(this.context, 'tvSaveCampaign', this.campaignParams(c, changes)),
      'Campaign saved'
    ).then(ok => ok && this.setState({ edit: null }));
  }

  // ── Rendering ───────────────────────────────────────────────────────────

  renderNote(key, prefill) {
    return (
      <div className={styles.caption}>
        <label>Message to the sponsor (they see it) — pre-filled; add to it if you need to. Turning down needs a reason.</label>
        <textarea
          rows={4}
          value={this.noteText(key, prefill)}
          onChange={e => this.setNote(key, e.target.value)}
        />
      </div>
    );
  }

  renderReviewButtons(key, onApprove, onReject) {
    if (this.state.busy === key) {
      return <div className={styles.actions}><span className={styles.meta}>Working…</span></div>;
    }
    return (
      <div className={styles.actions}>
        <Button value="Approve" primary={true} color="green" onClick={onApprove} />
        <Button value="Turn down" primary={false} color="red" onClick={onReject} />
      </div>
    );
  }

  renderPendingSponsor(s) {
    const key = `sponsor:${s.sponsorId}`;
    return (
      <div key={s.sponsorId} className={styles.card}>
        <div className={styles.cardHead}>
          {s.logoUrl && <img className={styles.tvLogo} src={s.logoUrl} alt="" />}
          <span className={styles.cardTitle}>{s.name}</span>
          <span className={styles.pill}>New sponsor</span>
          {statusChip(s.status)}
        </div>
        <div className={styles.tvFacts}>
          <div>
            <span>Website</span>
            {s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer">{s.website}</a> : '—'}
          </div>
          <div>
            <span>Contact</span>
            {s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : '—'}
          </div>
          <div>
            <span>Person</span>
            {s.contactName || '—'}
            {s.phone && <> · <a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}>{s.phone}</a></>}
          </div>
          <div>
            <span>Organisation</span>
            {ORG_TYPES[s.orgType] || '—'}
            {s.registrationNumber && ` · No. ${s.registrationNumber}`}
          </div>
          <div>
            <span>Based in</span>
            {[s.address, s.country].filter(Boolean).join(', ') || '—'}
          </div>
          <div><span>Will advertise</span>{CATEGORIES[s.category] || '—'}</div>
          <div><span>Budget</span>{BUDGETS[s.monthlyBudget] || '—'}</div>
          <div><span>Advertising standards</span>{s.standardsAgreedAt ? `Agreed ${day(s.standardsAgreedAt)}` : 'Not agreed yet'}</div>
        </div>
        <div className={styles.body}>{s.about || <em>No description given.</em>}</div>
        {this.renderNote(key, sponsorWelcome(s))}
        {this.renderReviewButtons(key, () => this.reviewSponsor(s, true), () => this.reviewSponsor(s, false))}
      </div>
    );
  }

  renderPendingCampaign(c, sponsorName) {
    const key = `campaign:${c.campaignId}`;
    const price = this.state.prices[c.campaignId];
    const watched = this.state.watched[c.campaignId];
    return (
      <div key={c.campaignId} className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>{c.title}</span>
          <span className={styles.meta}>from {sponsorName}</span>
          <span className={styles.pill}>New advert</span>
          {watched
            ? <span className={`${styles.pill} ${styles.pillGreen}`}>Watched</span>
            : <span className={`${styles.pill} ${styles.pillAmber}`}>Not watched yet</span>}
        </div>
        <div className={styles.tvReview}>
          <div>
            {c.videoUrl ? (
              <video
                className={styles.tvVideo}
                src={c.videoUrl}
                poster={c.thumbnailUrl || undefined}
                controls={true}
                preload="metadata"
                playsInline={true}
                onPlay={() => this.setState(({ watched: w }) => ({ watched: { ...w, [c.campaignId]: true } }))}
              />
            ) : (
              <div className={`${styles.tvVideo} ${styles.tvNoVideo}`}>No video uploaded</div>
            )}
            <div className={styles.hint} style={{ margin: '6px 0 0' }}>
              Watch the whole advert before approving — it plays on churches’ TV channels.
            </div>
          </div>
          <div>
            <div className={styles.tvFacts}>
              <div><span>Slot</span>{seconds(c.slotMs)} (advert is {seconds(c.durationMs)})</div>
              <div><span>Budget</span>{money(c.budgetPence)}</div>
              <div><span>Runs</span>{day(c.from)} – {day(c.until)}</div>
            </div>
            <label className={styles.tvField}>
              <span>Price per 1,000 plays of 30 s (£) — this {seconds(c.slotMs)} advert pays {money(priceForSlot(toPence(price != null ? price : toPounds(c.cpmPence)), c.slotMs))}</span>
              <input
                inputMode="decimal"
                value={price != null ? price : toPounds(c.cpmPence)}
                onChange={e => {
                  const v = e.target.value;
                  this.setState(({ prices }) => ({ prices: { ...prices, [c.campaignId]: v } }));
                }}
              />
            </label>
            {this.renderNote(key, campaignApproved(c))}
            {this.renderReviewButtons(key, () => this.reviewCampaign(c, true), () => this.reviewCampaign(c, false))}
          </div>
        </div>
      </div>
    );
  }

  renderQueue(sponsorName) {
    const { sponsors, campaigns } = this.state;
    const ps = sponsors.filter(s => s.status === 'pending');
    const pc = campaigns.filter(c => c.status === 'pending');
    return (
      <>
        <div className={styles.sectionTitle}>Awaiting approval ({ps.length + pc.length})</div>
        {ps.length + pc.length === 0 && <div className={styles.card}><span className={styles.meta}>Nothing waiting. 🎉</span></div>}
        {ps.map(s => this.renderPendingSponsor(s))}
        {pc.map(c => this.renderPendingCampaign(c, sponsorName(c.sponsorId)))}
      </>
    );
  }

  renderEditRow(c) {
    const f = this.state.edit;
    const busy = this.state.busy === `campaign:${c.campaignId}`;
    const input = (k, label, props = {}) => (
      <label className={styles.tvField}>
        <span>{label}</span>
        <input value={f[k]} onChange={e => this.setEdit(k, e.target.value)} {...props} />
      </label>
    );
    return (
      <tr key={c.campaignId}>
        <td colSpan={7} className={styles.tvEditCell}>
          <form className={styles.tvEdit} onSubmit={e => this.saveEdit(e, c)}>
            {input('title', 'Title')}
            {input('price', 'Price per 1,000 plays of 30 s (£)', { inputMode: 'decimal' })}
            {input('budget', 'Budget (£)', { inputMode: 'decimal' })}
            {input('from', 'Starts', { type: 'date' })}
            {input('until', 'Ends', { type: 'date' })}
            <label className={styles.tvCheck}>
              <input type="checkbox" checked={f.active} onChange={e => this.setEdit('active', e.target.checked)} />
              Playing
            </label>
            <div className={styles.actions}>
              <Button value={busy ? 'Saving…' : 'Save'} primary={true} disabled={busy} onClick={e => this.saveEdit(e, c)} />
              <Button value="Cancel" primary={false} onClick={() => this.setState({ edit: null })} />
            </div>
          </form>
        </td>
      </tr>
    );
  }

  renderCampaignRow(c) {
    const { edit } = this.state;
    if (edit && edit.campaignId === c.campaignId) {
      return this.renderEditRow(c);
    }
    const over = c.budgetPence && c.spentPence >= c.budgetPence;
    return (
      <tr key={c.campaignId} className={c.active ? '' : styles.dim}>
        <td>
          <strong>{c.title}</strong>
          <div className={styles.meta}>{seconds(c.slotMs)} slot · {money(priceForSlot(c.cpmPence, c.slotMs))} per 1,000 ({money(c.cpmPence)} per 30 s)</div>
          {c.reviewNote && <div className={styles.meta}>Note: {c.reviewNote}</div>}
        </td>
        <td>{statusChip(c.status)}</td>
        <td>{(c.plays || 0).toLocaleString('en-GB')}</td>
        <td>
          <span className={over ? styles.over : ''}>{money(c.spentPence)}</span> of {money(c.budgetPence)}
        </td>
        <td>{day(c.from)} – {day(c.until)}</td>
        <td>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={!!c.active}
              disabled={this.state.busy === `campaign:${c.campaignId}`}
              onChange={() => this.toggleCampaign(c)}
            />
            <span />
          </label>
        </td>
        <td className={styles.tvRowActions}>
          {c.videoUrl && <a href={c.videoUrl} target="_blank" rel="noopener noreferrer">Watch</a>}
          <button className={styles.linkBtn} onClick={() => this.startEdit(c)}>Edit</button>
        </td>
      </tr>
    );
  }

  renderSponsor(s, campaigns) {
    return (
      <div key={s.sponsorId} className={styles.card}>
        <div className={styles.cardHead}>
          {s.logoUrl && <img className={styles.tvLogo} src={s.logoUrl} alt="" />}
          <span className={styles.cardTitle}>{s.name}</span>
          {statusChip(s.status)}
          {s.website && <a className={styles.meta} href={s.website} target="_blank" rel="noopener noreferrer">{s.website}</a>}
          {s.contactEmail && <a className={styles.meta} href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}
          {s.contactName && (
            <span className={styles.meta}>
              {s.contactName}{s.phone && ` · ${s.phone}`}{s.country && ` · ${s.country}`}
            </span>
          )}
          {s.sponsorId && (
            <label className={styles.tvActive}>
              <span className={styles.meta}>{s.active ? 'Active' : 'Off'}</span>
              <span className={styles.switch}>
                <input
                  type="checkbox"
                  checked={!!s.active}
                  disabled={this.state.busy === `sponsor:${s.sponsorId}`}
                  onChange={() => this.toggleSponsor(s)}
                />
                <span />
              </span>
            </label>
          )}
        </div>
        {s.reviewNote && <div className={styles.meta}>Review note: {s.reviewNote}</div>}
        {campaigns.length === 0 ? (
          <div className={styles.meta}>No campaigns yet.</div>
        ) : (
          <table className={styles.table} style={{ boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Plays</th>
                <th>Spent</th>
                <th>Dates</th>
                <th>Playing</th>
                <th />
              </tr>
            </thead>
            <tbody>{campaigns.map(c => this.renderCampaignRow(c))}</tbody>
          </table>
        )}
      </div>
    );
  }

  renderSponsors() {
    const { sponsors, campaigns, newSponsor, busy } = this.state;
    const ids = new Set(sponsors.map(s => s.sponsorId));
    const orphans = campaigns.filter(c => !ids.has(c.sponsorId));
    return (
      <>
        <div className={styles.sectionTitle}>Sponsors ({sponsors.length})</div>
        {newSponsor != null && (
          <form className={`${styles.card} ${styles.tvAdd}`} onSubmit={e => this.addSponsor(e)}>
            <label className={styles.tvField}>
              <span>New sponsor’s name</span>
              <input autoFocus={true} value={newSponsor} onChange={e => this.setState({ newSponsor: e.target.value })} />
            </label>
            <Button value={busy === 'newSponsor' ? 'Adding…' : 'Add sponsor'} primary={true} disabled={busy === 'newSponsor'} onClick={e => this.addSponsor(e)} />
            <Button value="Cancel" primary={false} onClick={() => this.setState({ newSponsor: null })} />
          </form>
        )}
        {sponsors.length === 0 && <div className={styles.empty}>No sponsors yet.</div>}
        {sponsors.map(s => this.renderSponsor(s, campaigns.filter(c => c.sponsorId === s.sponsorId)))}
        {orphans.length > 0 && this.renderSponsor({ name: 'Unknown sponsor', sponsorId: null }, orphans)}
      </>
    );
  }

  renderReport() {
    const { month, report, reportLoading, reportError } = this.state;
    const stat = (label, value) => (
      <div className={styles.card}>
        <div className={styles.meta}>{label}</div>
        <div className={styles.bigNum}>{value}</div>
      </div>
    );
    return (
      <>
        <div className={styles.sectionTitle}>Monthly report</div>
        <div className={styles.search}>
          <input
            type="month"
            value={month}
            max={thisMonth()}
            onChange={e => e.target.value && this.loadReport(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          {reportLoading && <span className={styles.meta} style={{ alignSelf: 'center' }}>Loading…</span>}
        </div>
        {reportError && <div className={styles.error}>The report couldn’t be loaded: {reportError}</div>}
        {report && (
          <>
            {report.mode !== 'live' && (
              <div className={styles.notice}>Test mode — these figures are not real money.</div>
            )}
            <div className={styles.statGrid}>
              {stat('Plays', (report.plays || 0).toLocaleString('en-GB'))}
              {stat('Sponsors spent', money(report.spendPence))}
              {stat('Churches’ share (70%)', money(report.churchesPence))}
              {stat('Prayer Circle’s share (30%)', money(report.prayerCirclePence))}
            </div>
            <table className={styles.table} style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Church</th>
                  <th>Plays</th>
                  <th>Church gets</th>
                </tr>
              </thead>
              <tbody>
                {(report.churches || []).length === 0 && (
                  <tr><td colSpan={3} className={styles.meta}>No adverts played on any church’s channel this month.</td></tr>
                )}
                {(report.churches || []).map(ch => (
                  <tr key={ch.feedId}>
                    <td>{ch.name || ch.feedId}</td>
                    <td>{(ch.plays || 0).toLocaleString('en-GB')}</td>
                    <td>{money(ch.churchPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </>
    );
  }

  renderContent() {
    const { loading, error, mode, sponsors, toast } = this.state;
    const names = Object.fromEntries(sponsors.map(s => [s.sponsorId, s.name]));
    const sponsorName = id => names[id] || 'Unknown sponsor';

    const toolbar = (
      <Toolbar section="Admin" subsection="TV sponsors">
        <div className={styles.barActions}>
          <Button value="Add sponsor" primary={true} onClick={() => this.setState({ newSponsor: '' })} />
          <Button value="Refresh" primary={false} onClick={() => { this.load(); this.loadReport(); }} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>TV sponsors couldn’t be loaded: {error}</div>;
    } else if (!loading) {
      body = (
        <>
          {mode !== 'live' && (
            <div className={styles.tvTestBanner}>
              TEST MODE — no real money is being taken or paid out. Sponsors aren’t charged until live payments are switched on.
            </div>
          )}
          {this.renderQueue(sponsorName)}
          {this.renderSponsors()}
          {this.renderReport()}
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

export default TvSponsors;
