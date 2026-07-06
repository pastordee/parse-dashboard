import React from 'react';
import DashboardView from 'dashboard/DashboardView.react';
import Loader from 'components/Loader/Loader.react';
import { useParams } from 'react-router-dom';
import { CurrentApp } from 'context/currentApp';
import styles from '../Dashboard/AnalyticsDashboard.scss';

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

      // Get the plugin config from app context
      const plugins = this.context?.analytics?.customPlugins || [];
      const plugin = plugins.find(p => p.id === pluginId);

      if (!plugin) {
        this.setState({
          error: `Plugin "${pluginId}" not found`,
          loading: false
        });
        return;
      }

      this.setState({
        plugin,
        subsection: plugin.label,
        loading: false
      });
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
      return (
        <iframe
          src={plugin.url}
          style={{
            width: '100%',
            height: plugin.height || '800px',
            border: 'none',
            borderRadius: '4px',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={plugin.label}
        />
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
