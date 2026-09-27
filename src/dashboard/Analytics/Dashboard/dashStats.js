// Created: 2026-09-27
/*
 * Numbers for Analytics → Dashboard, read straight from the database with the
 * dashboard's own access. Replaces the old endpoints, which counted a user as
 * "active" whenever their _User row changed (a one-off server job touched all
 * 485 rows, so "monthly active" = every user), and a chart that was
 * Math.random().
 *
 * Active = the app's `lastseen` time. A period's change is this period against
 * the one just before it, of the same length.
 */
import Parse from 'parse';

const DAY = 86400000;

const count = (className, build) => {
  const q = new Parse.Query(className);
  build(q);
  return q.count({ useMasterKey: true });
};

const between = (from, to) => q => {
  q.greaterThanOrEqualTo('createdAt', from);
  q.lessThan('createdAt', to);
};

// Percentage change, or null when there is nothing to compare against.
function change(now, before) {
  if (!before) {
    return null;
  }
  return Math.round(((now - before) / before) * 1000) / 10;
}

// createdAt of everything in the window, bucketed per UTC day. The volumes
// here (sign-ups, prayers) are small; the limit keeps a burst from running away.
async function perDay(className, from, days) {
  const rows = await new Parse.Query(className)
    .greaterThanOrEqualTo('createdAt', from)
    .select('objectId')
    .limit(10000)
    .find({ useMasterKey: true });
  const buckets = new Map();
  for (let i = 0; i < days; i++) {
    buckets.set(new Date(from.getTime() + i * DAY).toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const day = r.createdAt.toISOString().slice(0, 10);
    if (buckets.has(day)) {
      buckets.set(day, buckets.get(day) + 1);
    }
  }
  return buckets;
}

export async function loadDashStats(app, days) {
  app.setParseKeys();
  const now = new Date();
  const start = new Date(now - days * DAY);
  const prevStart = new Date(now - 2 * days * DAY);
  const seenSince = d => q => q.greaterThan('lastseen', new Date(now - d * DAY));

  // Chart: at least a week, so "Today" still shows a shape.
  const chartDays = Math.max(days, 7);
  const chartFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (chartDays - 1) * DAY);

  const [
    totalUsers,
    activeDay,
    activeWeek,
    activeMonth,
    activeInPeriod,
    newInPeriodActive,
    signups,
    signupsBefore,
    prayers,
    prayersBefore,
    pushes,
    pushesBefore,
    signupSeries,
    prayerSeries,
  ] = await Promise.all([
    count(Parse.User, () => {}),
    count(Parse.User, seenSince(1)),
    count(Parse.User, seenSince(7)),
    count(Parse.User, seenSince(30)),
    count(Parse.User, seenSince(days)),
    count(Parse.User, q => {
      seenSince(days)(q);
      q.greaterThanOrEqualTo('createdAt', start);
    }),
    count(Parse.User, between(start, now)),
    count(Parse.User, between(prevStart, start)),
    count('Prayer', between(start, now)),
    count('Prayer', between(prevStart, start)),
    count('_PushStatus', between(start, now)),
    count('_PushStatus', between(prevStart, start)),
    perDay(Parse.User, chartFrom, chartDays),
    perDay('Prayer', chartFrom, chartDays),
  ]);

  return {
    totalUsers,
    active: { day: activeDay, week: activeWeek, month: activeMonth },
    engagement: { newUsers: newInPeriodActive, returning: activeInPeriod - newInPeriodActive },
    signups: { value: signups, change: change(signups, signupsBefore), before: signupsBefore },
    prayers: { value: prayers, change: change(prayers, prayersBefore), before: prayersBefore },
    pushes: { value: pushes, change: change(pushes, pushesBefore), before: pushesBefore },
    series: [...signupSeries.keys()].map(day => ({
      day,
      signups: signupSeries.get(day),
      prayers: prayerSeries.get(day),
    })),
  };
}
