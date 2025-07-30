import type { BoardState, Player, Move } from '@/types/othello';
import { minimax } from './minimax';
import { getValidMoves, applyMove, getOpponent, getScore } from './othello';

// Mock the othello utility functions
jest.mock('./othello', () => ({
  getValidMoves: jest.fn(),
  applyMove: jest.fn(),  
  getOpponent: jest.fn(),
  getScore: jest.fn(),
}));

const mockGetValidMoves = getValidMoves as jest.MockedFunction<typeof getValidMoves>;
const mockApplyMove = applyMove as jest.MockedFunction<typeof applyMove>;
const mockGetOpponent = getOpponent as jest.MockedFunction<typeof getOpponent>;
const mockGetScore = getScore as jest.MockedFunction<typeof getScore>;

describe('minimax algorithm', () => {
  let mockBoard: BoardState;
  let mockPlayer: Player;
  let mockOpponent: Player;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup a standard 8x8 Othello board with 'empty' cells
    mockBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
    mockPlayer = 'black';
    mockOpponent = 'white';

    // Default mock implementations
    mockGetOpponent.mockImplementation((player: Player) => 
      player === 'black' ? 'white' : 'black'
    );
    mockGetScore.mockReturnValue({ black: 2, white: 2 });
  });

  describe('base cases and termination conditions', () => {
    test('should return evaluation when depth is 0', () => {
      const moves: Move[] = [{ row: 2, col: 3 }];
      mockGetValidMoves.mockReturnValue(moves);
      mockGetScore.mockReturnValue({ black: 10, white: 5 });

      const result = minimax(mockBoard, 0, true, mockPlayer);

      expect(result.score).toBe(5); // 10 - 5 = 5 (base score difference)
      expect(result.move).toBeNull();
      expect(mockGetValidMoves).toHaveBeenCalledWith(mockBoard, mockPlayer);
    });

    test('should return evaluation when no valid moves available', () => {
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 8, white: 3 });

      const result = minimax(mockBoard, 3, true, mockPlayer);

      expect(result.score).toBe(5); // 8 - 3 = 5
      expect(result.move).toBeNull();
    });

    test('should handle zero depth gracefully', () => {
      mockGetValidMoves.mockReturnValue([{ row: 1, col: 1 }]);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      const result = minimax(mockBoard, 0, true, mockPlayer);

      expect(result.score).toBe(0); // Equal pieces, no corner bonus
      expect(result.move).toBeNull();
    });
  });

  describe('board evaluation with corner strategy', () => {
    test('should add corner bonus for player pieces in corners', () => {
      // Setup board with player piece in top-left corner
      const boardWithCorner = Array(8).fill(null).map(() => Array(8).fill('empty'));
      boardWithCorner[0][0] = mockPlayer;
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      const result = minimax(boardWithCorner, 0, true, mockPlayer);

      expect(result.score).toBe(25); // 0 base + 25 corner bonus
    });

    test('should subtract corner bonus for opponent pieces in corners', () => {
      // Setup board with opponent pieces in all four corners
      const boardWithOpponentCorners = Array(8).fill(null).map(() => Array(8).fill('empty'));
      boardWithOpponentCorners[0][0] = mockOpponent;
      boardWithOpponentCorners[0][7] = mockOpponent;
      boardWithOpponentCorners[7][0] = mockOpponent;
      boardWithOpponentCorners[7][7] = mockOpponent;
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 10, white: 10 });

      const result = minimax(boardWithOpponentCorners, 0, true, mockPlayer);

      expect(result.score).toBe(-100); // 0 base - (4 * 25) corner penalty
    });

    test('should handle mixed corner ownership correctly', () => {
      // Setup board with mixed corner ownership
      const mixedCornerBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      mixedCornerBoard[0][0] = mockPlayer;     // +25
      mixedCornerBoard[0][7] = mockOpponent;   // -25
      mixedCornerBoard[7][0] = mockPlayer;     // +25
      // [7][7] remains empty (no bonus/penalty)
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 15, white: 10 });

      const result = minimax(mixedCornerBoard, 0, true, mockPlayer);

      expect(result.score).toBe(30); // 5 base + 50 player corners - 25 opponent corner = 30
    });

    test('should handle empty corners correctly', () => {
      // All corners empty
      const emptyCornerBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 12, white: 8 });

      const result = minimax(emptyCornerBoard, 0, true, mockPlayer);

      expect(result.score).toBe(4); // 12 - 8 = 4, no corner bonuses
    });

    test('should calculate corner bonus for all corner positions', () => {
      // Test each corner individually
      const testCorners = [
        [0, 0], // top-left
        [0, 7], // top-right
        [7, 0], // bottom-left
        [7, 7]  // bottom-right
      ];

      testCorners.forEach(([row, col]) => {
        const boardWithSingleCorner = Array(8).fill(null).map(() => Array(8).fill('empty'));
        boardWithSingleCorner[row][col] = mockPlayer;
        
        mockGetValidMoves.mockReturnValue([]);
        mockGetScore.mockReturnValue({ black: 3, white: 3 });

        const result = minimax(boardWithSingleCorner, 0, true, mockPlayer);

        expect(result.score).toBe(25); // 0 base + 25 corner bonus
      });
    });
  });

  describe('maximizing player behavior', () => {
    test('should select move with highest score when maximizing', () => {
      const moves: Move[] = [
        { row: 2, col: 3 },
        { row: 3, col: 2 },
        { row: 4, col: 5 }
      ];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove
        .mockReturnValueOnce(mockBoard) 
        .mockReturnValueOnce(mockBoard) 
        .mockReturnValueOnce(mockBoard);

      // Create a spy for recursive calls
      const minimaxSpy = jest.spyOn(require('./minimax'), 'minimax');
      minimaxSpy
        .mockReturnValueOnce({ score: 10, move: null })  // First move result
        .mockReturnValueOnce({ score: 25, move: null })  // Second move result (best)
        .mockReturnValueOnce({ score: 15, move: null }); // Third move result

      const result = minimax(mockBoard, 2, true, mockPlayer);

      expect(result.move).toEqual({ row: 3, col: 2 }); // Move with highest score (25)
      expect(result.score).toBe(25);

      minimaxSpy.mockRestore();
    });

    test('should use first move as initial best move', () => {
      const moves: Move[] = [{ row: 1, col: 1 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 5, white: 3 });

      const result = minimax(mockBoard, 1, true, mockPlayer);

      expect(result.move).toEqual({ row: 1, col: 1 });
    });

    test('should handle multiple moves with same score', () => {
      const moves: Move[] = [
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 8, white: 8 });

      const result = minimax(mockBoard, 1, true, mockPlayer);

      // Should return the first move when scores are equal
      expect(result.move).toEqual({ row: 1, col: 1 });
    });
  });

  describe('minimizing player behavior', () => {
    test('should select move with lowest score when minimizing', () => {
      const moves: Move[] = [
        { row: 2, col: 3 },
        { row: 3, col: 2 },
        { row: 4, col: 5 }
      ];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove
        .mockReturnValueOnce(mockBoard)
        .mockReturnValueOnce(mockBoard)
        .mockReturnValueOnce(mockBoard);

      const minimaxSpy = jest.spyOn(require('./minimax'), 'minimax');
      minimaxSpy
        .mockReturnValueOnce({ score: 10, move: null })
        .mockReturnValueOnce({ score: -5, move: null })  // Lowest score (best for minimizer)
        .mockReturnValueOnce({ score: 15, move: null });

      const result = minimax(mockBoard, 2, false, mockPlayer);

      expect(result.move).toEqual({ row: 3, col: 2 }); // Move with lowest score (-5)
      expect(result.score).toBe(-5);

      minimaxSpy.mockRestore();
    });

    test('should initialize with positive infinity for minimizing player', () => {
      const moves: Move[] = [{ row: 1, col: 1 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 3, white: 7 });

      const result = minimax(mockBoard, 1, false, mockPlayer);

      expect(typeof result.score).toBe('number');
      expect(result.move).toEqual({ row: 1, col: 1 });
    });
  });

  describe('alpha-beta pruning optimization', () => {
    test('should respect alpha-beta bounds in maximizing context', () => {
      const moves: Move[] = [
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ];

      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      // Test with custom alpha-beta bounds
      const result = minimax(mockBoard, 1, true, mockPlayer, -10, 10);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });

    test('should respect alpha-beta bounds in minimizing context', () => {
      const moves: Move[] = [
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ];

      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 4, white: 6 });

      const result = minimax(mockBoard, 1, false, mockPlayer, -20, 20);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });

    test('should handle extreme alpha-beta values', () => {
      const moves: Move[] = [{ row: 3, col: 3 }];

      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 10, white: 5 });

      const result = minimax(mockBoard, 1, true, mockPlayer, -Infinity, Infinity);

      expect(result.score).toBeDefined();
      expect(result.move).toEqual({ row: 3, col: 3 });
    });

    test('should trigger alpha-beta pruning when beta <= alpha', () => {
      const moves: Move[] = [
        { row: 1, col: 1 },
        { row: 2, col: 2 },
        { row: 3, col: 3 }
      ];

      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);

      const minimaxSpy = jest.spyOn(require('./minimax'), 'minimax');
      minimaxSpy
        .mockReturnValueOnce({ score: 20, move: null })  // First move  
        .mockReturnValueOnce({ score: 30, move: null });  // Second move should trigger pruning

      // Call with tight alpha-beta window
      const result = minimax(mockBoard, 2, true, mockPlayer, 25, 35);

      // Should stop after second move due to pruning condition
      expect(minimaxSpy).toHaveBeenCalledTimes(2);

      minimaxSpy.mockRestore();
    });
  });

  describe('player alternation and recursion', () => {
    test('should alternate between players correctly in recursion', () => {
      const moves: Move[] = [{ row: 2, col: 3 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);

      minimax(mockBoard, 2, true, mockPlayer);

      // First call should be for the maximizing player (current player)
      expect(mockGetValidMoves).toHaveBeenCalledWith(mockBoard, mockPlayer);
    });

    test('should handle opponent moves when minimizing', () => {
      const moves: Move[] = [{ row: 3, col: 4 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);

      minimax(mockBoard, 2, false, mockPlayer);

      // When minimizing, should get moves for opponent
      expect(mockGetValidMoves).toHaveBeenCalledWith(mockBoard, mockOpponent);
    });

    test('should correctly determine current player based on maximizing flag', () => {
      const moves: Move[] = [{ row: 1, col: 1 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);

      // Test maximizing = true
      minimax(mockBoard, 1, true, 'black');
      expect(mockGetValidMoves).toHaveBeenCalledWith(mockBoard, 'black');

      jest.clearAllMocks();

      // Test maximizing = false  
      minimax(mockBoard, 1, false, 'black');
      expect(mockGetValidMoves).toHaveBeenCalledWith(mockBoard, 'white');
    });
  });

  describe('edge cases and boundary conditions', () => {
    test('should handle empty board correctly', () => {
      const emptyBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 0, white: 0 });

      const result = minimax(emptyBoard, 1, true, mockPlayer);

      expect(result.score).toBe(0); // No pieces, no score
      expect(result.move).toBeNull();
    });

    test('should handle single move scenario', () => {
      const singleMove: Move = { row: 4, col: 4 };
      
      mockGetValidMoves.mockReturnValue([singleMove]);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 8, white: 6 });

      const result = minimax(mockBoard, 1, true, mockPlayer);

      expect(result.move).toEqual(singleMove);
    });

    test('should handle extreme board states', () => {
      // Board where one player dominates completely
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 60, white: 4 });

      const result = minimax(mockBoard, 0, true, mockPlayer);

      expect(result.score).toBe(56); // 60 - 4 = 56
    });

    test('should handle tied board states', () => {
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 32, white: 32 });

      const result = minimax(mockBoard, 0, true, mockPlayer);

      expect(result.score).toBe(0); // Perfect tie
    });

    test('should handle board with only corner pieces', () => {
      const cornerOnlyBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      cornerOnlyBoard[0][0] = 'black';
      cornerOnlyBoard[7][7] = 'white';

      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 1, white: 1 });

      const result = minimax(cornerOnlyBoard, 0, true, 'black');

      expect(result.score).toBe(0); // Base score difference: 1-1=0, corner: +25-25=0
    });

    test('should handle negative depth gracefully', () => {
      mockGetValidMoves.mockReturnValue([{ row: 1, col: 1 }]);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      const result = minimax(mockBoard, -1, true, mockPlayer);

      expect(result.score).toBe(0); // Equal pieces, no corner bonus
      expect(result.move).toBeNull();
    });
  });

  describe('integration with othello utility functions', () => {
    test('should call applyMove with correct parameters', () => {
      const moves: Move[] = [{ row: 3, col: 4 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      minimax(mockBoard, 1, true, mockPlayer);

      expect(mockApplyMove).toHaveBeenCalledWith(
        mockBoard,
        mockPlayer,
        3,
        4
      );
    });

    test('should call getScore for board evaluation in base cases', () => {
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 12, white: 8 });

      minimax(mockBoard, 0, true, mockPlayer);

      expect(mockGetScore).toHaveBeenCalledWith(mockBoard);
    });

    test('should call getOpponent to determine opposing player', () => {
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 5, white: 5 });

      minimax(mockBoard, 0, false, mockPlayer);

      expect(mockGetOpponent).toHaveBeenCalledWith(mockPlayer);
    });

    test('should handle invalid moves gracefully', () => {
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 2, white: 2 });

      const result = minimax(mockBoard, 1, true, mockPlayer);

      expect(result.move).toBeNull();
      expect(result.score).toBe(0); // Equal scores, no corners
    });

    test('should call utility functions with correct board states', () => {
      const moves: Move[] = [{ row: 2, col: 2 }];
      const newBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      newBoard[2][2] = mockPlayer;
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(newBoard);
      mockGetScore.mockReturnValue({ black: 3, white: 2 });

      minimax(mockBoard, 1, true, mockPlayer);

      expect(mockApplyMove).toHaveBeenCalledWith(mockBoard, mockPlayer, 2, 2);
    });
  });

  describe('performance and consistency', () => {
    test('should handle reasonable recursion depth', () => {
      const moves: Move[] = [{ row: 2, col: 2 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 10, white: 8 });

      const result = minimax(mockBoard, 3, true, mockPlayer);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });

    test('should maintain consistency with identical inputs', () => {
      const moves: Move[] = [
        { row: 1, col: 1 },
        { row: 1, col: 2 }
      ];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 4, white: 4 });

      const result1 = minimax(mockBoard, 2, true, mockPlayer);
      const result2 = minimax(mockBoard, 2, true, mockPlayer);

      expect(result1.score).toBe(result2.score);
      expect(result1.move).toEqual(result2.move);
    });

    test('should not throw errors with edge depth values', () => {
      const moves: Move[] = [{ row: 0, col: 0 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 1, white: 1 });

      expect(() => {
        minimax(mockBoard, 1, true, mockPlayer);
      }).not.toThrow();

      expect(() => {
        minimax(mockBoard, 0, true, mockPlayer);
      }).not.toThrow();
    });
  });

  describe('default parameter handling', () => {
    test('should use default alpha and beta values', () => {
      const moves: Move[] = [{ row: 1, col: 1 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 5, white: 3 });

      // Call without alpha/beta parameters
      const result = minimax(mockBoard, 1, true, mockPlayer);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });

    test('should accept custom alpha and beta values', () => {
      const moves: Move[] = [{ row: 2, col: 2 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 6, white: 4 });

      // Call with custom alpha/beta
      const result = minimax(mockBoard, 1, true, mockPlayer, -50, 50);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });

    test('should handle partial parameter specification', () => {
      const moves: Move[] = [{ row: 3, col: 3 }];
      
      mockGetValidMoves.mockReturnValue(moves);
      mockApplyMove.mockReturnValue(mockBoard);
      mockGetScore.mockReturnValue({ black: 7, white: 5 });

      // Call with only alpha specified
      const result = minimax(mockBoard, 1, true, mockPlayer, -10);

      expect(typeof result.score).toBe('number');
      expect(result.move).toBeDefined();
    });
  });

  describe('evaluateBoard function behavior', () => {
    test('should correctly evaluate board with mixed pieces and corners', () => {
      // Complex board state with pieces in various positions
      const complexBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      complexBoard[0][0] = 'black';  // Corner
      complexBoard[0][7] = 'white';  // Corner  
      complexBoard[3][3] = 'black';
      complexBoard[3][4] = 'white';
      complexBoard[4][3] = 'white';
      complexBoard[4][4] = 'black';

      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 3, white: 3 });

      const result = minimax(complexBoard, 0, true, 'black');

      // 3-3=0 base score, +25 for black corner, -25 for white corner = 0
      expect(result.score).toBe(0);
    });

    test('should prioritize corner control in evaluation', () => {
      // Test that corner pieces significantly impact evaluation
      const cornerBoard = Array(8).fill(null).map(() => Array(8).fill('empty'));
      cornerBoard[0][0] = 'black';  // +25 bonus
      
      mockGetValidMoves.mockReturnValue([]);
      mockGetScore.mockReturnValue({ black: 1, white: 5 }); // Black behind in pieces

      const result = minimax(cornerBoard, 0, true, 'black');

      // 1-5=-4 base, +25 corner = 21 (corner bonus overcomes piece deficit)
      expect(result.score).toBe(21);
    });
  });
});