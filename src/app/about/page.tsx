'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BrainCircuit, Code, Users, ExternalLink, BookOpen, BarChart, HelpCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 font-body">
      <header className="mb-8">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Link>
        </Button>
      </header>
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline tracking-tighter text-primary">
            About OthelloAI Dojo
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            How a simple game-playing AI comes to life.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BrainCircuit className="w-6 h-6 text-primary" />
              AI Neural Architecture & Deep Reinforcement Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The trained AI opponent in this application is based on the seminal deep reinforcement learning architecture proposed by <strong>David et al. (DeepMind AlphaZero)</strong>. It consists of an 8-residual block Convolutional Neural Network (ResNet-8 CNN V3) with dual evaluation heads:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Policy Head:</strong> Outputs logit probabilities across all 64 board cells to select high-reward moves.</li>
              <li><strong>Value Head:</strong> Evaluates position strength and estimates win probabilities from any given board state.</li>
            </ul>
            <p>
              Model weights are stored in ONNX format (<code>othello_model_final.onnx</code>) and executed client-side via <code>onnxruntime-web</code> directly in your browser using WebAssembly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="w-6 h-6 text-primary" />
              Guides & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-muted-foreground">
            <Button asChild variant="outline">
                <Link href="/how-to-use" className="flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 mr-2" /> How to Use This App
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Code className="w-6 h-6 text-primary" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              This entire application was built with the help of an AI coding assistant. It's a demonstration of how AI can accelerate and enhance the development process. The following technologies were used:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Framework:</strong> Next.js (React)</li>
              <li><strong>Styling:</strong> Tailwind CSS and ShadCN UI for pre-built, accessible components.</li>
              <li><strong>Generative AI:</strong> Google's Gemini models accessed via Genkit.</li>
              <li><strong>Language:</strong> TypeScript</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ExternalLink className="w-6 h-6 text-primary" />
              Resources & Further Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              <a href="https://en.wikipedia.org/wiki/Reversi" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Othello (Reversi) on Wikipedia
              </a>
              <a href="https://en.wikipedia.org/wiki/Minimax" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Minimax Algorithm on Wikipedia
              </a>
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Next.js Official Website
              </a>
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Tailwind CSS Official Website
              </a>
               <a href="https://ai.google/gemini" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Google Gemini
              </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-primary" />
              Acknowledgements
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              This project was inspired by the classic board game Othello (also known as Reversi) and the fascinating field of game-playing AI, pioneered by visionaries like Claude Shannon and John von Neumann.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
