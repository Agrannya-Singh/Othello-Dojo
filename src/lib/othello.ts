import type { BoardState, Player } from '@/types/othello';
import { GAME_BOARD } from './constants/game';

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function createInitialBoard(): BoardState {
  const board: BoardState = Array(GAME_BOARD.SIZE).fill(null).map(() => Array(GAME_BOARD.SIZE).fill('empty'));
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  return board;
}

export const getOpponent = (player: Player): Player => (player === 'black' ? 'white' : 'black');

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < GAME_BOARD.SIZE && col >= 0 && col < GAME_BOARD.SIZE;
}

export function isValidMove(board: BoardState, row: number, col: number, player: Player): boolean {
  if (board[row][col] !== 'empty') return false;

  for (const [dr, dc] of DIRECTIONS) {
    if (hasValidDirection(board, row, col, dr, dc, player)) {
      return true;
    }
  }
  return false;
}

function hasValidDirection(board: BoardState, row: number, col: number, dr: number, dc: number, player: Player): boolean {
  const opponent = getOpponent(player);
  let r = row + dr;
  let c = col + dc;
  let foundOpponent = false;

  while (isInsideBoard(r, c)) {
    if (board[r][c] === 'empty') return false;
    if (board[r][c] === opponent) {
      foundOpponent = true;
    } else if (board[r][c] === player) {
      return foundOpponent;
    }
    r += dr;
    c += dc;
  }
  return false;
}

export function makeMove(board: BoardState, row: number, col: number, player: Player): BoardState {
  const newBoard = board.map(row => [...row]);
  newBoard[row][col] = player;

  for (const [dr, dc] of DIRECTIONS) {
    if (hasValidDirection(board, row, col, dr, dc, player)) {
      let r = row + dr;
      let c = col + dc;
      while (isInsideBoard(r, c) && board[r][c] === getOpponent(player)) {
        newBoard[r][c] = player;
        r += dr;
        c += dc;
      }
    }
  }

  return newBoard;
}

export function getValidMoves(board: BoardState, player: Player): { row: number; col: number }[] {
  const moves: { row: number; col: number }[] = [];
  for (let row = 0; row < GAME_BOARD.SIZE; row++) {
    for (let col = 0; col < GAME_BOARD.SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

export function countPieces(board: BoardState): { black: number; white: number } {
  let black = 0;
  let white = 0;
  
  for (let row = 0; row < GAME_BOARD.SIZE; row++) {
    for (let col = 0; col < GAME_BOARD.SIZE; col++) {
      if (board[row][col] === 'black') black++;
      else if (board[row][col] === 'white') white++;
    }
  }
  
  return { black, white };
}

export function getPiecesToFlip(board: BoardState, row: number, col: number, player: Player): { row: number; col: number }[] {
  const piecesToFlip: { row: number; col: number }[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    if (hasValidDirection(board, row, col, dr, dc, player)) {
      let r = row + dr;
      let c = col + dc;
      while (isInsideBoard(r, c) && board[r][c] === getOpponent(player)) {
        piecesToFlip.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
    }
  }

  return piecesToFlip;
}
