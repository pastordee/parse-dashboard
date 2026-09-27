// Created: 2026-09-27
/*
 * The Admin section calls the same cloud functions as the admin phone app
 * (pc_server_app → cloud/admin/*.cjs on the server). Those functions accept a
 * master-key call with no user by design (capabilities.cjs requireCapability),
 * so the dashboard's own access is enough — no second sign-in. The audit log
 * records such actions as "master".
 */
import Parse from 'parse';

export async function adminCall(app, name, params = {}) {
  app.setParseKeys();
  return Parse.Cloud.run(name, params, { useMasterKey: true });
}

// "Sun 27 Sep, 07:00" in the viewer's time zone.
export function when(date) {
  if (!date) {
    return '';
  }
  const d = date instanceof Date ? date : new Date(date.iso || date);
  return d.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function ago(date) {
  if (!date) {
    return '';
  }
  const d = date instanceof Date ? date : new Date(date.iso || date);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) {
    return 'just now';
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m ago`;
  }
  if (s < 86400) {
    return `${Math.floor(s / 3600)}h ago`;
  }
  return `${Math.floor(s / 86400)}d ago`;
}
