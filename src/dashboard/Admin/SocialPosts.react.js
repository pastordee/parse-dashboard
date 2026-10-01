// Created: 2026-09-27
/*
 * Admin → Social posts: the week of Instagram / X / Facebook drafts, reviewed
 * and approved by a person before anything is published. Same functions as
 * the admin phone app's Social posts screen (cloud/admin/social.cjs):
 * adminSocialList / Act / ApproveAll / FillWeek.
 *
 * An approved post waits for its time; an unapproved one is dropped when its
 * time passes (the server's rule, not this page's).
 */
import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Button from 'components/Button/Button.react';
import LoaderContainer from 'components/LoaderContainer/LoaderContainer.react';
import { CurrentApp } from 'context/currentApp';
import { adminCall, when, ago } from './adminApi';
import styles from './Admin.scss';

const STATUS = {
  draft: { text: 'Draft — needs approval', cls: 'pillAmber' },
  approved: { text: 'Approved', cls: 'pillGreen' },
  posting: { text: 'Posting…', cls: 'pillBlue' },
  posted: { text: 'Posted', cls: 'pillGreen' },
  partial: { text: 'Partly posted', cls: 'pillAmber' },
  failed: { text: 'Failed', cls: 'pillRed' },
  missed: { text: 'Missed', cls: 'pillRed' },
  skipped: { text: 'Skipped', cls: '' },
  expired: { text: 'Expired', cls: '' },
};

// datetime-local wants local time without a zone.
function toLocalInput(date) {
  const d = date instanceof Date ? date : new Date(date?.iso || date || Date.now());
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

class SocialPosts extends DashboardView {
  static contextType = CurrentApp;

  constructor(props) {
    super(props);
    this.section = 'Admin';
    this.subsection = 'Social posts';
    // edits: { [postId]: { [network]: caption } } — unsaved caption changes.
    this.state = { loading: true, error: null, data: null, edits: {}, busy: {}, toast: null };
    this.load = this.load.bind(this);
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
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), bad ? 9000 : 4000);
  }

  async load(quiet = false) {
    if (!quiet) {
      this.setState({ loading: true, error: null });
    }
    try {
      const data = await adminCall(this.context, 'adminSocialList');
      this.setState({ data, loading: false });
    } catch (e) {
      this.setState({ error: e.message || String(e), loading: false });
    }
  }

  setBusy(id, value) {
    this.setState(({ busy }) => ({ busy: { ...busy, [id]: value } }));
  }

  async act(post, action, extra = {}, done = 'Done') {
    this.setBusy(post.id, action === 'regenerate' ? 'Writing a new caption… (up to a minute)' : 'Working…');
    try {
      await adminCall(this.context, 'adminSocialAct', { id: post.id, action, ...extra });
      this.setState(({ edits }) => {
        const next = { ...edits };
        delete next[post.id];
        return { edits: next };
      });
      this.say(done);
      await this.load(true);
    } catch (e) {
      this.say(e.message || String(e), true);
    } finally {
      this.setBusy(post.id, null);
    }
  }

  captionsFor(post) {
    return { ...(post.captions || {}), ...(this.state.edits[post.id] || {}) };
  }

  edit(post, network, value) {
    this.setState(({ edits }) => ({
      edits: { ...edits, [post.id]: { ...(edits[post.id] || {}), [network]: value } },
    }));
  }

  save(post) {
    return this.act(post, 'save', { captions: this.captionsFor(post) }, 'Captions saved');
  }

  approve(post) {
    // Unsaved edits go with the approval, so what was approved is what shows.
    const extra = this.state.edits[post.id] ? { captions: this.captionsFor(post) } : {};
    return this.act(post, 'approve', extra, 'Approved — it will post at its time');
  }

  regenerate(post) {
    const note = window.prompt(
      'Write a new caption. Optional: say what to change (e.g. shorter, warmer, mention groups). ' +
      'The picture stays the same' + (post.status === 'approved' ? ', and it goes back to draft for you to check.' : '.'),
      ''
    );
    if (note === null) {
      return;
    }
    return this.act(post, 'regenerate', { note }, 'New caption written');
  }

  reschedule(post) {
    const value = window.prompt('New date and time (YYYY-MM-DDTHH:MM, your local time):', toLocalInput(post.scheduledFor));
    if (!value) {
      return;
    }
    const d = new Date(value);
    if (isNaN(d)) {
      this.say("That date wasn't understood.", true);
      return;
    }
    return this.act(post, 'reschedule', { scheduledFor: d.toISOString() }, `Moved to ${when(d)}`);
  }

  skip(post) {
    if (window.confirm(`Skip "${post.describe}"? It won't be posted.`)) {
      return this.act(post, 'skip', {}, 'Skipped');
    }
  }

  async approveAll() {
    const drafts = (this.state.data?.upcoming || []).filter(p => p.status === 'draft');
    if (!drafts.length) {
      this.say('No drafts waiting.');
      return;
    }
    if (!window.confirm(`Approve all ${drafts.length} drafts as they stand?`)) {
      return;
    }
    try {
      const r = await adminCall(this.context, 'adminSocialApproveAll', { ids: drafts.map(p => p.id) });
      if (r.failed.length) {
        this.say(`Approved ${r.approved.length}, ${r.failed.length} refused:\n` + r.failed.map(f => f.error).join('\n'), true);
      } else {
        this.say(`Approved ${r.approved.length}`);
      }
      await this.load(true);
    } catch (e) {
      this.say(e.message || String(e), true);
    }
  }

  async fillWeek() {
    try {
      await adminCall(this.context, 'adminSocialFillWeek');
      this.say('Drafting the rest of the week — refresh in a minute or two.');
    } catch (e) {
      this.say(e.message || String(e), true);
    }
  }

  // YouTube has no API for Community posts (the Data API covers videos and
  // comments only -- checked 2026-10-01), so this is the hand-off: the card is
  // downloaded and the caption copied, ready for youtube.com → Create → Post.
  // The caption is the Facebook one (full text, clickable link), re-tagged
  // ?src=yt so YouTube downloads show separately in /web-analytics.
  youtubeCaption(post) {
    const c = post.captions || {};
    return (c.facebook || c.instagram || '')
      .replace(/download\?src=fb/g, 'download?src=yt')
      .replace('Link in bio.', 'Download: https://prayercircle.co.uk/download?src=yt');
  }

  async forYouTube(post) {
    // Copy FIRST, while still inside the click: Safari refuses clipboard writes
    // that happen after an await. If it refuses anyway, the caption is shown to
    // copy by hand.
    const caption = this.youtubeCaption(post);
    let copied = false;
    try {
      await navigator.clipboard.writeText(caption);
      copied = true;
    } catch {
      window.prompt('Copy this caption (Cmd+C), then press OK:', caption);
    }
    try {
      // The thumbnail <img> on this page caches the card WITHOUT the CORS
      // header (R2 only sends it when asked, and doesn't Vary on Origin), and a
      // fetch() would reuse that copy and fail as "Failed to fetch". A unique
      // query string makes this a fresh, CORS request.
      const sep = post.imageUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${post.imageUrl}${sep}dl=${Date.now()}`, { mode: 'cors', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Could not fetch the picture (${res.status})`);
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `prayer-circle-${post.draftedFor || post.id}-${post.slot || 'post'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      this.say(`Picture downloaded${copied ? ' and caption copied' : ''}. On youtube.com: Create → Post, paste, add the picture.`);
    } catch (e) {
      this.say(`${copied ? 'Caption copied, but ' : ''}the picture didn't download: ${e.message || e}. ` +
        'Open the picture (click the thumbnail) and save it instead.', true);
    }
  }

  renderResults(post) {
    const results = post.results || {};
    const nets = Object.keys(results);
    if (!nets.length) {
      return null;
    }
    const label = key => (this.state.data.networks.find(n => n.key === key) || {}).label || key;
    return (
      <div className={styles.results}>
        {nets.map(key => {
          const r = results[key] || {};
          return r.error ? (
            <span key={key} className={styles.danger}>✗ {label(key)}: {r.error}</span>
          ) : (
            <span key={key}>
              ✓ {label(key)}: {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">view post</a> : 'posted'}
            </span>
          );
        })}
      </div>
    );
  }

  renderPost(post) {
    const { data, busy, edits } = this.state;
    const open = post.status === 'draft' || post.status === 'approved';
    const status = STATUS[post.status] || { text: post.status, cls: '' };
    const slot = (data.slots || []).find(s => s.key === post.slot);
    const captions = this.captionsFor(post);
    const dirty = !!edits[post.id];
    const working = busy[post.id];

    return (
      <div key={post.id} className={styles.card}>
        <div className={styles.post}>
          <a href={post.imageUrl} target="_blank" rel="noopener noreferrer">
            <img className={styles.thumb} src={post.imageUrl} alt={post.altText || ''} loading="lazy" />
          </a>
          <div>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>{post.describe}</span>
              <span className={`${styles.pill} ${styles[status.cls] || ''}`}>{status.text}</span>
              <span className={styles.meta}>
                {slot ? `${slot.label} · ` : ''}{when(post.scheduledFor) || post.draftedFor}
                {post.postedAt ? ` · posted ${ago(post.postedAt)}` : ''}
              </span>
            </div>

            {data.networks.filter(n => n.configured).map(n => {
              const text = captions[n.key] || '';
              const over = n.key === 'x' && text.length > data.xLimit;
              return (
                <div key={n.key} className={styles.caption}>
                  <label>
                    <span>{n.label}</span>
                    {n.key === 'x' && <span className={over ? styles.over : ''}>{text.length} / {data.xLimit}</span>}
                  </label>
                  <textarea
                    value={text}
                    rows={n.key === 'x' ? 3 : 5}
                    disabled={!open || !!working}
                    onChange={e => this.edit(post, n.key, e.target.value)}
                  />
                </div>
              );
            })}

            {this.renderResults(post)}

            {(post.status === 'posted' || post.status === 'partial') && post.imageUrl && (
              <div className={styles.actions}>
                <Button value="For YouTube" primary={false} onClick={() => this.forYouTube(post)} />
              </div>
            )}

            {working && <div className={styles.meta}>{working}</div>}
            {open && !working && (
              <div className={styles.actions}>
                {dirty && <Button value="Save captions" primary={false} onClick={() => this.save(post)} />}
                {post.status === 'draft'
                  ? <Button value={dirty ? 'Save & approve' : 'Approve'} primary={true} onClick={() => this.approve(post)} />
                  : <Button value="Unapprove" primary={false} onClick={() => this.act(post, 'unapprove', {}, 'Back to draft')} />}
                <Button value="New caption" primary={false} onClick={() => this.regenerate(post)} />
                <Button value="Reschedule" primary={false} onClick={() => this.reschedule(post)} />
                <Button value="Skip" primary={false} onClick={() => this.skip(post)} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderContent() {
    const { loading, error, data, toast } = this.state;
    const drafts = (data?.upcoming || []).filter(p => p.status === 'draft').length;
    const toolbar = (
      <Toolbar section="Admin" subsection="Social posts">
        <div className={styles.barActions}>
          <Button value={drafts ? `Approve all drafts (${drafts})` : 'Approve all drafts'} primary={true} disabled={!drafts} onClick={() => this.approveAll()} />
          <Button value="Fill the week" primary={false} onClick={() => this.fillWeek()} />
          <Button value="Refresh" primary={false} onClick={() => this.load()} />
        </div>
      </Toolbar>
    );

    let body = null;
    if (error) {
      body = <div className={styles.error}>Social posts couldn't be loaded: {error}</div>;
    } else if (data) {
      const slots = (data.slots || []).map(s => `${s.label.toLowerCase()} at ${s.time}`).join(' and ');
      body = (
        <>
          {!data.enabled && (
            <div className={styles.notice}>
              Publishing is switched off on the server (SOCIAL_ENABLED). You can still approve — approved posts wait until it is on.
            </div>
          )}
          {data.networks.filter(n => !n.configured).map(n => (
            <div key={n.key} className={styles.notice}>{n.label} is not connected, so it is skipped.</div>
          ))}
          <p className={styles.hint}>
            Two posts a day: {slots} (UK time, unless moved). Anything not approved by its time is dropped.
            Edit a caption and it saves with Approve.
          </p>

          <div className={styles.sectionTitle}>Coming up · {data.upcoming.length}</div>
          {data.upcoming.length === 0 && <div className={styles.empty}>Nothing drafted — use “Fill the week”.</div>}
          {data.upcoming.map(p => this.renderPost(p))}

          <div className={styles.sectionTitle}>Last two weeks · {data.recent.length}</div>
          {data.recent.length === 0 && <div className={styles.empty}>Nothing yet.</div>}
          {data.recent.map(p => this.renderPost(p))}
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

export default SocialPosts;
