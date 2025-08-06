const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

// Create Parse Server instance
const api = new ParseServer({
  databaseURI: 'mongodb://localhost:27017/parse-test', // Connection string for your MongoDB database
  cloud: './cloud/main.js', // Provide an absolute path to your Cloud Code
  appId: 'test-app-id',
  masterKey: 'test-master-key', // Keep this key secret!
  serverURL: 'http://localhost:1337/parse' // Don't forget to change to https if needed
});

// Serve the Parse API on the /parse URL prefix
app.use('/parse', api.app);

// For testing purposes, we'll also create some dummy data
app.get('/setup', async (req, res) => {
  try {
    // Initialize Parse
    const Parse = require('parse/node');
    Parse.initialize('test-app-id');
    Parse.serverURL = 'http://localhost:1337/parse';
    Parse.masterKey = 'test-master-key';
    
    // Create some sample data
    const TestObject = Parse.Object.extend('TestObject');
    
    // Create sample users
    for (let i = 1; i <= 10; i++) {
      const user = new Parse.User();
      user.set('username', `user${i}`);
      user.set('password', 'password');
      user.set('email', `user${i}@test.com`);
      await user.save(null, { useMasterKey: true });
    }
    
    // Create some test objects
    for (let i = 1; i <= 20; i++) {
      const testObj = new TestObject();
      testObj.set('name', `Test Object ${i}`);
      testObj.set('value', Math.floor(Math.random() * 100));
      await testObj.save(null, { useMasterKey: true });
    }
    
    res.json({ success: true, message: 'Sample data created!' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = 1337;
app.listen(port, () => {
  console.log(`🚀 Parse Server running on http://localhost:${port}/parse`);
  console.log('📊 Visit http://localhost:1337/setup to create sample data');
  console.log('🎛️  Now you can run your Parse Dashboard!');
});
