import app from './src/app.js';
import database from './src/config/database.js';
import { config, validateEnvironment } from './src/config/environment.js';

/**
 * Main Server Entry Point
 * Initializes database connection and starts the server
 */

async function startServer() {
  try {
    console.log('🚀 Starting Student Management Platform API...');
    
    // Validate environment variables
    validateEnvironment();
    
    // Connect to database
    await database.connect();
    
    // Start the server
    const server = app.listen(config.server.port, () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 Server running on: http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Environment: ${config.server.environment}`);
      console.log(`🔗 API Base URL: http://${config.server.host}:${config.server.port}${config.api.prefix}`);
      console.log('📋 Available endpoints:');
      console.log(`   - POST ${config.api.prefix}/auth/institute/register`);
      console.log(`   - POST ${config.api.prefix}/auth/institute/login`);
      console.log(`   - GET  ${config.api.prefix}/auth/institute/profile`);
      console.log(`   - GET  /health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔒 HTTP server closed.');
        
        try {
          // Close database connection
          console.log('🔄 Closing database connection...');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
