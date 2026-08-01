/**
 * @file page.tsx
 * @description The main component for the OthelloAI Dojo application.
 * It manages all game state and logic, handles user interactions, and orchestrates
 * the rendering of all UI components and server actions for game persistence.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Bot, BrainCircuit, Lightbulb, BarChart, Info, Undo, ListCollapse, Users, Trophy, RotateCcw, Settings, BookOpen, Cpu } from 'lucide-react';
import type { BoardState, Player, Move } from '@/types/othello';
import { createInitialBoard, getValidMoves, applyMove, getScore, getOpponent, boardToString, getFlipsForMove } from '@/lib/othello';
import OthelloBoard from '@/components/othello-board';
import GameInfoPanel from '@/components/game-info-panel';
import AiPanel from '@/components/ai-panel';
import { visualizeAiDecision } from '@/ai/flows/real-time-decision-visualization';
import { analyzeGame } from '@/ai/flows/game-analysis';
import type { AnalyzeGameOutput } from '@/ai/flows/game-analysis';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { minimax } from '@/lib/minimax';
import { getCnnModelMove, preloadCnnModel } from '@/lib/cnn-model';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// Import the corrected, individual server actions for game persistence.
import { createGame, addMoveToGame, concludeGame } from '@/app/actions/gameActions';

const rowLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function Home() {
  // Core Game State
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [userPlayer, setUserPlayer] = useState<Player | null>('black');
  const [score, setScore] = useState({ black: 2, white: 2 });
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [gameMode, setGameMode] = useState<'playerVsAi' | 'aiVsAi'>('playerVsAi');
  const [history, setHistory] = useState<{ board: BoardState; player: Player; move: Move | null }[]>([]);

  /**
   * @state {string | null} gameId - The MongoDB document _id for the current game session.
   * This is crucial for persisting moves and concluding the game. It is null if no game is active.
   */
  const [gameId, setGameId] = useState<string | null>(null);

  // Difficulty State
  const [difficulty, setDifficulty] = useState(1);
  const [ai1Difficulty, setAi1Difficulty] = useState(1);
  const [ai2Difficulty, setAi2Difficulty] = useState(1);

  // UI & Interaction State
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [flippingPieces, setFlippingPieces] = useState<Move[]>([]);
  const { toast } = useToast();

  // AI Feature State
  const [suggestion, setSuggestion] = useState<{ move: Move; rationale: string } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [visualization, setVisualization] = useState<{ explanation: string } | null>(null);
  const [visualizationLoading, setVisualizationLoading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [gameAnalysis, setGameAnalysis] = useState<AnalyzeGameOutput | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Advanced Undo State
  const [showAdvancedUndo, setShowAdvancedUndo] = useState(false);
  const [undoMoveCount, setUndoMoveCount] = useState(1);

  // Preload model weights in the browser on page load
  useEffect(() => {
    preloadCnnModel();
  }, []);

  const playSound = (sound: 'place' | 'flip') => {
    // Sound logic can be re-enabled here if needed.
  };

  /**
   * Recalculates valid moves for the current player, updates the score,
   * and checks for game-over conditions (no valid moves for either player).
   * @param {BoardState} currentBoard - The current state of the game board.
   * @param {Player} player - The player whose turn it is.
   */
  const updateGameData = useCallback((currentBoard: BoardState, player: Player) => {
    const newValidMoves = getValidMoves(currentBoard, player);
    setValidMoves(newValidMoves);
    setScore(getScore(currentBoard));

    if (newValidMoves.length === 0) {
      const opponent = getOpponent(player);
      const opponentMoves = getValidMoves(currentBoard, opponent);

      if (opponentMoves.length === 0) {
        setGameState('gameOver');
      } else {
        toast({
          title: "Turn Skipped",
          description: `No valid moves for ${player}. ${opponent}'s turn.`,
        });
        setCurrentPlayer(opponent);
      }
    }
  }, [toast]);

  /**
   * Effect to update game data (valid moves, score) whenever the board or
   * current player changes during an active game.
   */
  useEffect(() => {
    if (gameState === 'playing') {
      updateGameData(board, currentPlayer);
    }
  }, [board, currentPlayer, gameState, updateGameData]);

  /**
   * Effect to trigger the final save operation when the game concludes.
   * This calls the `concludeGame` server action to update the game document
   * with the final status, winner, and score.
   */
  useEffect(() => {
    if (gameState === 'gameOver') {
      const handleConcludeGame = async () => {
        if (!gameId) {
          console.error("Game Over: Cannot conclude game without a valid gameId.");
          return;
        }

        const finalScore = getScore(board);
        const winner: Player | 'draw' = finalScore.black > finalScore.white ? 'black' : finalScore.white > finalScore.black ? 'white' : 'draw';
        const gameResult = { winner, finalScore };

        const result = await concludeGame(gameId, gameResult);

        if (result.success) {
          toast({ title: "Game Over!", description: `Winner: ${winner}. Game result saved.` });
        } else {
          toast({ title: "Save Failed", description: result.message, variant: "destructive" });
        }
      };
      handleConcludeGame();
    }
  }, [gameState, board, gameId, toast]);

  /**
   * Processes a player or AI move. Updates the local board state and history,
   * and then calls the `addMoveToGame` server action to persist the move.
   * @param {Move} move - The move to be executed.
   */
  const handlePlayerMove = async (move: Move) => {
    const boardBeforeMove = board;
    const newBoard = applyMove(board, currentPlayer, move.row, move.col);
    const flipped = getFlipsForMove(board, currentPlayer, move.row, move.col);

    setFlippingPieces(flipped.map(p => ({ ...p })));
    setTimeout(() => setFlippingPieces([]), 500);

    playSound('place');
    if (flipped.length > 0) {
      setTimeout(() => playSound('flip'), 200);
    }

    setHistory(prev => [...prev, { board: boardBeforeMove, player: currentPlayer, move }]);
    setBoard(newBoard);
    setLastMove(move);
    setCurrentPlayer(getOpponent(currentPlayer));
    setSuggestion(null);

    // Persist the move to the database if a game is active.
    if (gameId) {
      const moveData = { player: currentPlayer, move };
      const result = await addMoveToGame(gameId, moveData);
      if (!result.success) {
        toast({ title: "Save Error", description: "The last move could not be saved.", variant: "destructive" });
      }
    }
  };

  /**
   * Handles user clicks on the Othello board cells, validating and executing the move.
   * @param {Move} move - The cell coordinates that were clicked.
   */
  const handleCellClick = (move: Move) => {
    if (gameState !== 'playing' || currentPlayer !== userPlayer || aiIsThinking || gameMode === 'aiVsAi') return;
    const isMoveValid = validMoves.some(m => m.row === move.row && m.col === move.col);
    if (!isMoveValid) return;

    handlePlayerMove(move);
  };

  /**
   * Resets the entire game state to its initial default values.
   * Also clears the `gameId`, effectively ending the previous session.
   */
  const resetGame = () => {
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setGameState('menu');
    setSuggestion(null);
    setVisualization(null);
    setLastMove(null);
    setHistory([{ board: initialBoard, player: 'black', move: null }]);
    setGameAnalysis(null);
    setGameId(null);
  };

  /**
   * Initializes a new game session. Resets local state and calls the `createGame`
   * server action to create a new document in the database, storing its ID.
   * @param {'playerVsAi' | 'aiVsAi'} mode - The selected game mode.
   * @param {Player | null} player - The color the user chose to play as, if applicable.
   */
  const startGame = async (mode: 'playerVsAi' | 'aiVsAi', player: Player | null) => {
    // Reset local state for a new game
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setGameState('playing');
    setHistory([{ board: initialBoard, player: 'black', move: null }]);
    setGameAnalysis(null);
    setSuggestion(null);
    setVisualization(null);
    setLastMove(null);
    setUserPlayer(player);
    setGameMode(mode);

    // Prepare settings for the new game document.
    const gameSettings = {
      gameMode: mode,
      userPlayer: player,
      ...(mode === 'playerVsAi' && { difficulty }),
      ...(mode === 'aiVsAi' && { aiDifficulties: { ai1: ai1Difficulty, ai2: ai2Difficulty } }),
    };

    // Create the game document in the database.
    const result = await createGame(gameSettings);
    if (result.success && result.gameId) {
      setGameId(result.gameId); // Store the new game's ID.
      toast({ title: "New Game Started", description: "Game session is being saved." });
    } else {
      toast({ title: "Database Error", description: "Could not create a new game record.", variant: "destructive" });
    }
  };

  const startPlayerVsAiGame = async (player: Player) => startGame('playerVsAi', player);
  const startAiVsAiGame = async () => startGame('aiVsAi', null);

  const handleSuggestMove = async () => {
    if (gameMode === 'aiVsAi' || !userPlayer) return;
    setSuggestionLoading(true);
    setSuggestion(null);

    try {
      if (difficulty === 6) {
        const { move, rationale } = await getCnnModelMove(board, currentPlayer);
        if (move) {
          setSuggestion({ move, rationale });
          const moveString = `${rowLabels[move.row]}${move.col + 1}`;
          toast({ title: "Trained Model Suggestion", description: `ResNet-8 CNN V3 suggests moving to ${moveString}.` });
        } else {
          toast({ title: "No Suggestion Available", description: "There are no valid moves to suggest.", variant: "destructive" });
        }
      } else {
        const { move } = minimax(board, difficulty, true, currentPlayer);
        if (move) {
          const moveString = `${rowLabels[move.row]}${move.col + 1}`;
          const rationale = `The optimal move is ${moveString}. This move maximizes your score based on the AI's analysis.`;
          setSuggestion({ move, rationale });
          toast({ title: "AI Suggestion", description: `The AI suggests moving to ${moveString}.` });
        } else {
          toast({ title: "No Suggestion Available", description: "There are no valid moves to suggest.", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error("Error getting move suggestion:", error);
      toast({ title: "Error", description: "Could not get a move suggestion.", variant: "destructive" });
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleVisualize = async () => {
    setVisualizationLoading(true);
    setVisualization(null);
    try {
      const opponent = gameMode === 'playerVsAi' && userPlayer ? getOpponent(userPlayer) : 'white';
      const currentScore = getScore(board);
      const possibleMoves = getValidMoves(board, opponent).map(move => {
        const tempBoard = applyMove(board, opponent, move.row, move.col);
        const newScore = getScore(tempBoard);
        return { row: move.row, col: move.col, score: newScore[opponent] - currentScore[opponent] };
      });

      const response = await visualizeAiDecision({ boardState: boardToString(board), possibleMoves });
      setVisualization(response);
      toast({ title: "AI Decision Visualization", description: "The AI's thought process has been visualized." });
    } catch (error) {
      console.error("Error visualizing decision:", error);
      toast({ title: "Error", description: "Could not visualize AI decision.", variant: "destructive" });
    } finally {
      setVisualizationLoading(false);
    }
  };

  const handleReviewGame = async () => {
    if (history.length <= 1) return;
    setAnalysisLoading(true);
    setIsReviewDialogOpen(true);
    setGameAnalysis(null);

    try {
      const moveHistoryStr = history.slice(1).map((entry, index) =>
        `${index + 1}. ${entry.player} ${entry.move ? `${rowLabels[entry.move.row]}${entry.move.col + 1}` : 'N/A'}`
      ).join(', ');

      const finalScore = getScore(board);
      const winner = finalScore.black > finalScore.white ? 'black' : finalScore.white > finalScore.black ? 'white' : 'draw';
      const finalScoreStr = `Black: ${finalScore.black}, White: ${finalScore.white}`;

      const response = await analyzeGame({ moveHistory: moveHistoryStr, winner, finalScore: finalScoreStr });
      setGameAnalysis(response);
    } catch (error) {
      console.error("Error analyzing game:", error);
      toast({ title: "Analysis Failed", description: "Could not get game analysis from the AI.", variant: "destructive" });
      setIsReviewDialogOpen(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const runNewTrainingSession = () => {
    if (gameMode === 'playerVsAi' && userPlayer) {
      startPlayerVsAiGame(userPlayer);
    } else if (gameMode === 'aiVsAi') {
      startAiVsAiGame();
    }
    toast({ title: "New Training Session", description: "AI model game state reset." });
  };

  const handleUndo = (movesToUndo?: number, forceUndo: boolean = false) => {
    if (!forceUndo && (history.length < 2 || gameMode === 'aiVsAi')) {
      toast({ title: "Cannot Undo", description: "No moves to undo or action not allowed in AI vs AI mode.", variant: "destructive" });
      return;
    }

    let calculatedMovesToUndo = movesToUndo;
    if (calculatedMovesToUndo === undefined) {
      calculatedMovesToUndo = (userPlayer === currentPlayer) ? 1 : 2;
    }

    if (calculatedMovesToUndo <= 0) {
      toast({ title: "Invalid Undo", description: "Number of moves to undo must be greater than 0.", variant: "destructive" });
      return;
    }

    if (history.length <= calculatedMovesToUndo) {
      const initialBoard = createInitialBoard();
      setBoard(initialBoard);
      setCurrentPlayer('black');
      setHistory([{ board: initialBoard, player: 'black', move: null }]);
      toast({ title: "Game Reset", description: `Undid all ${history.length - 1} moves. Game reset to initial state.` });
      return;
    }

    const newHistory = history.slice(0, -calculatedMovesToUndo);
    const lastState = newHistory[newHistory.length - 1];

    if (lastState) {
      setBoard(lastState.board);
      setCurrentPlayer(lastState.player);
      setLastMove(lastState.move);
      setHistory(newHistory);
      const moveText = calculatedMovesToUndo === 1 ? 'move' : 'moves';
      toast({ title: "Undo Successful", description: `Undid ${calculatedMovesToUndo} ${moveText}.` });
    }
  };

  const handleAdvancedUndo = (moveCount: number) => {
    if (moveCount <= 0 || moveCount >= history.length) {
      toast({ title: "Invalid Input", description: `Please enter a number between 1 and ${history.length - 1}.`, variant: "destructive" });
      return;
    }
    handleUndo(moveCount, true);
  };

  const handleUndoAll = () => {
    if (history.length <= 1) {
      toast({ title: "No Moves to Undo", description: "Game is already at the initial state.", variant: "destructive" });
      return;
    }
    handleUndo(history.length - 1, true);
  };

  const aiPlayer = useMemo(() => {
    if (gameMode === 'playerVsAi' && userPlayer) {
      return getOpponent(userPlayer);
    }
    return null;
  }, [userPlayer, gameMode]);

  useEffect(() => {
    if (gameState !== 'playing' || aiIsThinking) return;

    const handleAiMove = async (aiDifficulty: number, aiColor: Player) => {
      setAiIsThinking(true);
      const moves = getValidMoves(board, aiColor);
      if (moves.length > 0) {
        let bestMove: Move | null = null;
        if (aiDifficulty === 6) {
          const res = await getCnnModelMove(board, aiColor);
          bestMove = res.move;
        } else {
          const res = minimax(board, aiDifficulty, true, aiColor);
          bestMove = res.move;
        }
        if (bestMove) {
          handlePlayerMove(bestMove);
        }
      }
      setAiIsThinking(false);
    };

    if (gameMode === 'playerVsAi' && currentPlayer === aiPlayer) {
      handleAiMove(difficulty, aiPlayer);
    } else if (gameMode === 'aiVsAi') {
      const currentAiDifficulty = currentPlayer === 'black' ? ai1Difficulty : ai2Difficulty;
      handleAiMove(currentAiDifficulty, currentPlayer);
    }
  }, [gameState, currentPlayer, aiPlayer, aiIsThinking, board, difficulty, gameMode, ai1Difficulty, ai2Difficulty]);

  const displayedSuggestion = suggestion && (
    <div className="text-sm p-3 bg-muted rounded-md space-y-1">
      <p><strong className="text-primary">Suggested Move:</strong> {`${rowLabels[suggestion.move.row]}${suggestion.move.col + 1}`}</p>
      <p className="font-code text-muted-foreground">{suggestion.rationale}</p>
    </div>
  );

  const canUndo = gameState === 'playing' && history.length > 1 && !aiIsThinking && gameMode === 'playerVsAi' && currentPlayer === userPlayer;
  const canAdvancedUndo = gameState === 'playing' && history.length > 1 && !aiIsThinking;
  const availableMoves = history.length - 1;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 font-body">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <Bot className="w-10 h-10 text-primary" />
          <h1 className="text-4xl sm:text-5xl font-bold font-headline tracking-tighter text-primary">
            OthelloAI Dojo
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">Observe, Learn, and Play against a learning Othello AI.</p>
        <div className="mt-4">
          <Link href="/about" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
            <Info className="w-4 h-4" />
            About this App
          </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <div className="lg:col-span-3 space-y-6">
          <GameInfoPanel
            gameState={gameState}
            gameMode={gameMode}
            onGameModeChange={setGameMode}
            currentPlayer={currentPlayer}
            score={score}
            onStartPlayerVsAi={startPlayerVsAiGame}
            onStartAiVsAi={startAiVsAiGame}
            userPlayer={userPlayer}
            aiIsThinking={aiIsThinking}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            ai1Difficulty={ai1Difficulty}
            onAi1DifficultyChange={setAi1Difficulty}
            ai2Difficulty={ai2Difficulty}
            onAi2DifficultyChange={setAi2Difficulty}
            onReviewGame={handleReviewGame}
            onResetGame={resetGame}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                AI Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AiPanel
                onSuggestMove={handleSuggestMove}
                suggestion={displayedSuggestion}
                suggestionLoading={suggestionLoading}
                onVisualize={handleVisualize}
                visualization={visualization}
                visualizationLoading={visualizationLoading}
                onNewTraining={runNewTrainingSession}
                isPlayerTurn={gameMode === 'playerVsAi' && currentPlayer === userPlayer && gameState === 'playing'}
                gameMode={gameMode}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <OthelloBoard
            board={board}
            onCellClick={handleCellClick}
            validMoves={currentPlayer === userPlayer ? validMoves : []}
            player={userPlayer}
            suggestedMove={suggestion?.move ?? null}
            lastMove={lastMove}
            flippingPieces={flippingPieces}
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <ListCollapse className="w-5 h-5 text-primary" />
                Move History
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleUndo()} disabled={!canUndo}>
                  <Undo className="mr-2 h-4 w-4" /> Undo
                </Button>
                <Popover open={showAdvancedUndo} onOpenChange={setShowAdvancedUndo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!canAdvancedUndo}>
                      <Settings className="mr-2 h-4 w-4" /> Advanced
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Advanced Undo Options</h4>
                        <p className="text-sm text-muted-foreground">Available moves to undo: {availableMoves}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="undo-count">Number of moves to undo:</Label>
                        <Input
                          id="undo-count"
                          type="number"
                          min="1"
                          max={availableMoves}
                          value={undoMoveCount}
                          onChange={(e) => setUndoMoveCount(Math.max(1, Math.min(availableMoves, parseInt(e.target.value) || 1)))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleAdvancedUndo(undoMoveCount);
                            setShowAdvancedUndo(false);
                          }}
                          className="flex-1"
                        >
                          Undo {undoMoveCount} {undoMoveCount === 1 ? 'Move' : 'Moves'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleUndoAll();
                            setShowAdvancedUndo(false);
                          }}
                          className="flex-1"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Undo All
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-xs text-muted-foreground">
                Total moves: {availableMoves} | Current player: {currentPlayer}
              </div>
              <ScrollArea className="h-48 w-full">
                <div className="space-y-2 font-code text-sm">
                  {history.slice(1).map((entry, index) => (
                    <div key={index} className="flex gap-4 p-1 rounded-md bg-muted/50 items-center">
                      <span className="font-bold w-6 text-right">{index + 1}.</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${entry.player === 'black' ? 'bg-black' : 'bg-white border'}`} />
                        <span className="capitalize w-14">{entry.player}</span>
                      </div>
                      <span>{entry.move ? `${rowLabels[entry.move.row]}${entry.move.col + 1}` : 'N/A'}</span>
                    </div>
                  ))}
                  {history.length <= 1 && (
                    <p className="text-muted-foreground text-center p-4">No moves yet.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Neural Architecture & ONNX Deployment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <h4 className="font-semibold text-primary flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  David et al. (AlphaZero) Architecture
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Based on the neural network design established by David et al. (DeepMind AlphaZero). It features an 8-residual-block Convolutional Neural Network (ResNet-8) with dual prediction heads: a <strong>Policy Head</strong> (64 logit outputs for move selection) and a <strong>Value Head</strong> (board evaluation).
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <h4 className="font-semibold text-primary flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Client-Side ONNX Web Execution
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  PyTorch model weights are stored in ONNX format (<code className="text-primary font-mono text-[11px]">othello_model_final.onnx</code>) and downloaded directly into your browser via <code className="text-primary font-mono text-[11px]">onnxruntime-web</code>. Inferences run 100% client-side with WebAssembly, requiring zero backend server cost.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-primary" />
              Post-Game Analysis
            </DialogTitle>
            <DialogDescription>
              Here's the AI coach's review of your last game.
            </DialogDescription>
          </DialogHeader>
          {analysisLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">The AI is analyzing your game...</p>
            </div>
          )}
          {gameAnalysis && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-primary">Overall Feedback</h3>
                  <p className="text-muted-foreground">{gameAnalysis.overallFeedback}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-primary">Opening Summary</h3>
                  <p className="text-muted-foreground">{gameAnalysis.openingSummary}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-primary">Mid-Game Turning Point</h3>
                  <p className="text-muted-foreground">{gameAnalysis.midGameTurningPoint}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-primary">End-Game Recap</h3>
                  <p className="text-muted-foreground">{gameAnalysis.endGameRecap}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
