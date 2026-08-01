'use server';

import { z } from 'zod';
import { getCollection } from '@/lib/database';
import type { Player } from '@/types/othello';
import { ObjectId } from 'mongodb';

// Import the schemas from the new single source of truth.
import { GameDBSchema, MoveHistoryItemSchema, type GameDocument } from '@/lib/models'; // Assuming 'models.ts' is in 'lib' or a similar path. wrong name inported fixed 

/**
 * Creates a new game record in the database.
 * @returns The ID of the newly created game document.
 */
export async function createGame(
  gameSettings: Pick<GameDocument, 'gameMode' | 'userPlayer' | 'difficulty' | 'aiDifficulties'>
) {
  try {
    const gamesCollection = await getCollection('games');
    const newGameData: Omit<GameDocument, '_id'> = {
      ...gameSettings,
      moveHistory: [], // History starts empty, moves are pushed individually
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // The GameDBSchema is now imported, ensuring consistency.
    const validatedData = GameDBSchema.parse(newGameData);
    const result = await gamesCollection.insertOne(validatedData);
    
    // Return the ID as a string for client-side use
    return { success: true, gameId: result.insertedId.toString() };
  } catch (error) {
    console.error('Failed to create game:', error);
    return { success: false, message: 'Could not start a new game.' };
  }
}

/**
 * Retrieves a specific game from the database by its ID.
 */
export async function getGameById(gameId: string) {
  if (!ObjectId.isValid(gameId)) {
    return { success: false, message: 'Invalid game ID.' };
  }
  try {
    const gamesCollection = await getCollection('games');
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return { success: false, message: 'Game not found.' };
    }

    // Convert ObjectId to string for serialization
    const serializableGame = {
      ...game,
      _id: game._id.toString(),
    };
    return { success: true, game: serializableGame };
  } catch (error) {
    console.error('Failed to get game:', error);
    return { success: false, message: 'Error retrieving game data.' };
  }
}

/**
 * Adds a single move to a game's history.
 */
export async function addMoveToGame(gameId: string, moveData: z.infer<typeof MoveHistoryItemSchema>) {
  if (!ObjectId.isValid(gameId)) {
    return { success: false, message: 'Invalid game ID.' };
  }
  try {
    // The MoveHistoryItemSchema is now imported, ensuring consistency.
    const validatedMove = MoveHistoryItemSchema.parse(moveData);
    const gamesCollection = await getCollection('games');
    
    const result = await gamesCollection.updateOne(
      { _id: new ObjectId(gameId) },
      {
        $push: { moveHistory: validatedMove as any },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Game not found.' };
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to add move:', error);
    return { success: false, message: 'Could not save the move.' };
  }
}

/**
 * Updates a game record when it concludes.
 */
export async function concludeGame(
  gameId: string,
  gameResult: { winner: Player | 'draw'; finalScore: { black: number; white: number } }
) {
  if (!ObjectId.isValid(gameId)) {
    return { success: false, message: 'Invalid game ID.' };
  }
  try {
    const gamesCollection = await getCollection('games');
    const result = await gamesCollection.updateOne(
      { _id: new ObjectId(gameId) },
      {
        $set: {
          status: 'completed',
          winner: gameResult.winner,
          finalScore: gameResult.finalScore,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) {
      return { success: false, message: 'Game not found.' };
    }
    return { success: true, message: 'Game saved to database!' };
  } catch (error) {
    console.error('Failed to save game:', error);
    return { success: false, message: 'An error occurred while saving the game.' };
  }
}
