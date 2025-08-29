/**
 * Game constants for Othello Dojo
 * Centralizes all magic numbers and timing values
 */

// Game board configuration
export const GAME_BOARD = {
  SIZE: 8,
  TOTAL_SQUARES: 64,
} as const;

// Animation and timing constants
export const TIMING = {
  ANIMATION_DURATION: 500,        // Flipping pieces animation
  AI_THINKING_DELAY: 1000,       // AI decision simulation
  SOUND_DELAY: 200,              // Sound effect delay
} as const;

// UI constants
export const UI = {
  SCROLL_AREA_HEIGHT: 48,        // h-48 for scroll areas
  LOADER_SIZE: 8,                // w-8 h-8 for loading spinner
} as const;

// Toast messages for consistent UX
export const TOAST_MESSAGES = {
  // Undo related
  CANNOT_UNDO: "Cannot Undo",
  MOVE_UNDONE: "Move Undone",
  NO_MOVES_TO_UNDO: "No moves to undo or action not allowed in AI vs AI mode.",
  NOT_ENOUGH_MOVES: "Not enough moves to undo",
  
  // Turn management
  TURN_SKIPPED: "Turn Skipped",
  TURN_SKIPPED_DESC: (player: string, opponent: string) => 
    `No valid moves for ${player}. ${opponent}'s turn.`,
  
  // AI suggestions
  AI_SUGGESTION: "AI Suggestion",
  AI_SUGGESTION_DESC: (moveString: string) => 
    `The AI suggests moving to ${moveString}.`,
  NO_SUGGESTION: "No Suggestion Available",
  NO_SUGGESTION_DESC: "There are no valid moves to suggest.",
  
  // Errors
  ERROR: "Error",
  SUGGESTION_ERROR: "Could not get a move suggestion. Please try again.",
} as const;

// Game analysis constants
export const ANALYSIS = {
  LOADING_HEIGHT: 48,            // h-48 for analysis loading area
  LOADER_TEXT: "The AI is analyzing your game...",
} as const;
