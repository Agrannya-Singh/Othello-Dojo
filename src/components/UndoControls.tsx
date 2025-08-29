'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Undo2 } from "lucide-react";
import { TOAST_MESSAGES } from "@/lib/constants/game";
import { toast } from "@/hooks/use-toast";

interface UndoControlsProps {
  /** Current game state to determine if undo is allowed */
  gameState: 'human-vs-human' | 'human-vs-ai' | 'ai-vs-ai';
  
  /** Game history for determining undo availability */
  history: Array<{
    board: any;
    player: 'black' | 'white';
    move: { row: number; col: number } | null;
  }>;
  
  /** Number of moves to undo (controlled input) */
  movesToUndo: number;
  
  /** Whether AI is currently thinking (blocks undo) */
  aiIsThinking: boolean;
  
  /** Handler for undo action */
  onUndo: () => void;
  
  /** Handler for moves to undo input change */
  onMovesToUndoChange: (value: number) => void;
}

/**
 * UndoControls Component
 * 
 * Extracted from main page component to handle all undo-related functionality.
 * Provides a clean interface for undoing moves with proper validation.
 * 
 * Features:
 * - Input field for number of moves to undo
 * - Undo button with proper state management
 * - Validation for different game modes
 * - Toast notifications for user feedback
 */
export function UndoControls({
  gameState,
  history,
  movesToUndo,
  aiIsThinking,
  onUndo,
  onMovesToUndoChange
}: UndoControlsProps) {
  
  // Determine if undo is possible
  const canUndo = history.length > 0 && !aiIsThinking;
  
  // Check if there are enough moves to undo
  const hasEnoughMoves = history.length >= movesToUndo;
  
  // Handle undo button click with validation
  const handleUndoClick = () => {
    // Don't allow undo in AI vs AI mode
    if (gameState === 'ai-vs-ai') {
      toast({
        title: TOAST_MESSAGES.CANNOT_UNDO,
        description: TOAST_MESSAGES.NO_MOVES_TO_UNDO,
      });
      return;
    }
    
    // Check if there are moves to undo
    if (history.length === 0) {
      toast({
        title: TOAST_MESSAGES.CANNOT_UNDO,
        description: TOAST_MESSAGES.NO_MOVES_TO_UNDO,
      });
      return;
    }
    
    // Check if there are enough moves to undo
    if (!hasEnoughMoves) {
      toast({
        title: TOAST_MESSAGES.CANNOT_UNDO,
        description: TOAST_MESSAGES.NOT_ENOUGH_MOVES,
      });
      return;
    }
    
    // Perform the undo
    onUndo();
    
    // Show success message
    toast({
      title: TOAST_MESSAGES.MOVE_UNDONE,
    });
  };
  
  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      onMovesToUndoChange(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Moves to Undo Input */}
      <div className="space-y-2">
        <Label htmlFor="moves-to-undo" className="text-sm font-medium">
          Moves to Undo
        </Label>
        <Input
          id="moves-to-undo"
          type="number"
          min="1"
          max={history.length}
          value={movesToUndo}
          onChange={handleInputChange}
          className="w-full"
          disabled={aiIsThinking || gameState === 'ai-vs-ai'}
        />
      </div>

      {/* Undo Button */}
      <Button
        onClick={handleUndoClick}
        disabled={!canUndo || !hasEnoughMoves || gameState === 'ai-vs-ai'}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <Undo2 className="h-4 w-4" />
        Undo {movesToUndo} Move{movesToUndo !== 1 ? 's' : ''}
      </Button>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Available moves: {history.length}</p>
        {gameState === 'ai-vs-ai' && (
          <p className="text-amber-600">Undo disabled in AI vs AI mode</p>
        )}
        {aiIsThinking && (
          <p className="text-blue-600">Undo disabled while AI is thinking</p>
        )}
        {!hasEnoughMoves && movesToUndo > history.length && (
          <p className="text-red-600">Not enough moves to undo</p>
        )}
      </div>
    </div>
  );
}
