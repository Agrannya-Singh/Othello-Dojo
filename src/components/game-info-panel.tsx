'use client';

import type { Player } from '@/types/othello';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, Cpu, Bot, Trophy, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GameInfoPanelProps {
  gameState: 'menu' | 'playing' | 'gameOver';
  gameMode: 'playerVsAi' | 'aiVsAi';
  onGameModeChange: (mode: 'playerVsAi' | 'aiVsAi') => void;
  currentPlayer: Player;
  score: { black: number; white: number };
  onStartPlayerVsAi: (player: Player) => void;
  onStartAiVsAi: () => void;
  onReviewGame: () => void;
  onResetGame: () => void;
  userPlayer: Player | null;
  aiIsThinking: boolean;
  difficulty: number;
  onDifficultyChange: (level: number) => void;
  ai1Difficulty: number;
  onAi1DifficultyChange: (level: number) => void;
  ai2Difficulty: number;
  onAi2DifficultyChange: (level: number) => void;
}

const DifficultySelector = ({id, value, onChange}: {id: string, value: number, onChange: (level: number) => void}) => (
    <Select
        value={String(value)}
        onValueChange={(value) => onChange(Number(value))}
    >
        <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select difficulty" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="1">Easy (Depth 1)</SelectItem>
            <SelectItem value="2">Medium (Depth 2)</SelectItem>
            <SelectItem value="3">Hard (Depth 3)</SelectItem>
            <SelectItem value="4">Expert (Depth 4)</SelectItem>
            <SelectItem value="5">Master (Depth 5)</SelectItem>
            <SelectItem value="6">🧠 Trained Model (ResNet-8 CNN V3)</SelectItem>
        </SelectContent>
    </Select>
)

export default function GameInfoPanel({
  gameState,
  gameMode,
  onGameModeChange,
  currentPlayer,
  score,
  onStartPlayerVsAi,
  onStartAiVsAi,
  onReviewGame,
  onResetGame,
  userPlayer,
  aiIsThinking,
  difficulty,
  onDifficultyChange,
  ai1Difficulty,
  onAi1DifficultyChange,
  ai2Difficulty,
  onAi2DifficultyChange,
}: GameInfoPanelProps) {
    const renderGameState = () => {
        if (gameState === 'gameOver') {
            const winner = score.black > score.white ? 'Black' : score.white > score.black ? 'White' : 'Draw';
            return (
                <div className="text-center">
                    <h3 className="text-xl font-bold text-primary">Game Over</h3>
                    <p className="mb-4">{winner === 'Draw' ? "It's a draw!" : `${winner} wins!`}</p>
                    <Button onClick={onReviewGame} variant="secondary" className="w-full">
                        <Trophy className="mr-2 h-4 w-4" />
                        Review Game with AI
                    </Button>
                </div>
            )
        }
        if (gameState === 'playing') {
            let turnText = "Your Turn";
            if (gameMode === 'aiVsAi') {
                turnText = `AI (${currentPlayer})'s Turn`
            } else if (currentPlayer !== userPlayer) {
                turnText = "AI's Turn";
            }

            return (
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                        {turnText}
                    </h3>
                    <div className={cn(
                        "flex items-center justify-center gap-2 p-2 rounded-md transition-all",
                        currentPlayer === 'black' ? 'bg-black text-white' : 'bg-white text-black'
                    )}>
                        <p className="font-bold text-lg capitalize">{currentPlayer}</p>
                        {aiIsThinking && <Cpu className="animate-spin" />}
                    </div>
                </div>
            );
        }
        return null;
    }

    const renderMenu = () => {
        return (
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Game Mode</Label>
                    <RadioGroup
                        value={gameMode}
                        onValueChange={(value) => onGameModeChange(value as 'playerVsAi' | 'aiVsAi')}
                        className="grid grid-cols-2 gap-2"
                    >
                        <div>
                            <RadioGroupItem value="playerVsAi" id="playerVsAi" className="peer sr-only" />
                            <Label htmlFor="playerVsAi" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <User /> Player vs AI
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="aiVsAi" id="aiVsAi" className="peer sr-only" />
                            <Label htmlFor="aiVsAi" className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <Bot /> AI vs AI
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {gameMode === 'playerVsAi' && (
                    <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                           <Label htmlFor="difficulty">AI Difficulty</Label>
                           <DifficultySelector id="difficulty" value={difficulty} onChange={onDifficultyChange} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-center text-muted-foreground">Start a new game as:</p>
                           <div className="flex gap-2">
                               <Button className="w-full" onClick={() => onStartPlayerVsAi('black')}>Black</Button>
                               <Button className="w-full" variant="secondary" onClick={() => onStartPlayerVsAi('white')}>White</Button>
                           </div>
                        </div>
                   </div>
                )}
                
                {gameMode === 'aiVsAi' && (
                     <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="ai1-difficulty">AI 1 (Black) Difficulty</Label>
                           <DifficultySelector id="ai1-difficulty" value={ai1Difficulty} onChange={onAi1DifficultyChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai2-difficulty">AI 2 (White) Difficulty</Label>
                           <DifficultySelector id="ai2-difficulty" value={ai2Difficulty} onChange={onAi2DifficultyChange} />
                        </div>
                        <Button className="w-full" onClick={onStartAiVsAi}>
                            <Bot className="mr-2" /> Start AI vs AI Game
                        </Button>
                     </div>
                )}
            </div>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Game Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState !== 'menu' && (
             <div className="flex justify-around text-center text-xl font-bold">
             <div>
               <p className="flex items-center gap-2">
                {(gameMode === 'playerVsAi' && userPlayer === 'black') || gameMode === 'aiVsAi' ? <Bot/> : <User />}
                Black</p>
               <p>{score.black}</p>
             </div>
             <div>
               <p className="flex items-center gap-2">
               {(gameMode === 'playerVsAi' && userPlayer === 'white') || gameMode === 'aiVsAi' ? <Bot/> : <User />}
                White</p>
               <p>{score.white}</p>
             </div>
           </div>
        )}
       
        {renderGameState()}

        { (gameState === 'menu' || gameState === 'gameOver') && renderMenu() }
        { gameState === 'playing' && (
            <Button className="w-full" variant="outline" onClick={onResetGame}>
                 <RefreshCw className="mr-2 h-4 w-4" />
                Reset Game
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
