/*
 * Analytics Configuration Utility
 * Extracts analytics endpoint from Parse Dashboard app configuration
 * 
 * Priority order:
 * 1. Custom analytics.endpoint (recommended for safety)
 * 2. Extract base URL from app.serverURL 
 * 3. Fallback to localhost:1337
 */

/**
 * Gets the analytics server base URL from app context
 * @param {Object} app - The app context from Parse Dashboard
 * @returns {string} - The analytics server base URL
 */
export function getAnalyticsBaseUrl(app) {
  if (!app) {
    return 'http://localhost:1337'; // fallback to Parse Server default port
  }

  // PRIORITY 1: Check if app has a specific analytics configuration (RECOMMENDED)
  if (app.analytics && app.analytics.endpoint) {
    return app.analytics.endpoint;
  }

  // PRIORITY 2: Extract from serverURL - remove '/parse' suffix and use the base
  if (app.serverURL) {
    const serverUrl = app.serverURL.replace(/\/parse\/?$/, '');
    return serverUrl;
  }

  // PRIORITY 3: Fallback to localhost default Parse Server port
  return 'http://localhost:1337';
}

/**
 * Gets the app slug for analytics API calls
 * @param {Object} app - The app context from Parse Dashboard
 * @returns {string} - The app slug to use in API calls
 */
export function getAnalyticsAppSlug(app) {
  if (!app) {
    return 'analytics-demo-app'; // fallback
  }

  return app.slug || app.appId || app.appName || 'analytics-demo-app';
}

/**
 * Builds a complete analytics endpoint URL
 * @param {Object} app - The app context from Parse Dashboard
 * @param {string} endpoint - The specific endpoint path (e.g., 'overview', 'analytics')
 * @returns {string} - The complete URL for the analytics endpoint
 */
export function buildAnalyticsUrl(app, endpoint) {
  const baseUrl = getAnalyticsBaseUrl(app);
  const appSlug = getAnalyticsAppSlug(app);
  return `${baseUrl}/apps/${appSlug}/${endpoint}`;
}
