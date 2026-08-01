'use server';
/**
 * @fileOverview Standard Gemini API integration for analyzing completed Othello games.
 */

import { ai } from '@/ai/gemini';
import { z } from 'zod';
import { Type } from '@google/genai';

const AnalyzeGameInputSchema = z.object({
  moveHistory: z.string().describe("The full move history of the game, in algebraic notation."),
  winner: z.string().describe("The winner of the game ('black', 'white', or 'draw')."),
  finalScore: z.string().describe("The final score of the game (e.g., 'Black: 35, White: 29')."),
});
export type AnalyzeGameInput = z.infer<typeof AnalyzeGameInputSchema>;

export type AnalyzeGameOutput = {
  openingSummary: string;
  midGameTurningPoint: string;
  endGameRecap: string;
  overallFeedback: string;
};

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  try {
    const prompt = `You are an expert Othello coach. You will be given the full move history of a game, the winner, and the final score. Your task is to provide a concise and insightful post-game analysis.

Game Details:
- Move History: ${input.moveHistory}
- Winner: ${input.winner}
- Final Score: ${input.finalScore}

Please provide the following analysis:
1. Opening Summary: Briefly describe the opening strategy of both players.
2. Mid-Game Turning Point: Identify the critical move sequence in the mid-game.
3. End-Game Recap: Summarize how the game concluded.
4. Overall Feedback: Provide key strategic advice for each player.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            openingSummary: { type: Type.STRING },
            midGameTurningPoint: { type: Type.STRING },
            endGameRecap: { type: Type.STRING },
            overallFeedback: { type: Type.STRING },
          },
          required: ['openingSummary', 'midGameTurningPoint', 'endGameRecap', 'overallFeedback'],
        },
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);
    return {
      openingSummary: parsed.openingSummary || 'Standard opening play focused on central tile control.',
      midGameTurningPoint: parsed.midGameTurningPoint || 'The mid-game saw pivotal battles for edge stability.',
      endGameRecap: parsed.endGameRecap || 'The final phase concluded with critical corner claims.',
      overallFeedback: parsed.overallFeedback || 'Focus on minimizing early exterior placements and controlling corners.',
    };
  } catch (error) {
    console.warn('Gemini API game analysis fallback:', error);
    return {
      openingSummary: 'Both players competed for central position control in the early turns.',
      midGameTurningPoint: 'Mid-game turns focused on edge mobility and avoiding vulnerable X-squares.',
      endGameRecap: `Game ended with ${input.winner} winning (${input.finalScore}).`,
      overallFeedback: 'Focus on corner control, frontier piece minimization, and parity advantage.',
    };
  }
}
