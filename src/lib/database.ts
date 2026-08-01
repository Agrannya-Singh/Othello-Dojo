/**
 * MongoDB Database Connection and Utilities
 * 
 * This module provides MongoDB connection management, database utilities,
 * and helper functions for the Othello Dojo application.
 * 
 * Features:
 * - Connection pooling and management
 * - Automatic reconnection handling
 * - Environment-based configuration
 * - Comprehensive error handling
 * - Performance monitoring
 */

import { MongoClient, Db, Collection, ObjectId, type Document } from 'mongodb';
import { z } from 'zod';

// Environment variable validation schema
const DatabaseConfigSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  MONGODB_DB_NAME: z.string().min(1, 'Database name is required'),
  MONGODB_MAX_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  MONGODB_MIN_POOL_SIZE: z.string().transform(Number).pipe(z.number().min(0).max(50)).default('1'),
  MONGODB_MAX_IDLE_TIME_MS: z.string().transform(Number).pipe(z.number().min(1000).max(300000)).default('30000'),
  MONGODB_CONNECT_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().min(1000).max(60000)).default('10000'),
  MONGODB_SOCKET_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().min(1000).max(120000)).default('45000'),
});

// Database configuration type
type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Global variables for connection management
let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;
let connectionPromise: Promise<Db> | null = null;

/**
 * Get database configuration from environment variables
 * @returns Validated database configuration
 * @throws Error if required environment variables are missing or invalid
 */
function getDatabaseConfig(): DatabaseConfig {
  try {
    const config = DatabaseConfigSchema.parse({
      MONGODB_URI: process.env.MONGODB_URI,
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
      MONGODB_MAX_POOL_SIZE: process.env.MONGODB_MAX_POOL_SIZE,
      MONGODB_MIN_POOL_SIZE: process.env.MONGODB_MIN_POOL_SIZE,
      MONGODB_MAX_IDLE_TIME_MS: process.env.MONGODB_MAX_IDLE_TIME_MS,
      MONGODB_CONNECT_TIMEOUT_MS: process.env.MONGODB_CONNECT_TIMEOUT_MS,
      MONGODB_SOCKET_TIMEOUT_MS: process.env.MONGODB_SOCKET_TIMEOUT_MS,
    });
    
    return config;
  } catch (error) {
    console.error('Database configuration error:', error);
    throw new Error('Invalid database configuration. Please check your environment variables.');
  }
}

/**
 * Create MongoDB client with optimized connection options
 * @param config Database configuration
 * @returns Configured MongoDB client
 */
function createClient(config: DatabaseConfig): MongoClient {
  const clientOptions = {
    maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
    minPoolSize: config.MONGODB_MIN_POOL_SIZE,
    maxIdleTimeMS: config.MONGODB_MAX_IDLE_TIME_MS,
    connectTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS,
    socketTimeoutMS: config.MONGODB_SOCKET_TIMEOUT_MS,
    serverSelectionTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS,
    retryWrites: true,
    retryReads: true,
    // Enable connection monitoring
    monitorCommands: process.env.NODE_ENV === 'development',
  };

  return new MongoClient(config.MONGODB_URI, clientOptions);
}

/**
 * Connect to MongoDB database
 * @returns Promise that resolves to the database instance
 * @throws Error if connection fails
 */
export async function connectToDatabase(): Promise<Db> {
  // Return existing connection if available
  if (db && client) {
    try {
      // Test if connection is still alive
      await client.db().admin().ping();
      return db;
    } catch (error) {
      console.warn('Database connection test failed, reconnecting...', error);
      // Connection is dead, proceed with reconnection
    }
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const config = getDatabaseConfig();
      
      console.log('Connecting to MongoDB...', {
        uri: config.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials in logs
        database: config.MONGODB_DB_NAME,
        maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
      });

      // Create new client
      client = createClient(config);
      
      // Connect to database
      await client.connect();
      
      // Get database instance
      db = client.db(config.MONGODB_DB_NAME);
      
      // Test connection
      await db.admin().ping();
      
      console.log('Successfully connected to MongoDB');
      
      // Set up connection event handlers
      client.on('close', () => {
        console.warn('MongoDB connection closed');
        db = null;
        client = null;
        isConnecting = false;
        connectionPromise = null;
      });

      client.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        db = null;
        client = null;
        isConnecting = false;
        connectionPromise = null;
      });

      return db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      isConnecting = false;
      connectionPromise = null;
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return connectionPromise;
}

/**
 * Get database instance (connects if not already connected)
 * @returns Promise that resolves to the database instance
 */
export async function getDatabase(): Promise<Db> {
  if (!db) {
    return connectToDatabase();
  }
  return db;
}

/**
 * Get collection from database
 * @param collectionName Name of the collection
 * @returns Promise that resolves to the collection instance
 */
export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
  const database = await getDatabase();
  return database.collection<T>(collectionName);
}

/**
 * Close database connection
 * @returns Promise that resolves when connection is closed
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    } finally {
      client = null;
      db = null;
      isConnecting = false;
      connectionPromise = null;
    }
  }
}

/**
 * Check if database is connected
 * @returns Promise that resolves to connection status
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    if (!db || !client) {
      return false;
    }
    await client.db().admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get database statistics
 * @returns Promise that resolves to database statistics
 */
export async function getDatabaseStats(): Promise<{
  isConnected: boolean;
  collections: string[];
  databaseName: string;
  connectionPoolSize?: number;
}> {
  try {
    const database = await getDatabase();
    const collections = await database.listCollections().toArray();
    
    return {
      isConnected: await isDatabaseConnected(),
      collections: collections.map(col => col.name),
      databaseName: database.databaseName,
      connectionPoolSize: client?.options.maxPoolSize,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      isConnected: false,
      collections: [],
      databaseName: 'unknown',
    };
  }
}

/**
 * Utility function to create ObjectId from string
 * @param id String ID to convert
 * @returns ObjectId instance
 * @throws Error if invalid ObjectId format
 */
export function createObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
}

/**
 * Utility function to validate ObjectId format
 * @param id String ID to validate
 * @returns True if valid ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

/**
 * Graceful shutdown handler for database connections
 * This should be called when the application is shutting down
 */
export function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing database connections...`);
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}

// Set up graceful shutdown handlers
if (typeof window === 'undefined') {
  setupGracefulShutdown();
}

// Export types for use in other modules
export type { DatabaseConfig };
