# Custom Analytics Pages for Parse Dashboard

This feature allows you to provide your own custom analytics HTML pages that will be served when users navigate to the Analytics Dashboard section.

## 🎯 **Overview**

Instead of using the default analytics page, you can now specify a custom HTML file for each app in your Parse Dashboard configuration. This gives you complete control over:

- **Design & Branding**: Match your company's visual identity
- **Custom Metrics**: Display your specific KPIs and business metrics  
- **Data Integration**: Connect directly to your Parse Server or external APIs
- **Interactive Charts**: Use any charting library (Chart.js, D3.js, etc.)
- **Real-time Updates**: Implement live data with WebSockets or polling

## 🔧 **Configuration**

### Basic Setup

Add the `analyticsPage` property to any app in your Parse Dashboard configuration:

```json
{
  "apps": [
    {
      "serverURL": "http://localhost:1339/parse",
      "appId": "my-app-id",
      "masterKey": "my-master-key",
      "appName": "My App",
      "analytics": true,
      "analyticsPage": "/path/to/your/custom-analytics.html"
    }
  ],
  "users": [
    {
      "user": "admin", 
      "pass": "password",
      "apps": [{"appId": "my-app-id"}]
    }
  ]
}
```

### Path Options

The `analyticsPage` can be:

1. **Absolute Path**: `/home/user/analytics/dashboard.html`
2. **Relative Path**: `./custom-analytics/dashboard.html` (relative to dashboard root)
3. **URL**: `https://mycompany.com/analytics.html` (external hosting)

## 📁 **File Structure Example**

```
my-parse-dashboard/
├── Parse-Dashboard/
│   └── public/
│       └── analytics.html          # Default analytics page
├── custom-analytics/
│   ├── company-dashboard.html      # Your custom page
│   ├── mobile-app-analytics.html   # App-specific analytics
│   └── assets/
│       ├── css/
│       └── js/
└── config.json                     # Dashboard configuration
```

## 🎨 **Creating Custom Analytics Pages**

### 1. Basic HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Custom Analytics</title>
    <style>
        /* Your custom styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 20px;
        }
        
        .analytics-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .back-button {
            display: inline-flex;
            align-items: center;
            padding: 10px 16px;
            background: #169CEE;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        
        /* Add your custom styles */
    </style>
</head>
<body>
    <div class="analytics-container">
        <a href="#" onclick="history.back()" class="back-button">
            ← Back to Dashboard
        </a>
        
        <h1>My Custom Analytics Dashboard</h1>
        
        <!-- Your custom content here -->
        <div id="metrics-grid">
            <!-- Add your metrics cards -->
        </div>
        
        <div id="charts-section">
            <!-- Add your charts -->
        </div>
    </div>
    
    <script>
        // Your custom JavaScript
    </script>
</body>
</html>
```

### 2. Connecting to Parse Server

```javascript
// Initialize Parse (if using Parse SDK)
Parse.initialize("YOUR_APP_ID", "YOUR_JS_KEY");
Parse.serverURL = 'http://your-parse-server.com/parse';

// Fetch data from your Parse Server
async function loadAnalytics() {
    try {
        // Query user data
        const userQuery = new Parse.Query(Parse.User);
        const userCount = await userQuery.count();
        
        // Query custom objects
        const MyObject = Parse.Object.extend("MyClass");
        const objectQuery = new Parse.Query(MyObject);
        const objectCount = await objectQuery.count();
        
        // Update your UI
        document.getElementById('user-count').textContent = userCount;
        document.getElementById('object-count').textContent = objectCount;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadAnalytics);
```

### 3. Using Chart Libraries

```html
<!-- Include Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// Create a custom chart
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'User Growth',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: '#169CEE',
            backgroundColor: 'rgba(22, 156, 238, 0.1)'
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Custom User Growth Chart'
            }
        }
    }
});
</script>
```

## 🔄 **Multiple Apps with Different Analytics**

You can configure different analytics pages for different apps:

```json
{
  "apps": [
    {
      "appId": "mobile-app",
      "appName": "Mobile App",
      "analyticsPage": "./analytics/mobile-dashboard.html"
    },
    {
      "appId": "web-app", 
      "appName": "Web App",
      "analyticsPage": "./analytics/web-dashboard.html"
    },
    {
      "appId": "api-service",
      "appName": "API Service"
      // No analyticsPage = uses default analytics.html
    }
  ]
}
```

## 🚀 **Advanced Features**

### Real-time Updates

```javascript
// Poll for updates every 30 seconds
setInterval(async () => {
    await loadAnalytics();
}, 30000);

// Or use WebSockets for real-time data
const socket = new WebSocket('ws://your-websocket-server.com');
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    updateDashboard(data);
};
```

### Custom API Integration

```javascript
// Fetch data from external APIs
async function loadExternalMetrics() {
    try {
        const response = await fetch('/api/custom-metrics');
        const metrics = await response.json();
        
        // Update your dashboard
        updateMetrics(metrics);
    } catch (error) {
        console.error('Failed to load external metrics:', error);
    }
}
```

### Responsive Design

```css
/* Make your dashboard responsive */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
}

@media (max-width: 768px) {
    .analytics-container {
        padding: 10px;
    }
    
    .metrics-grid {
        grid-template-columns: 1fr;
    }
}
```

## 🛠️ **Testing Your Custom Analytics**

1. **Create your HTML file** with custom analytics
2. **Update your config.json** to include the `analyticsPage` property
3. **Restart Parse Dashboard**
4. **Navigate** to Analytics → Dashboard for your app
5. **Verify** your custom page loads correctly

## 📋 **Best Practices**

### Security
- ✅ Always validate and sanitize data from external sources
- ✅ Use HTTPS for external API calls
- ✅ Implement proper authentication for sensitive data

### Performance
- ✅ Optimize images and assets
- ✅ Use CDNs for external libraries
- ✅ Implement efficient data fetching (pagination, caching)
- ✅ Minimize JavaScript bundle size

### User Experience
- ✅ Include a "Back to Dashboard" button
- ✅ Add loading states for data fetching
- ✅ Handle error states gracefully
- ✅ Make the interface responsive
- ✅ Provide meaningful error messages

### Development
- ✅ Use version control for your analytics files
- ✅ Test on different screen sizes
- ✅ Validate HTML and CSS
- ✅ Use browser developer tools for debugging

## 🐛 **Troubleshooting**

### Common Issues

**File not found error:**
- Verify the path in `analyticsPage` is correct
- Check file permissions
- Ensure the file exists at the specified location

**Page loads but no data:**
- Check browser console for JavaScript errors
- Verify Parse Server connection
- Test API endpoints separately

**Styling issues:**
- Check for CSS syntax errors
- Verify external CSS/JS libraries are loading
- Test in different browsers

### Fallback Behavior

If a custom analytics page fails to load:
1. Parse Dashboard logs a warning
2. Falls back to the default `analytics.html`
3. User still gets a functional analytics page

## 📚 **Examples**

Check out these example configurations:

- **Basic Custom Analytics**: `/examples/basic-custom-analytics.html`
- **Chart.js Integration**: `/examples/chartjs-analytics.html`
- **Real-time Dashboard**: `/examples/realtime-analytics.html`
- **Multi-app Setup**: `/examples/multi-app-config.json`

## 🔗 **Resources**

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [D3.js Examples](https://d3js.org/)
- [Parse JavaScript SDK](https://docs.parseplatform.org/js/guide/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

## 💡 **Need Help?**

If you need assistance creating custom analytics pages:

1. Check the Parse Dashboard documentation
2. Review the example files provided
3. Test with the demo configuration
4. Open an issue on GitHub for bugs or feature requests

Happy analytics building! 📊✨
