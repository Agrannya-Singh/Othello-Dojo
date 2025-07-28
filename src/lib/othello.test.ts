import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialBoard,
  getOpponent,
  isValidMove,
  getValidMoves,
  applyMove,
  getScore,
  boardToString
} from './othello';
import type { BoardState, Player } from '@/types/othello';

describe('Othello Game Logic', () => {
  let initialBoard: BoardState;

  beforeEach(() => {
    initialBoard = createInitialBoard();
  });

  describe('createInitialBoard', () => {
    it('should create an 8x8 board', () => {
      const board = createInitialBoard();
      expect(board).toHaveLength(8);
      board.forEach(row => {
        expect(row).toHaveLength(8);
      });
    });

    it('should initialize with correct starting pieces', () => {
      const board = createInitialBoard();
      expect(board[3][3]).toBe('white');
      expect(board[3][4]).toBe('black');
      expect(board[4][3]).toBe('black');
      expect(board[4][4]).toBe('white');
    });

    it('should fill remaining positions with empty', () => {
      const board = createInitialBoard();
      let emptyCount = 0;
      board.forEach(row => {
        row.forEach(cell => {
          if (cell === 'empty') emptyCount++;
        });
      });
      expect(emptyCount).toBe(60); // 64 - 4 initial pieces
    });

    it('should create a new board instance each time', () => {
      const board1 = createInitialBoard();
      const board2 = createInitialBoard();
      expect(board1).not.toBe(board2);
      expect(board1[0]).not.toBe(board2[0]);
    });
  });

  describe('getOpponent', () => {
    it('should return white when given black', () => {
      expect(getOpponent('black')).toBe('white');
    });

    it('should return black when given white', () => {
      expect(getOpponent('white')).toBe('black');
    });
  });

  describe('isValidMove', () => {
    it('should return true for valid opening moves', () => {
      expect(isValidMove(initialBoard, 'black', 2, 3)).toBe(true);
      expect(isValidMove(initialBoard, 'black', 3, 2)).toBe(true);
      expect(isValidMove(initialBoard, 'black', 4, 5)).toBe(true);
      expect(isValidMove(initialBoard, 'black', 5, 4)).toBe(true);
    });

    it('should return false for occupied positions', () => {
      expect(isValidMove(initialBoard, 'black', 3, 3)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 3, 4)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 4, 3)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 4, 4)).toBe(false);
    });

    it('should return false for positions outside board', () => {
      expect(isValidMove(initialBoard, 'black', -1, 0)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 8, 0)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 0, -1)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 0, 8)).toBe(false);
    });

    it('should return false for empty positions that do not flip pieces', () => {
      expect(isValidMove(initialBoard, 'black', 0, 0)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 7, 7)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 1, 1)).toBe(false);
    });

    it('should work for white player moves', () => {
      expect(isValidMove(initialBoard, 'white', 2, 4)).toBe(true);
      expect(isValidMove(initialBoard, 'white', 3, 5)).toBe(true);
      expect(isValidMove(initialBoard, 'white', 4, 2)).toBe(true);
      expect(isValidMove(initialBoard, 'white', 5, 3)).toBe(true);
    });

    it('should validate complex board states', () => {
      // Create a custom board state for more complex validation
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[3][3] = 'white';
      customBoard[3][4] = 'black';
      customBoard[3][5] = 'black';
      customBoard[3][6] = 'white';
      
      expect(isValidMove(customBoard, 'white', 3, 2)).toBe(true); // Can capture the black piece
      expect(isValidMove(customBoard, 'black', 3, 7)).toBe(true); // Can capture the white piece
    });
  });

  describe('getValidMoves', () => {
    it('should return correct number of valid moves for initial board', () => {
      const blackMoves = getValidMoves(initialBoard, 'black');
      const whiteMoves = getValidMoves(initialBoard, 'white');
      
      expect(blackMoves).toHaveLength(4);
      expect(whiteMoves).toHaveLength(4);
    });

    it('should return correct positions for black player initial moves', () => {
      const blackMoves = getValidMoves(initialBoard, 'black');
      const expectedMoves = [
        { row: 2, col: 3 },
        { row: 3, col: 2 },
        { row: 4, col: 5 },
        { row: 5, col: 4 }
      ];
      
      expect(blackMoves).toEqual(expect.arrayContaining(expectedMoves));
    });

    it('should return correct positions for white player initial moves', () => {
      const whiteMoves = getValidMoves(initialBoard, 'white');
      const expectedMoves = [
        { row: 2, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 2 },
        { row: 5, col: 3 }
      ];
      
      expect(whiteMoves).toEqual(expect.arrayContaining(expectedMoves));
    });

    it('should return empty array when no valid moves exist', () => {
      // Create a board where a player has no valid moves
      const fullBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('black'));
      const moves = getValidMoves(fullBoard, 'white');
      expect(moves).toEqual([]);
    });

    it('should handle edge case with single piece surrounded', () => {
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[3][3] = 'black';
      customBoard[3][2] = 'white';
      customBoard[3][4] = 'white';
      customBoard[2][3] = 'white';
      customBoard[4][3] = 'white';
      
      const moves = getValidMoves(customBoard, 'white');
      // Should have no valid moves since surrounded piece cannot be captured
      expect(moves).toEqual([]);
    });
  });

  describe('applyMove', () => {
    it('should place piece and flip opponent pieces', () => {
      const newBoard = applyMove(initialBoard, 'black', 2, 3);
      
      expect(newBoard[2][3]).toBe('black');
      expect(newBoard[3][3]).toBe('black'); // Flipped from white
      expect(newBoard[3][4]).toBe('black'); // Original black piece
      expect(newBoard[4][3]).toBe('black'); // Original black piece
      expect(newBoard[4][4]).toBe('white'); // Original white piece
    });

    it('should not modify original board', () => {
      const originalBoard = createInitialBoard();
      const newBoard = applyMove(originalBoard, 'black', 2, 3);
      
      expect(originalBoard).not.toBe(newBoard);
      expect(originalBoard[2][3]).toBe('empty');
      expect(originalBoard[3][3]).toBe('white');
    });

    it('should return original board for invalid moves', () => {
      const originalBoard = createInitialBoard();
      const resultBoard = applyMove(originalBoard, 'black', 0, 0);
      
      expect(resultBoard).toBe(originalBoard);
    });

    it('should handle moves that flip multiple directions', () => {
      // Create a custom board state
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[3][2] = 'white';
      customBoard[3][3] = 'white';
      customBoard[3][4] = 'white';
      customBoard[2][3] = 'white';
      customBoard[4][3] = 'white';
      customBoard[3][5] = 'black';
      customBoard[3][1] = 'black';
      customBoard[1][3] = 'black';
      customBoard[5][3] = 'black';
      
      const newBoard = applyMove(customBoard, 'black', 3, 3);
      
      // Should flip pieces in multiple directions
      expect(newBoard[3][3]).toBe('black');
      expect(newBoard[3][2]).toBe('black');
      expect(newBoard[3][4]).toBe('black');
      expect(newBoard[2][3]).toBe('black');
      expect(newBoard[4][3]).toBe('black');
    });

    it('should handle white player moves correctly', () => {
      const newBoard = applyMove(initialBoard, 'white', 2, 4);
      
      expect(newBoard[2][4]).toBe('white');
      expect(newBoard[3][4]).toBe('white'); // Flipped from black
    });

    it('should handle diagonal flips', () => {
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[3][3] = 'black';
      customBoard[4][4] = 'black';
      customBoard[5][5] = 'white';
      
      const newBoard = applyMove(customBoard, 'white', 2, 2);
      
      expect(newBoard[2][2]).toBe('white');
      expect(newBoard[3][3]).toBe('white'); // Flipped
      expect(newBoard[4][4]).toBe('white'); // Flipped
      expect(newBoard[5][5]).toBe('white'); // Original
    });
  });

  describe('getScore', () => {
    it('should return correct initial scores', () => {
      const score = getScore(initialBoard);
      expect(score).toEqual({ black: 2, white: 2 });
    });

    it('should count all pieces correctly', () => {
      // Create a board with known piece counts
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          customBoard[i][j] = 'black';
        }
      }
      for (let i = 5; i < 8; i++) {
        for (let j = 5; j < 8; j++) {
          customBoard[i][j] = 'white';
        }
      }
      
      const score = getScore(customBoard);
      expect(score).toEqual({ black: 9, white: 9 });
    });

    it('should handle empty board', () => {
      const emptyBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      const score = getScore(emptyBoard);
      expect(score).toEqual({ black: 0, white: 0 });
    });

    it('should handle board with only one color', () => {
      const blackBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('black'));
      const score = getScore(blackBoard);
      expect(score).toEqual({ black: 64, white: 0 });
    });

    it('should update scores after moves', () => {
      const newBoard = applyMove(initialBoard, 'black', 2, 3);
      const score = getScore(newBoard);
      expect(score).toEqual({ black: 4, white: 1 });
    });
  });

  describe('boardToString', () => {
    it('should convert initial board to correct string representation', () => {
      const boardString = boardToString(initialBoard);
      const lines = boardString.split('\n');
      
      expect(lines).toHaveLength(8);
      lines.forEach(line => {
        expect(line).toHaveLength(8);
      });
      
      expect(lines[3]).toBe('___WB___');
      expect(lines[4]).toBe('___BW___');
    });

    it('should use correct symbols for each piece type', () => {
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[0][0] = 'black';
      customBoard[0][1] = 'white';
      customBoard[0][2] = 'empty';
      
      const boardString = boardToString(customBoard);
      const firstLine = boardString.split('\n')[0];
      
      expect(firstLine.substring(0, 3)).toBe('BW_');
    });

    it('should handle full board correctly', () => {
      const fullBoard: BoardState = Array(8).fill(null).map((_, row) => 
        Array(8).fill(null).map((_, col) => 
          (row + col) % 2 === 0 ? 'black' : 'white'
        )
      );
      
      const boardString = boardToString(fullBoard);
      const lines = boardString.split('\n');
      
      expect(lines).toHaveLength(8);
      expect(lines[0]).toBe('BWBWBWBW');
      expect(lines[1]).toBe('WBWBWBWB');
    });

    it('should handle empty board', () => {
      const emptyBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      const boardString = boardToString(emptyBoard);
      const lines = boardString.split('\n');
      
      expect(lines).toHaveLength(8);
      lines.forEach(line => {
        expect(line).toBe('________');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle boundary conditions for move validation', () => {
      expect(isValidMove(initialBoard, 'black', 7, 7)).toBe(false);
      expect(isValidMove(initialBoard, 'black', 0, 0)).toBe(false);
    });

    it('should handle moves on edges and corners', () => {
      const customBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('empty'));
      customBoard[0][1] = 'white';
      customBoard[0][2] = 'black';
      
      expect(isValidMove(customBoard, 'white', 0, 0)).toBe(false);
      expect(isValidMove(customBoard, 'black', 0, 3)).toBe(true);
    });

    it('should maintain immutability in all functions', () => {
      const originalBoard = createInitialBoard();
      const originalString = JSON.stringify(originalBoard);
      
      isValidMove(originalBoard, 'black', 2, 3);
      getValidMoves(originalBoard, 'black');
      getScore(originalBoard);
      boardToString(originalBoard);
      
      expect(JSON.stringify(originalBoard)).toBe(originalString);
    });

    it('should handle consecutive moves correctly', () => {
      let board = createInitialBoard();
      board = applyMove(board, 'black', 2, 3);
      board = applyMove(board, 'white', 2, 2);
      board = applyMove(board, 'black', 1, 3);
      
      const score = getScore(board);
      expect(score.black).toBeGreaterThan(0);
      expect(score.white).toBeGreaterThan(0);
      expect(score.black + score.white).toBeLessThanOrEqual(64);
    });
  });

  describe('Integration Tests', () => {
    it('should play a complete game scenario', () => {
      let board = createInitialBoard();
      
      // Black's turn
      expect(getValidMoves(board, 'black')).toHaveLength(4);
      board = applyMove(board, 'black', 2, 3);
      
      // White's turn
      const whiteMoves = getValidMoves(board, 'white');
      expect(whiteMoves.length).toBeGreaterThan(0);
      board = applyMove(board, 'white', 2, 2);
      
      // Verify game state
      const score = getScore(board);
      expect(score.black + score.white).toBe(6);
    });

    it('should handle game where player has no valid moves', () => {
      // Create a scenario where one player is blocked
      const blockedBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill('white'));
      blockedBoard[0][0] = 'empty';
      blockedBoard[7][7] = 'black';
      
      const blackMoves = getValidMoves(blockedBoard, 'black');
      expect(blackMoves).toEqual([]);
    });
  });
});