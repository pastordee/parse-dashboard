const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes to allow the dashboard to connect
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
}));

app.use(express.json());

// Simulate some realistic analytics data
let analyticsData = {
    totalUsers: 2847,
    totalObjects: 15432,
    apiCalls: 1205,
    activeSessions: 67,
    lastUpdated: new Date()
};

// Helper function to generate realistic fluctuations
function updateMetrics() {
    const now = new Date();
    const timeDiff = now - analyticsData.lastUpdated;
    
    // Update metrics with small random changes every few seconds
    if (timeDiff > 5000) { // Update every 5 seconds
        analyticsData.totalUsers += Math.floor(Math.random() * 10) - 2; // ±2 to 8
        analyticsData.totalObjects += Math.floor(Math.random() * 50) - 10; // ±10 to 40
        analyticsData.apiCalls += Math.floor(Math.random() * 100) - 30; // ±30 to 70
        analyticsData.activeSessions += Math.floor(Math.random() * 20) - 5; // ±5 to 15
        
        // Ensure no negative values
        analyticsData.totalUsers = Math.max(1000, analyticsData.totalUsers);
        analyticsData.totalObjects = Math.max(5000, analyticsData.totalObjects);
        analyticsData.apiCalls = Math.max(100, analyticsData.apiCalls);
        analyticsData.activeSessions = Math.max(10, analyticsData.activeSessions);
        
        analyticsData.lastUpdated = now;
    }
}

// Main analytics overview endpoint
app.get('/api/analytics/overview', (req, res) => {
    updateMetrics();
    
    const response = {
        timestamp: new Date().toISOString(),
        metrics: {
            totalUsers: analyticsData.totalUsers,
            totalObjects: analyticsData.totalObjects,
            apiCalls: analyticsData.apiCalls,
            activeSessions: analyticsData.activeSessions
        },
        changes: {
            users: '+' + (Math.random() * 20 + 5).toFixed(1) + '% this month',
            objects: '+' + (Math.random() * 15 + 3).toFixed(1) + '% this week',
            api: (Math.random() > 0.3 ? '+' : '-') + (Math.random() * 10 + 1).toFixed(1) + '% today',
            sessions: '+' + (Math.random() * 25 + 5).toFixed(1) + '% this hour'
        },
        source: 'live-demo' // Indicates this is live demo data
    };
    
    console.log(`📊 Analytics request from ${req.ip} - Users: ${response.metrics.totalUsers}, Objects: ${response.metrics.totalObjects}`);
    res.json(response);
});

// User analytics endpoint
app.get('/api/analytics/users', (req, res) => {
    updateMetrics();
    
    res.json({
        timestamp: new Date().toISOString(),
        totalUsers: analyticsData.totalUsers,
        activeUsers: Math.floor(analyticsData.totalUsers * 0.15),
        newUsers: Math.floor(Math.random() * 50) + 10,
        userGrowth: {
            daily: '+' + (Math.random() * 5 + 1).toFixed(1) + '%',
            weekly: '+' + (Math.random() * 15 + 5).toFixed(1) + '%',
            monthly: '+' + (Math.random() * 30 + 10).toFixed(1) + '%'
        }
    });
});

// Performance analytics endpoint
app.get('/api/analytics/performance', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        serverMetrics: {
            cpuUsage: (Math.random() * 40 + 20).toFixed(1) + '%',
            memoryUsage: (Math.random() * 30 + 40).toFixed(1) + '%',
            diskUsage: (Math.random() * 20 + 60).toFixed(1) + '%',
            networkIO: (Math.random() * 100 + 50).toFixed(0) + ' MB/s'
        },
        responseTime: {
            average: (Math.random() * 100 + 50).toFixed(0) + 'ms',
            p95: (Math.random() * 200 + 150).toFixed(0) + 'ms',
            p99: (Math.random() * 500 + 300).toFixed(0) + 'ms'
        },
        activeSessions: analyticsData.activeSessions
    });
});

// Real-time analytics endpoint
app.get('/api/analytics/realtime', (req, res) => {
    updateMetrics();
    
    res.json({
        timestamp: new Date().toISOString(),
        liveMetrics: {
            currentUsers: analyticsData.activeSessions,
            requestsPerMinute: Math.floor(Math.random() * 200) + 100,
            errorRate: (Math.random() * 2).toFixed(2) + '%',
            dataTransfer: (Math.random() * 50 + 25).toFixed(1) + ' MB/min'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// Root endpoint with server info
app.get('/', (req, res) => {
    res.json({
        name: 'Parse Dashboard Analytics Demo Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/analytics/overview',
            '/api/analytics/users',
            '/api/analytics/performance',
            '/api/analytics/realtime',
            '/health'
        ],
        message: 'Analytics server is running! 🚀'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// Start server
const PORT = process.env.PORT || process.env.MAIN_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Parse Dashboard Analytics Demo Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
    console.log(`🌐 Local access: http://localhost:${PORT}`);
    console.log(`🔗 Network access: http://192.168.0.138:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Available endpoints:');
    console.log('   GET  /api/analytics/overview');
    console.log('   GET  /api/analytics/users');
    console.log('   GET  /api/analytics/performance');
    console.log('   GET  /api/analytics/realtime');
    console.log('   GET  /health');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Ready to serve analytics data!');
    
    // Update metrics every 5 seconds
    setInterval(updateMetrics, 5000);
});

module.exports = app;
