import { MongoClient, Db } from 'mongodb';
import { getConfig } from './config/environment';

const config = getConfig();

let client: MongoClient;
let database: Db;

/**
 * Secure MongoDB connection with proper error handling
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; database: Db }> {
  if (client && database) {
    return { client, database };
  }

  try {
    // Create client with secure options
    client = new MongoClient(config.database.uri, {
      ...config.database.options,
      // Additional security options
      ssl: config.nodeEnv === 'production',
      authSource: 'admin',
      retryWrites: true,
      w: 'majority',
    });

    await client.connect();
    database = client.db(config.database.dbName);
    
    // Test the connection
    await database.admin().ping();
    
    console.log(`✅ Connected to MongoDB: ${config.database.dbName}`);
    
    return { client, database };
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    // Don't expose detailed connection errors in production
    if (config.nodeEnv === 'production') {
      throw new Error('Database connection failed');
    } else {
      throw error;
    }
  }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * Get database instance (throws if not connected)
 */
export async function getDatabase(): Promise<Db> {
  if (!database) {
    const connection = await connectToDatabase();
    return connection.database;
  }
  return database;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    const db = await getDatabase();
    await db.admin().ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy'
    };
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});
