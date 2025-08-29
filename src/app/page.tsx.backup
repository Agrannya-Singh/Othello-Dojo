

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Bot, BrainCircuit, Lightbulb, BarChart, Info, Undo, ListCollapse, Users, Trophy } from 'lucide-react';
import type { BoardState, Player, Move } from '@/types/othello';
import { createInitialBoard, getValidMoves, applyMove, getScore, getOpponent, boardToString, getFlipsForMove } from '@/lib/othello';
import OthelloBoard from '@/components/othello-board';
import GameInfoPanel from '@/components/game-info-panel';
import AiPanel from '@/components/ai-panel';
import WinRateChart from '@/components/win-rate-chart';
import { visualizeAiDecision } from '@/ai/flows/real-time-decision-visualization';
import { analyzeGame } from '@/ai/flows/game-analysis';
import type { AnalyzeGameOutput } from '@/ai/flows/game-analysis';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { minimax } from '@/lib/minimax';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const rowLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};


export default function Home() {
  const [board, setBoard] = usePersistentState<BoardState>('othello-board', createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = usePersistentState<Player>('othello-currentPlayer', 'black');
  const [userPlayer, setUserPlayer] = usePersistentState<Player | null>('othello-userPlayer', 'black');
  const [score, setScore] = usePersistentState('othello-score', { black: 2, white: 2 });
  const [gameState, setGameState] = usePersistentState<'menu' | 'playing' | 'gameOver'>('othello-gameState', 'menu');
  const [gameMode, setGameMode] = usePersistentState<'playerVsAi' | 'aiVsAi'>('othello-gameMode', 'playerVsAi');
  const [difficulty, setDifficulty] = usePersistentState('othello-difficulty', 1);
  const [ai1Difficulty, setAi1Difficulty] = usePersistentState('othello-ai1Difficulty', 1);
  const [ai2Difficulty, setAi2Difficulty] = usePersistentState('othello-ai2Difficulty', 1);
  const [history, setHistory] = usePersistentState<{board: BoardState, player: Player, move: Move | null}[]>('othello-history', []);
  
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  
  const [suggestion, setSuggestion] = useState<{ move: Move; rationale: string; } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  
  const [visualization, setVisualization] = useState<{ explanation: string } | null>(null);
  const [visualizationLoading, setVisualizationLoading] = useState(false);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [gameAnalysis, setGameAnalysis] = useState<AnalyzeGameOutput | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  

  const [trainingData, setTrainingData] = useState([
    { games: 10, aiWins: 4, opponentWins: 6 },
    { games: 20, aiWins: 7, opponentWins: 13 },
    { games: 30, aiWins: 15, opponentWins: 15 },
    { games: 40, aiWins: 25, opponentWins: 15 },
    { games: 50, aiWins: 35, opponentWins: 15 },
  ]);

  const { toast } = useToast();
  
  const [flippingPieces, setFlippingPieces] = useState<Move[]>([]);
  
  const playSound = (sound: 'place' | 'flip') => {
    // const audio = new Audio(`/sounds/${sound}.wav`);
    // audio.play().catch(e => console.error("Error playing sound:", e));
  };


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
  }, [toast, setScore, setGameState, setCurrentPlayer]);


  useEffect(() => {
    if (gameState === 'playing') {
      updateGameData(board, currentPlayer);
    }
  }, [board, currentPlayer, gameState, updateGameData]);
  
  const handlePlayerMove = async (move: Move) => {
    const boardBeforeMove = board;
    const playerMakingMove = currentPlayer;
    
    const newBoard = applyMove(board, currentPlayer, move.row, move.col);
    const flipped = getFlipsForMove(board, currentPlayer, move.row, move.col);
    
    setFlippingPieces(flipped.map(p => ({...p})));
    setTimeout(() => setFlippingPieces([]), 500);

    playSound('place');
    if (flipped.length > 0) {
      setTimeout(() => playSound('flip'), 200);
    }

    setHistory(prev => [...prev, {board: boardBeforeMove, player: currentPlayer, move}]);
    setBoard(newBoard);
    setLastMove(move);
    setCurrentPlayer(getOpponent(currentPlayer));
    setSuggestion(null);

  }

  const handleCellClick = (move: Move) => {
    if (gameState !== 'playing' || currentPlayer !== userPlayer || aiIsThinking || gameMode === 'aiVsAi') return;
    
    const isMoveValid = validMoves.some(m => m.row === move.row && m.col === move.col);
    if (!isMoveValid) return;

    handlePlayerMove(move);
  };
  
  const resetGame = () => {
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setGameState('menu');
    setSuggestion(null);
    setVisualization(null);
    setLastMove(null);
    setHistory([{board: initialBoard, player: 'black', move: null}]);
    setGameAnalysis(null);
  }

  const startPlayerVsAiGame = (player: Player) => {
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setGameState('playing');
    setSuggestion(null);
    setVisualization(null);
    setLastMove(null);
    setHistory([{board: initialBoard, player: 'black', move: null}]);
    setGameAnalysis(null);
    setUserPlayer(player);
    setGameMode('playerVsAi');
  };

  const startAiVsAiGame = () => {
    const initialBoard = createInitialBoard();
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setGameState('playing');
    setSuggestion(null);
    setVisualization(null);
    setLastMove(null);
    setHistory([{board: initialBoard, player: 'black', move: null}]);
    setGameAnalysis(null);
    setUserPlayer(null);
    setGameMode('aiVsAi');
  };
  
  const handleSuggestMove = () => {
    if (gameMode === 'aiVsAi' || !userPlayer) return;
    setSuggestionLoading(true);
    setSuggestion(null);

    try {
      const { move } = minimax(board, difficulty, true, currentPlayer);

      if (move) {
        const moveString = `${rowLabels[move.row]}${move.col + 1}`;
        const rationale = `The optimal move is ${moveString}. This move was determined by the game's AI to maximize your score and strategic position based on the current board state.`;
        setSuggestion({ move, rationale });
        toast({
          title: "AI Suggestion",
          description: `The AI suggests moving to ${moveString}.`,
        });
      } else {
         toast({
          title: "No Suggestion Available",
          description: "There are no valid moves to suggest.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting move suggestion:", error);
      toast({
        title: "Error",
        description: "Could not get a move suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleVisualize = async () => {
    setVisualizationLoading(true);
    setVisualization(null);
    try {
      const opponent = gameMode === 'playerVsAi' && userPlayer ? getOpponent(userPlayer) : 'white';
      const possibleMoves = getValidMoves(board, opponent).map(move => {
        const tempBoard = applyMove(board, opponent, move.row, move.col);
        const newScore = getScore(tempBoard);
        return {
          row: move.row,
          col: move.col,
          score: newScore[opponent] - score[opponent]
        }
      });
      
      const response = await visualizeAiDecision({
        boardState: boardToString(board),
        possibleMoves: possibleMoves,
      });
      setVisualization(response);
      toast({
        title: "AI Decision Visualization",
        description: "The AI's thought process has been visualized.",
      });
    } catch (error) {
      console.error("Error visualizing decision:", error);
       toast({
        title: "Error",
        description: "Could not visualize AI decision.",
        variant: "destructive",
      });
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

        const response = await analyzeGame({
            moveHistory: moveHistoryStr,
            winner: winner,
            finalScore: finalScoreStr,
        });

        setGameAnalysis(response);
    } catch (error) {
        console.error("Error analyzing game:", error);
        toast({
            title: "Analysis Failed",
            description: "Could not get game analysis from the AI. Please try again.",
            variant: "destructive",
        });
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
    } else {
      setGameState('menu');
    }
    setTrainingData(prev => prev.map(d => ({
        ...d,
        aiWins: Math.floor(Math.random() * d.games),
        opponentWins: Math.floor(Math.random() * d.games),
    })))
    toast({
      title: "New Training Session",
      description: "AI model has been reset and is learning from scratch.",
    });
  };

  const handleUndo = () => {
    if (history.length < 2 || gameMode === 'aiVsAi') {
      toast({ 
        title: "Cannot Undo", 
        description: "No moves to undo or action not allowed in AI vs AI mode.", 
        variant: "destructive" 
      });
      return;
    }

    const movesToUndo = (userPlayer === currentPlayer) ? 1 : 2;
    
    // Fix: Change <= to < to allow undo when we have exactly enough moves
    if (history.length < movesToUndo) {
      toast({ 
        title: "Cannot Undo", 
        description: "Not enough moves to undo.", 
        variant: "destructive" 
      });
      return;
    }
    
    // If we'd undo back to the beginning, reset to initial state
    if (history.length - movesToUndo <= 0) {
      const initialBoard = createInitialBoard();
      setBoard(initialBoard);
      setCurrentPlayer('black');
      setGameState('playing');
      setSuggestion(null);
      setVisualization(null);
      setLastMove(null);
      setHistory([{board: initialBoard, player: 'black', move: null}]);
      setGameAnalysis(null);
      return;
    }
    
    const newHistory = history.slice(0, -movesToUndo);
    const lastPlayerState = newHistory[newHistory.length - 1];

    if (lastPlayerState) {
      setBoard(lastPlayerState.board);
      setCurrentPlayer(getOpponent(lastPlayerState.player));
      setLastMove(lastPlayerState.move);
      setHistory(newHistory);
      setSuggestion(null);
      setVisualization(null);
      
      toast({ 
        title: "Move Undone", 
        description: `Undid ${movesToUndo} move(s)`, 
        variant: "default" 
      });
    }
  };


  const aiPlayer = useMemo(() => {
    if (gameMode === 'playerVsAi' && userPlayer) {
      return getOpponent(userPlayer)
    }
    return null;
  }, [userPlayer, gameMode]);


  useEffect(() => {
    if (gameState !== 'playing' || aiIsThinking) return;
  
    const handleAiMove = (aiDifficulty: number, aiColor: Player) => {
        setAiIsThinking(true);
        setTimeout(() => {
          const moves = getValidMoves(board, aiColor);
          if (moves.length > 0) {
            const { move: bestMove } = minimax(board, aiDifficulty, true, aiColor);
  
            if(bestMove){
                const flipped = getFlipsForMove(board, aiColor, bestMove.row, bestMove.col);
                setFlippingPieces(flipped.map(p => ({...p})));
                setTimeout(() => setFlippingPieces([]), 500);
                
                playSound('place');
                if (flipped.length > 0) {
                    setTimeout(() => playSound('flip'), 200);
                }

              setHistory(prev => [...prev, {board, player: currentPlayer, move: bestMove}]);
              const newBoard = applyMove(board, aiColor, bestMove.row, bestMove.col);
              setBoard(newBoard);
              setLastMove(bestMove);
              setCurrentPlayer(getOpponent(aiColor));
            }
          }
          setAiIsThinking(false);
        }, 1000);
    }
  
    if (gameMode === 'playerVsAi' && currentPlayer === aiPlayer) {
      handleAiMove(difficulty, aiPlayer);
    } else if (gameMode === 'aiVsAi') {
      const currentAiDifficulty = currentPlayer === 'black' ? ai1Difficulty : ai2Difficulty;
      handleAiMove(currentAiDifficulty, currentPlayer);
    }
  
  }, [gameState, currentPlayer, aiPlayer, aiIsThinking, board, userPlayer, difficulty, gameMode, ai1Difficulty, ai2Difficulty, setBoard, setCurrentPlayer, setHistory, setLastMove, setFlippingPieces]);

  const displayedSuggestion = suggestion && (
    <div className="text-sm p-3 bg-muted rounded-md space-y-1">
      <p><strong className="text-primary">Suggested Move:</strong> {`${rowLabels[suggestion.move.row]}${suggestion.move.col + 1}`}</p>
      <p className="font-code text-muted-foreground">{suggestion.rationale}</p>
    </div>
  );

  const canUndo = gameState === 'playing' && history.length > 1 && !aiIsThinking && gameMode === 'playerVsAi' && currentPlayer === userPlayer;

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
                onSuggestMove={() => handleSuggestMove()}
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
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo}>
                    <Undo className="mr-2 h-4 w-4" /> Undo
                </Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48 w-full">
                    <div className="space-y-2 font-code text-sm">
                        {history.slice(1).map((entry, index) => (
                             <div key={index} className="flex gap-4 p-1 rounded-md bg-muted/50 items-center">
                                <span className="font-bold w-6 text-right">{index + 1}.</span>
                                <div className="flex items-center gap-1">
                                    <div className={
                                        `w-3 h-3 rounded-full ${entry.player === 'black' ? 'bg-black' : 'bg-white'}`
                                    } />
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
                    <BarChart className="w-5 h-5 text-primary" />
                    Win-Rate Progress
                </CardTitle>
            </CardHeader>
            <CardContent>
              <WinRateChart data={trainingData} />
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
