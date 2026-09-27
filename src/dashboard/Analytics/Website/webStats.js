// Created: 2026-09-27
/*
 * Website analytics for prayercircle.co.uk, read straight from the WebEvent
 * class with the dashboard's own master-key access — the same numbers as the
 * website's /web-analytics page (server: routes/web-analytics.js, /wa/stats),
 * without its separate admin login.
 *
 * Keep the pipelines in step with /wa/stats if either changes.
 */
import Parse from 'parse';

const CLASS = 'WebEvent';

// Parse renames a pipeline's _id to objectId on the way out, though not
// always consistently — read whichever is present.
const idOf = row => row.objectId ?? row._id ?? null;

// Inside a pipeline a date must be a plain ISO string: Parse turns it into a
// real Date when it rewrites createdAt. {__type:'Date'} silently matches nothing.
const isoDate = d => d.toISOString();

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

function topList(rows, limit) {
  return rows
    .filter(r => idOf(r))
    .map(r => ({ name: String(idOf(r)), count: r.count || 0 }))
    .slice(0, limit);
}

export async function loadWebStats(app, days) {
  app.setParseKeys();
  const aggregate = pipeline => new Parse.Query(CLASS).aggregate(pipeline, { useMasterKey: true });

  const fromDay = utcDay(new Date(Date.now() - (days - 1) * 86400000));
  const match = { day: { $gte: fromDay } };
  const views = { ...match, type: 'pageview' };

  const [
    viewRows,
    visitorRows,
    sessionRows,
    seriesRows,
    pageRows,
    refRows,
    deviceRows,
    osRows,
    browserRows,
    countryRows,
    eventRows,
    durationRows,
    bounceRows,
    liveRows,
    advertRows,
  ] = await Promise.all([
    aggregate([{ $match: views }, { $count: 'n' }]),
    aggregate([{ $match: match }, { $group: { _id: '$visitor' } }, { $count: 'n' }]),
    aggregate([{ $match: match }, { $group: { _id: '$session' } }, { $count: 'n' }]),
    aggregate([
      { $match: views },
      { $group: { _id: '$day', views: { $sum: 1 }, visitors: { $addToSet: '$visitor' } } },
      { $project: { views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { _id: 1 } },
    ]),
    aggregate([{ $match: views }, { $group: { _id: '$path', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
    aggregate([
      { $match: { ...match, referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    aggregate([{ $match: views }, { $group: { _id: '$device', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    aggregate([{ $match: views }, { $group: { _id: '$os', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    aggregate([{ $match: views }, { $group: { _id: '$browser', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    aggregate([
      { $match: { ...views, country: { $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    aggregate([
      { $match: { ...match, type: 'event' } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 60 },
    ]),
    aggregate([
      { $match: { ...match, type: 'exit', seconds: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$seconds' }, n: { $sum: 1 } } },
    ]),
    // A bounce is a visit that produced exactly one page view.
    aggregate([
      { $match: views },
      { $group: { _id: '$session', views: { $sum: 1 } } },
      { $group: { _id: null, sessions: { $sum: 1 }, single: { $sum: { $cond: [{ $eq: ['$views', 1] }, 1, 0] } } } },
    ]),
    // "Right now": distinct visitors in the last five minutes.
    aggregate([
      { $match: { createdAt: { $gte: isoDate(new Date(Date.now() - 5 * 60000)) } } },
      { $group: { _id: '$visitor' } },
      { $count: 'n' },
    ]),
    // /download hits, one row per (advert tag, where it sent them).
    aggregate([
      { $match: { ...match, type: 'event', path: '/download' } },
      { $group: { _id: { name: '$name', detail: '$detail' }, count: { $sum: 1 } } },
    ]),
  ]);

  const first = (rows, key) => (rows[0] ? rows[0][key] ?? 0 : 0);

  // One entry per advert tag, split by where the visitor went next.
  const advertMap = new Map();
  for (const r of advertRows) {
    const key = idOf(r) || {};
    const name = String(key.name || '');
    if (!name.startsWith('download:')) {
      continue;
    }
    const src = name.slice('download:'.length);
    const a = advertMap.get(src) || { src, count: 0, app_store: 0, google_play: 0, page: 0 };
    a.count += r.count || 0;
    if (key.detail in a) {
      a[key.detail] += r.count || 0;
    }
    advertMap.set(src, a);
  }

  // Quiet days show as zero rather than being skipped.
  const byDay = new Map(seriesRows.map(r => [String(idOf(r)), r]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = utcDay(new Date(Date.now() - i * 86400000));
    const row = byDay.get(day);
    series.push({ day, views: row?.views || 0, visitors: row?.visitors || 0 });
  }

  const durTotal = first(durationRows, 'total');
  const durCount = first(durationRows, 'n');
  const bounceSessions = first(bounceRows, 'sessions');
  const events = topList(eventRows.filter(r => !String(idOf(r)).startsWith('download:')), 20);
  const downloads = events.find(e => e.name === 'app_download');

  return {
    range: { days, from: fromDay, to: utcDay() },
    totals: {
      pageviews: first(viewRows, 'n'),
      visitors: first(visitorRows, 'n'),
      sessions: first(sessionRows, 'n'),
      avgSeconds: durCount ? Math.round(durTotal / durCount) : 0,
      bounceRate: bounceSessions ? Math.round((first(bounceRows, 'single') / bounceSessions) * 100) : 0,
      online: first(liveRows, 'n'),
      downloads: downloads ? downloads.count : 0,
    },
    series,
    pages: topList(pageRows, 15),
    referrers: topList(refRows, 15),
    devices: topList(deviceRows, 6),
    os: topList(osRows, 8),
    browsers: topList(browserRows, 8),
    countries: topList(countryRows, 15),
    events,
    adverts: [...advertMap.values()].sort((x, y) => y.count - x.count),
  };
}
