import mongoose from 'mongoose';
import { config } from './environment.js';

/**
 * Database connection manager
 * Handles MongoDB connection with proper error handling and events
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      console.log('🔄 Connecting to MongoDB...');
      
      // Connect to MongoDB with configuration options
      await mongoose.connect(config.database.uri, config.database.options);
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('🔧 Please check your MongoDB URI in .env file');
      process.exit(1);
    }
  }

  /**
   * Set up MongoDB connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }

  /**
   * Check if database is connected
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
}

// Export singleton instance
export default new DatabaseConnection();
