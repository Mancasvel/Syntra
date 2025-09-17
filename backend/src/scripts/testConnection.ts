import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '@/models';
import { logger } from '@/utils/logger';

// Load environment variables
dotenv.config();

async function testMongoDBConnection() {
  try {
    logger.info('🔄 Testing MongoDB Atlas connection...');
    
    // Test connection
    await connectDB();
    
    logger.info('✅ MongoDB Atlas connection successful!');
    logger.info('🎉 Database is ready for Syntra');
    
    // Test basic operations
    const { User } = await import('@/models');
    
    // Try to count documents (should work even if collection doesn't exist)
    const userCount = await User.countDocuments();
    logger.info(`📊 Current user count: ${userCount}`);
    
    logger.info('🚀 All database operations working correctly');
    
  } catch (error: any) {
    logger.error('❌ MongoDB Atlas connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      logger.error('🔑 Authentication failed - check your username and password in MONGODB_URI');
    } else if (error.message.includes('network')) {
      logger.error('🌐 Network error - check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('MONGODB_URI')) {
      logger.error('⚙️  MONGODB_URI environment variable is missing or invalid');
      logger.info('📝 Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
    }
    
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

// Run the test
testMongoDBConnection();
