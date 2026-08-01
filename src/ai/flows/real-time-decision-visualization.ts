'use server';
/**
 * @fileOverview Standard Gemini API integration for visualizing AI move choices in real-time.
 */

import { ai } from '@/ai/gemini';
import { z } from 'zod';
import { Type } from '@google/genai';

const VisualizeAiDecisionInputSchema = z.object({
  boardState: z.string().describe('The current state of the Othello board as a string representation.'),
  possibleMoves: z.array(z.object({
    row: z.number().describe('The row index of the possible move.'),
    col: z.number().describe('The column index of the possible move.'),
    score: z.number().describe('The score associated with the possible move.'),
  })),
});
export type VisualizeAiDecisionInput = z.infer<typeof VisualizeAiDecisionInputSchema>;

export type VisualizeAiDecisionOutput = {
  explanation: string;
};

export async function visualizeAiDecision(input: VisualizeAiDecisionInput): Promise<VisualizeAiDecisionOutput> {
  try {
    const movesList = input.possibleMoves
      .map(m => `Row: ${m.row}, Col: ${m.col}, Score: ${m.score.toFixed(3)}`)
      .join('\n');

    const prompt = `You are an AI move explainer for the game of Othello. Given the current board state and a list of possible moves with their scores, explain which move the AI should choose and why.

Current Board State:
${input.boardState}

Possible Moves and Scores:
${movesList}

Explain the AI's decision-making process in a clear and concise manner. Focus on the move with the highest score and justify why that move is strategically advantageous.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: 'A textual explanation of the AI move choice and rationale.',
            },
          },
          required: ['explanation'],
        },
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);
    return {
      explanation: parsed.explanation || 'Move selected based on optimal evaluation score and positional advantage.',
    };
  } catch (error) {
    console.warn('Gemini API decision visualization fallback:', error);
    const bestMove = input.possibleMoves.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), input.possibleMoves[0]);
    return {
      explanation: bestMove
        ? `The AI selected move at Row ${bestMove.row + 1}, Col ${bestMove.col + 1} with highest evaluation score (${bestMove.score.toFixed(2)}).`
        : 'The AI analyzed board positions and played the optimal available move.',
    };
  }
}
