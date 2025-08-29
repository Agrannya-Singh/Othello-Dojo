import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { authenticateApiRequest, checkRateLimit, createSecureErrorResponse, sanitizeInput } from '@/middleware/auth';
import { z } from 'zod';
import * as crypto from 'crypto';

// Input validation schemas
const CreateGameSchema = z.object({
  gameMode: z.enum(['human-vs-human', 'human-vs-ai', 'ai-vs-ai']),
  playerName: z.string().min(1).max(50).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

const UpdateGameSchema = z.object({
  board: z.array(z.array(z.enum(['black', 'white', 'empty']))),
  currentPlayer: z.enum(['black', 'white']),
  gameStatus: z.enum(['playing', 'finished']),
  scores: z.object({
    black: z.number(),
    white: z.number(),
  }),
});

/**
 * POST /api/game-session - Create new game session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return createSecureErrorResponse('Too many requests', 429);
    }

    // Authentication
    const auth = await authenticateApiRequest(request);
    if (!auth.isAuthenticated) {
      return createSecureErrorResponse('Authentication required', 401);
    }

    // Input validation
    const body = await request.json();
    const validatedInput = CreateGameSchema.parse(body);

    // Create game session
    const { database } = await connectToDatabase();
    const gameSession = {
      sessionId: `game_${Date.now()}_${crypto.randomBytes(9).toString('hex')}`,
      ...validatedInput,
      board: createInitialBoard(),
      currentPlayer: 'black' as const,
      gameStatus: 'playing' as const,
      scores: { black: 2, white: 2 },
      moves: [],
      timestamps: {
        created: new Date(),
        lastMove: new Date(),
        updated: new Date(),
      },
      createdBy: auth.sessionId,
    };

    const result = await database.collection('game_sessions').insertOne(gameSession);

    return NextResponse.json({
      success: true,
      gameId: gameSession.sessionId,
      insertedId: result.insertedId,
    });

  } catch (error) {
    console.error('Game session creation error:', error);
    
    if (error instanceof z.ZodError) {
      return createSecureErrorResponse('Invalid input data', 400);
    }
    
    return createSecureErrorResponse('Failed to create game session', 500);
  }
}

/**
 * GET /api/game-session/[id] - Get game session
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const gameId = url.pathname.split('/').pop();
    
    if (!gameId || gameId === 'route.ts') {
      return createSecureErrorResponse('Game ID required', 400);
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return createSecureErrorResponse('Too many requests', 429);
    }

    const { database } = await connectToDatabase();
    const gameSession = await database
      .collection('game_sessions')
      .findOne({ sessionId: gameId });

    if (!gameSession) {
      return createSecureErrorResponse('Game session not found', 404);
    }

    // Remove sensitive internal fields
    const { _id, createdBy, ...publicSession } = gameSession;

    return NextResponse.json({
      success: true,
      data: publicSession,
    });

  } catch (error) {
    console.error('Game session retrieval error:', error);
    return createSecureErrorResponse('Failed to retrieve game session', 500);
  }
}

// Helper function (should be imported from game logic)
function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill('empty'));
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}
