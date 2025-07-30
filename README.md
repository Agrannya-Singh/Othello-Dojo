# OthelloAI Dojo

-**This project is being maintained by  IEEE Information Theory Society . VIT Vellore Chapter.**

Welcome to the OthelloAI Dojo! This is a modern, interactive web application built with Next.js that allows users to play the classic game of Othello (also known as Reversi) against an AI opponent.. Users can not only play the game but also learn from the AI by requesting move suggestions and visualizing its decision-making process.

## Features

- **Interactive Othello Board**: A fully functional 8x8 Othello game board.
- **AI Opponent**: Play against an AI whose difficulty can be adjusted (Easy, Medium, Hard).
- **Valid Move Highlighting**: The UI shows all possible valid moves for the current player.
- **AI Move Suggestion**: Leveraging a generative AI model (Google Gemini), players can ask for a suggested move and receive a strategic rationale.
- **AI Decision Visualization**: Get a natural language explanation of the AI's thought process for its moves.
- **Simulated Training Progress**: A win-rate chart visualizes the AI's (simulated) learning progress over a series of games.
- **Detailed Guides**: Includes separate pages explaining how to use the app, how to interpret the win-rate chart, and a general "About" page.
- **Responsive Design**: A clean, modern, and responsive user interface suitable for all screen sizes.

## Technology Stack

This project was built with the help of caffeine, heavy metal music and grok.It utilizes a modern, type-safe technology stack.

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/),ParselToungue 
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI**: [Google Gemini](https://ai.google/gemini) via [Genkit](https://firebase.google.com/docs/genkit), Google's open-source generative AI framework.
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react), 
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`)

## How It Works

<img width="1452" height="627" alt="image" src="https://github.com/user-attachments/assets/298ef3d4-c3d1-4656-a45e-41bf287c1ddd" />
<img  width="1452" height="627" alt="image" src="https://raw.githubusercontent.com/Agrannya-Singh/Othello-Dojo/refs/heads/master/diagram-export-7-30-2025-5_11_35-PM.png" />


### Core Game Logic (`src/lib/othello.ts`)

The fundamental rules of Othello are implemented in pure TypeScript. This includes functions for:
- Creating the initial board state.
- Identifying all valid moves for a given player.
- Applying a move to the board and flipping the opponent's pieces.
- Calculating the score.

### AI Opponent (`src/lib/minimax.ts`)

The AI that plays against the user is powered by the **Minimax algorithm**, a classic decision-making algorithm used in two-player, zero-sum games.
- **Alpha-Beta Pruning** is implemented to optimize the search tree, allowing the AI to "look ahead" more efficiently.
- The **difficulty setting** in the UI corresponds to the `depth` of the Minimax search. A higher depth means the AI considers more future moves, resulting in more challenging gameplay.

### Generative AI Features (`src/ai/flows/`)

The application uses **Genkit** to integrate with Google's Gemini models for its more advanced AI features. These are defined as "flows" that can be called from the frontend.

- **`suggest-good-moves.ts`**: When a user requests a move suggestion, this flow sends the current board state and player to the Gemini model. The prompt instructs the AI to act as an Othello expert and return a strategically sound move along with its rationale. The flow is configured to return structured data (the move and the rationale string).
- **`real-time-decision-visualization.ts`**: This flow takes the board state and a list of possible moves (with scores) and asks the Gemini model to provide a human-readable explanation of why the best move is strategically advantageous.

### Frontend Components (`src/components/`)

The UI is built with React components, many of which are styled using ShadCN UI. Key components include:
- **`othello-board.tsx`**: Renders the game board, pieces, and highlights for valid/suggested moves.
- **`game-info-panel.tsx`**: Displays the game state, score, and controls for starting a new game and setting difficulty.
- **`ai-panel.tsx`**: Contains the buttons for interacting with the generative AI features (suggestions, visualization).
- **`win-rate-chart.tsx`**: A chart component (using Recharts) that displays the simulated training data.

- sequenceDiagram
    participant User
    participant Board
    participant AI
    participant Minimax

    User->>Board: Make move
    Board->>AI: Request AI move
    AI->>Minimax: Evaluate board (with corner control)
    Minimax-->>AI: Return best move
    AI-->>Board: Apply move
    Board-->>User: Update board state


## Getting Started

To run this project locally, you'll need to have Node.js and npm installed.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Agrannya-Singh/Othello-Dojo
    cd othello-ai-dojo
    ```

2.  **Install Dependencies**:
    Use npm to install all the required packages.
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**:
    Create a new file named `.env` in the root of the project. This file is needed for the generative AI features. If you don't intend to use the AI move suggestion or visualization, you can leave this blank.
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE 
    ```
    You can get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).Please proplery manage your API keys  and do not push them here.

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Contributing & Bug Reports

We welcome contributions and feedback! If you'd like to contribute, report a bug, or request a new feature, please do so via the project's official repository.

- **Bug Reports**: If you find a bug, please open an issue and provide as much detail as possible, including steps to reproduce the issue, your browser/OS, and screenshots if applicable.Our team will take of it 
- **Feature Requests**: Have a great idea for a new feature? Open an issue to describe your proposal. We'd love to hear it.
- **Pull Requests**: Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.PLEASE DO NOT PUSH TO MAIN BRANCH

## Contact

For any questions or inquiries, please reach out to the development team through the project's repository or via email at `singh.agrannya@gmail.com`.
Follow the given template for feature request and/or reporting bugs.

