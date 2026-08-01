/**
 * @file cnn-model.ts
 * @description ONNX Runtime integration for the trained Othello ResNet-8 CNN V3 model.
 * Loads othello_model_final.onnx and performs client-side inference in Next.js.
 */

import * as ort from 'onnxruntime-web';
import type { BoardState, Player, Move } from '@/types/othello';
import { getValidMoves } from '@/lib/othello';

// Set up CDN fallback for WASM binaries to ensure reliable loading in Vercel/Next.js client
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

let sessionPromise: Promise<ort.InferenceSession> | null = null;

export async function getOrLoadCnnSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        // Attempt loading model from relative public path
        const session = await ort.InferenceSession.create('/models/othello_model_final.onnx', {
          executionProviders: ['wasm'],
        });
        return session;
      } catch (err) {
        console.error('Failed to load ONNX model:', err);
        sessionPromise = null;
        throw err;
      }
    })();
  }
  return sessionPromise;
}

/**
 * Preloads the ONNX model weights and WASM binaries in the background when page mounts.
 */
export function preloadCnnModel(): void {
  if (typeof window !== 'undefined') {
    getOrLoadCnnSession().catch(err => {
      console.warn('Background preloading of ONNX model failed:', err);
    });
  }
}

/**
 * Converts Next.js BoardState into [1, 2, 8, 8] Float32Array tensor format expected by OthelloNetV3.
 * Channel 0: 1.0 where cell has current player's piece, 0.0 otherwise.
 * Channel 1: 1.0 where cell has opponent's piece, 0.0 otherwise.
 */
export function boardToTensorData(board: BoardState, player: Player): Float32Array {
  const tensorData = new Float32Array(1 * 2 * 8 * 8);
  const ownChannelOffset = 0;
  const oppChannelOffset = 64;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;
      const cell = board[r][c];
      if (cell === player) {
        tensorData[ownChannelOffset + idx] = 1.0;
      } else if (cell !== 'empty') {
        tensorData[oppChannelOffset + idx] = 1.0;
      }
    }
  }

  return tensorData;
}

/**
 * Runs inference using the ResNet-8 CNN V3 model to select the optimal Othello move.
 * @param board Current 8x8 BoardState
 * @param player Player color ('black' | 'white')
 * @returns Best Move and confidence rationale
 */
export async function getCnnModelMove(
  board: BoardState,
  player: Player
): Promise<{ move: Move | null; valueScore: number; rationale: string }> {
  const validMoves = getValidMoves(board, player);
  if (validMoves.length === 0) {
    return { move: null, valueScore: 0, rationale: 'No legal moves available.' };
  }

  try {
    const session = await getOrLoadCnnSession();
    const tensorData = boardToTensorData(board, player);
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 2, 8, 8]);

    const feeds: Record<string, ort.Tensor> = { board_input: inputTensor };
    const results = await session.run(feeds);

    const policyLogitsTensor = results.policy_logits;
    const valueTensor = results.value;

    const policyLogits = Array.from(policyLogitsTensor.data as Float32Array);
    const valueScore = valueTensor ? (valueTensor.data as Float32Array)[0] : 0;

    let bestMove: Move | null = null;
    let maxLogit = -Infinity;

    for (const move of validMoves) {
      const flatIndex = move.row * 8 + move.col;
      const logit = policyLogits[flatIndex] ?? -Infinity;
      if (logit > maxLogit) {
        maxLogit = logit;
        bestMove = move;
      }
    }

    if (!bestMove) {
      bestMove = validMoves[0];
    }

    const rowLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const moveStr = `${rowLabels[bestMove.row]}${bestMove.col + 1}`;
    const rationale = `Trained ResNet-8 CNN V3 selected ${moveStr} (Policy Logit: ${maxLogit.toFixed(3)}, Win-Probability Estimate: ${((valueScore + 1) / 2 * 100).toFixed(1)}%).`;

    return { move: bestMove, valueScore, rationale };
  } catch (error) {
    console.warn('Falling back from CNN model to legal move due to inference error:', error);
    return {
      move: validMoves[0],
      valueScore: 0,
      rationale: 'Fallback move selected.',
    };
  }
}
