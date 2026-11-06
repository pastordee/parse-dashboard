// Created: 2026-11-06
/*
 * Push opens (owner, 2026-11-06). The server tags every push with its
 * _PushStatus id; the app reports a tap through the pushOpened cloud function,
 * which writes one PushOpen row per push per device. PushOpen is master-only,
 * so these reads use the master key like the Admin pages.
 *
 * Only app builds from 2.5.19 (1008) on report opens.
 */
import Parse from 'parse';

const OPEN_LIMIT = 1000;

export async function opensFor(app, pushId) {
  app.setParseKeys();
  const query = new Parse.Query('PushOpen');
  query.equalTo('pushId', pushId);
  query.include('user');
  query.ascending('createdAt');
  query.limit(OPEN_LIMIT);
  return query.find({ useMasterKey: true });
}

// { pushId: opens } for a page of the push list.
export async function openCounts(app, pushIds) {
  const counts = {};
  if (!pushIds.length) {
    return counts;
  }
  app.setParseKeys();
  const query = new Parse.Query('PushOpen');
  query.containedIn('pushId', pushIds);
  query.select('pushId');
  query.limit(10000);
  const rows = await query.find({ useMasterKey: true });
  rows.forEach(row => {
    const id = row.get('pushId');
    counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}

// The app's shownName: display name, else username, capitalised.
export function personName(user) {
  if (!user) {
    return 'Signed out';
  }
  for (const key of ['displayName', 'username', 'fullName', 'firstName']) {
    const value = user.get(key);
    if (typeof value === 'string' && value.trim()) {
      const name = value.trim();
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  return user.id;
}

export function handle(user) {
  const username = user && user.get('username');
  return username ? `@${username}` : '';
}

// "45 s", "12 min", "3 h 5 min", "2 days".
export function duration(seconds) {
  if (seconds == null) {
    return '';
  }
  if (seconds < 60) {
    return `${seconds} s`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  if (minutes < 48 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${Math.round(minutes / 1440)} days`;
}

export function summary(opens, numSent) {
  const count = opens.length;
  const seconds = opens.map(o => o.get('secondsToOpen')).filter(s => s != null).sort((a, b) => a - b);
  const median = seconds.length ? seconds[Math.floor(seconds.length / 2)] : null;
  const byPlatform = {};
  opens.forEach(o => {
    const p = o.get('platform') || 'unknown';
    byPlatform[p] = (byPlatform[p] || 0) + 1;
  });
  return {
    count,
    rate: numSent ? Math.round((count / numSent) * 1000) / 10 : null,
    median,
    byPlatform,
    coldStarts: opens.filter(o => o.get('coldStart')).length,
  };
}

// Opens per hour after sending, as Chart points [[ms, count]].
export function hourlyPoints(opens) {
  const buckets = {};
  opens.forEach(o => {
    const hour = new Date(o.createdAt);
    hour.setMinutes(0, 0, 0);
    const t = hour.getTime();
    buckets[t] = (buckets[t] || 0) + 1;
  });
  return Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b)
    .map(t => [t, buckets[t]]);
}
