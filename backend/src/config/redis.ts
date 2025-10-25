import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 5000)
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();

    // Test the connection
    await redisClient.ping();
    logger.info('Redis connection successful');

  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Cache utilities
export const cacheSet = async (key: string, value: string, expireInSeconds?: number): Promise<void> => {
  try {
    if (expireInSeconds) {
      await redisClient.setEx(key, expireInSeconds, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logger.error('Cache set error:', error);
    throw error;
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Cache get error:', error);
    throw error;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
    throw error;
  }
};