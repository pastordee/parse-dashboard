import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Loader from 'components/Loader/Loader.react';
import { useParams } from 'react-router-dom';
import { CurrentApp } from 'context/currentApp';
import AppsManager from 'lib/AppsManager';
import styles from '../Dashboard/AnalyticsDashboard.scss';
import Toolbar from 'components/Toolbar/Toolbar.react';

// Wrapper component to inject useParams hook
function CustomAnalyticsPluginWrapper() {
  const params = useParams();
  return <CustomAnalyticsPluginComponent params={params} />;
}

class CustomAnalyticsPluginComponent extends DashboardView {
  static contextType = CurrentApp;
  constructor(props) {
    super(props);
    this.section = 'Analytics';
    this.state = {
      plugin: null,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.loadPlugin();
  }

  loadPlugin = () => {
    try {
      const { pluginId } = this.props.params || {};

      // Get the plugin config from app config via AppsManager
      const appSlug = this.context ? this.context.slug : '';
      const apps = AppsManager.apps();
      const currentApp = apps.find(app => app.slug === appSlug);
      const plugins = currentApp?.analytics?.customPlugins || [];
      const plugin = plugins.find(p => p.id === pluginId);

      if (plugin) {
        this.setState({
          plugin,
          subsection: plugin.label,
          loading: false
        });
        return;
      }

      // If not found in AppsManager, try fetching from /analytics-config endpoint
      if (this.context?.serverURL) {
        const rootURL = this.context.serverURL.replace(/\/parse$/, '');
        fetch(`${rootURL}/analytics-config`)
          .then(res => res.json())
          .then(data => {
            const fetchedPlugins = data?.analytics?.customPlugins || [];
            const foundPlugin = fetchedPlugins.find(p => p.id === pluginId);
            if (foundPlugin) {
              this.setState({
                plugin: foundPlugin,
                subsection: foundPlugin.label,
                loading: false
              });
            } else {
              this.setState({
                error: `Plugin "${pluginId}" not found`,
                loading: false
              });
            }
          })
          .catch(err => {
            this.setState({
              error: `Failed to load plugin: ${err.message}`,
              loading: false
            });
          });
      } else {
        this.setState({
          error: `Plugin "${pluginId}" not found`,
          loading: false
        });
      }
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  }

  renderContent() {
    const { plugin, loading, error } = this.state;

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return (
        <div className={styles.empty}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>Error Loading Plugin</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (!plugin) {
      return <div>Plugin not found</div>;
    }

    // Handle different plugin types
    if (plugin.type === 'remote-html' || plugin.type === 'iframe') {
      // Nothing above this has a fixed height, so "height: 100%" fell back to
      // the browser's 150px iframe default. Size it to the window instead:
      // everything below the dashboard's fixed 96px title bar.
      return (
        <div>
          <div style={{ paddingTop: '96px', height: '100vh', boxSizing: 'border-box', display: 'flex' }}>
            <iframe
              src={plugin.url}
              style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={plugin.label}
            />
          </div>
          <Toolbar section="Analytics" subsection={plugin.label} />
        </div>
      );
    }

    return (
      <div className={styles.empty}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Unknown plugin type: {plugin.type}</p>
        </div>
      </div>
    );
  }
}

export default CustomAnalyticsPluginWrapper;
