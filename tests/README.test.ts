import fs from 'fs';
import path from 'path';

describe('README.md Validation Tests', () => {
  let readmeContent: string;
  let readmePath: string;
  
  beforeAll(() => {
    readmePath = path.join(process.cwd(), 'README.md');
    if (fs.existsSync(readmePath)) {
      readmeContent = fs.readFileSync(readmePath, 'utf-8');
    }
  });

  describe('File Existence and Basic Structure', () => {
    test('README.md file exists in root directory', () => {
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('README.md is not empty', () => {
      expect(readmeContent).toBeDefined();
      expect(readmeContent.trim().length).toBeGreaterThan(0);
    });

    test('README.md has valid UTF-8 encoding', () => {
      expect(() => {
        Buffer.from(readmeContent, 'utf-8').toString('utf-8');
      }).not.toThrow();
    });

    test('README.md has reasonable content length', () => {
      expect(readmeContent.length).toBeGreaterThan(1000);
      expect(readmeContent.length).toBeLessThan(50000); // Reasonable upper bound
    });
  });

  describe('Essential Sections Presence', () => {
    test('contains main project title', () => {
      expect(readmeContent).toMatch(/^#\s+OthelloAI Dojo/m);
    });

    test('contains Features section', () => {
      expect(readmeContent).toMatch(/^##\s+Features/m);
    });

    test('contains Technology Stack section', () => {
      expect(readmeContent).toMatch(/^##\s+Technology Stack/m);
    });

    test('contains How It Works section', () => {
      expect(readmeContent).toMatch(/^##\s+How It Works/m);
    });

    test('contains Getting Started section', () => {
      expect(readmeContent).toMatch(/^##\s+Getting Started/m);
    });

    test('contains Contributing & Bug Reports section', () => {
      expect(readmeContent).toMatch(/^##\s+Contributing.*Bug Reports/m);
    });

    test('contains Contact section', () => {
      expect(readmeContent).toMatch(/^##\s+Contact/m);
    });
  });

  describe('Content Quality and Organization', () => {
    test('has proper markdown heading hierarchy', () => {
      const headings = readmeContent.match(/^#+\s+.+$/gm) || [];
      const h1Count = headings.filter(h => h.startsWith('# ')).length;
      const h2Count = headings.filter(h => h.startsWith('## ')).length;
      const h3Count = headings.filter(h => h.startsWith('### ')).length;
      
      expect(h1Count).toBe(1); // Exactly one main title
      expect(h2Count).toBeGreaterThanOrEqual(6); // Multiple main sections
      expect(h3Count).toBeGreaterThan(0); // Should have subsections
    });

    test('contains comprehensive project description', () => {
      expect(readmeContent).toContain('Othello');
      expect(readmeContent).toContain('Reversi');
      expect(readmeContent).toContain('AI');
      expect(readmeContent).toContain('Next.js');
      expect(readmeContent).toContain('interactive');
      expect(readmeContent).toContain('web application');
    });

    test('mentions IEEE Information Theory Society maintainer', () => {
      expect(readmeContent).toContain('IEEE Information Theory Society');
      expect(readmeContent).toContain('VIT Vellore Chapter');
    });

    test('describes key application features', () => {
      const features = [
        'Interactive Othello Board',
        'AI Opponent',
        'Valid Move Highlighting',
        'AI Move Suggestion',
        'AI Decision Visualization',
        'Simulated Training Progress',
        'Detailed Guides',
        'Responsive Design'
      ];
      
      features.forEach(feature => {
        expect(readmeContent).toContain(feature);
      });
    });
  });

  describe('Technical Stack Documentation', () => {
    test('documents all major technologies', () => {
      const technologies = [
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'ShadCN UI',
        'Google Gemini',
        'Genkit',
        'Lucide React'
      ];
      
      technologies.forEach(tech => {
        expect(readmeContent).toContain(tech);
      });
    });

    test('includes technology links', () => {
      const techLinks = [
        'https://nextjs.org/',
        'https://www.typescriptlang.org/',
        'https://tailwindcss.com/',
        'https://ui.shadcn.com/'
      ];
      
      techLinks.forEach(link => {
        expect(readmeContent).toContain(link);
      });
    });

    test('mentions React state management approach', () => {
      expect(readmeContent).toContain('React Hooks');
      expect(readmeContent).toContain('useState');
      expect(readmeContent).toContain('useEffect');
      expect(readmeContent).toContain('useCallback');
    });
  });

  describe('Implementation Details Documentation', () => {
    test('explains core game logic implementation', () => {
      expect(readmeContent).toContain('src/lib/othello.ts');
      expect(readmeContent).toContain('initial board state');
      expect(readmeContent).toContain('valid moves');
      expect(readmeContent).toContain('flipping');
      expect(readmeContent).toContain('score');
    });

    test('describes AI opponent implementation', () => {
      expect(readmeContent).toContain('src/lib/minimax.ts');
      expect(readmeContent).toContain('Minimax algorithm');
      expect(readmeContent).toContain('Alpha-Beta Pruning');
      expect(readmeContent).toContain('difficulty setting');
      expect(readmeContent).toContain('depth');
    });

    test('documents generative AI features', () => {
      expect(readmeContent).toContain('src/ai/flows/');
      expect(readmeContent).toContain('suggest-good-moves.ts');
      expect(readmeContent).toContain('real-time-decision-visualization.ts');
      expect(readmeContent).toContain('Genkit');
      expect(readmeContent).toContain('Gemini');
    });

    test('lists key UI components', () => {
      const components = [
        'othello-board.tsx',
        'game-info-panel.tsx',
        'ai-panel.tsx',
        'win-rate-chart.tsx'
      ];
      
      components.forEach(component => {
        expect(readmeContent).toContain(component);
      });
    });
  });

  describe('Setup and Installation Instructions', () => {
    test('provides clear setup steps', () => {
      expect(readmeContent).toContain('Clone the Repository');
      expect(readmeContent).toContain('Install Dependencies');
      expect(readmeContent).toContain('Set Up Environment Variables');
      expect(readmeContent).toContain('Run the Development Server');
    });

    test('includes correct npm commands', () => {
      expect(readmeContent).toContain('npm install');
      expect(readmeContent).toContain('npm run dev');
    });

    test('specifies correct development server URL', () => {
      expect(readmeContent).toContain('http://localhost:9002');
    });

    test('explains environment variable setup', () => {
      expect(readmeContent).toContain('.env');
      expect(readmeContent).toContain('GEMINI_API_KEY');
      expect(readmeContent).toContain('Google AI Studio');
    });

    test('includes git clone placeholder', () => {
      expect(readmeContent).toContain('git clone [repository-url]');
      expect(readmeContent).toContain('cd othello-ai-dojo');
    });
  });

  describe('Code Block Formatting', () => {
    test('contains properly formatted bash code blocks', () => {
      const bashBlocks = readmeContent.match(/```bash[\s\S]*?```/g) || [];
      expect(bashBlocks.length).toBeGreaterThan(0);
      
      bashBlocks.forEach(block => {
        expect(block).toMatch(/```bash\s*\n[\s\S]*?\n\s*```/);
      });
    });

    test('bash commands use valid syntax', () => {
      const bashBlocks = readmeContent.match(/```bash\s*\n([\s\S]*?)```/g) || [];
      
      bashBlocks.forEach(block => {
        const commands = block.replace(/```bash\s*\n/, '').replace(/```.*$/, '');
        expect(commands).not.toContain('undefined');
        expect(commands).not.toContain('null');
        
        // Should contain recognizable bash commands
        if (commands.trim().length > 0) {
          const hasValidCommands = /git clone|npm install|npm run|cd |mkdir/.test(commands);
          expect(hasValidCommands).toBe(true);
        }
      });
    });

    test('contains environment variable example', () => {
      expect(readmeContent).toMatch(/GEMINI_API_KEY=YOUR_API_KEY_HERE/);
    });
  });

  describe('Links and External References', () => {
    test('contains well-formed markdown links', () => {
      const markdownLinks = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      expect(markdownLinks.length).toBeGreaterThan(0);
      
      markdownLinks.forEach(link => {
        const linkMatch = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, text, url] = linkMatch;
          expect(text.trim().length).toBeGreaterThan(0);
          expect(url.trim().length).toBeGreaterThan(0);
          expect(url).not.toContain(' '); // URLs shouldn't have spaces
        }
      });
    });

    test('includes contact information', () => {
      expect(readmeContent).toContain('developer@example.com');
    });

    test('references external documentation correctly', () => {
      expect(readmeContent).toContain('makersuite.google.com/app/apikey');
    });
  });

  describe('Game-Specific Documentation', () => {
    test('explains Othello game mechanics', () => {
      expect(readmeContent).toContain('8x8');
      expect(readmeContent).toContain('pieces');
      expect(readmeContent).toContain('flipping');
      expect(readmeContent).toContain('opponent');
    });

    test('describes difficulty levels', () => {
      expect(readmeContent).toContain('Easy');
      expect(readmeContent).toContain('Medium');
      expect(readmeContent).toContain('Hard');
    });

    test('explains AI features in detail', () => {
      expect(readmeContent).toContain('move suggestion');
      expect(readmeContent).toContains('strategic rationale');
      expect(readmeContent).toContain('decision-making process');
      expect(readmeContent).toContain('win-rate chart');
    });
  });

  describe('Markdown Formatting Validation', () => {
    test('uses consistent bullet point formatting', () => {
      const bulletPoints = readmeContent.match(/^[\s]*[-*+]\s+/gm) || [];
      expect(bulletPoints.length).toBeGreaterThan(0);
    });

    test('has proper section spacing', () => {
      const sections = readmeContent.split(/^##\s+/m);
      expect(sections.length).toBeGreaterThan(5);
      
      // Each section should have substantial content
      sections.slice(1).forEach(section => {
        expect(section.trim().length).toBeGreaterThan(50);
      });
    });

    test('inline code formatting is consistent', () => {
      const inlineCode = readmeContent.match(/`[^`\n]+`/g) || [];
      expect(inlineCode.length).toBeGreaterThan(0);
      
      inlineCode.forEach(code => {
        expect(code).toMatch(/^`[^`\n]+`$/);
        expect(code.length).toBeGreaterThan(2);
      });
    });

    test('no broken markdown syntax', () => {
      // Check for balanced code block markers
      const codeBlockMarkers = (readmeContent.match(/```/g) || []).length;
      expect(codeBlockMarkers % 2).toBe(0);
      
      // Check for reasonable parentheses balance in links
      const openParens = (readmeContent.match(/\(/g) || []).length;
      const closeParens = (readmeContent.match(/\)/g) || []).length;
      expect(Math.abs(openParens - closeParens)).toBeLessThanOrEqual(3);
    });
  });

  describe('Content Completeness and Quality', () => {
    test('provides comprehensive feature coverage', () => {
      const featureKeywords = [
        'interactive',
        'visualization',
        'responsive',
        'modern',
        'intelligent',
        'demonstration'
      ];
      
      featureKeywords.forEach(keyword => {
        expect(readmeContent.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });

    test('includes attribution and development context', () => {
      expect(readmeContent).toContain('AI coding assistant');
      expect(readmeContent).toContain('type-safe technology stack');
    });

    test('covers contribution guidelines', () => {
      expect(readmeContent).toContain('Bug Reports');
      expect(readmeContent).toContain('Feature Requests');
      expect(readmeContent).toContain('Pull Requests');
      expect(readmeContent).toContain('issue');
    });

    test('has adequate technical depth', () => {
      const technicalTerms = [
        'algorithm',
        'framework',
        'components',
        'state management',
        'API',
        'environment'
      ];
      
      technicalTerms.forEach(term => {
        expect(readmeContent.toLowerCase()).toContain(term.toLowerCase());
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles content parsing without errors', () => {
      expect(() => {
        const lines = readmeContent.split('\n');
        lines.forEach((line, index) => {
          expect(typeof line).toBe('string');
          expect(line.length).toBeGreaterThanOrEqual(0);
        });
      }).not.toThrow();
    });

    test('validates heading structure integrity', () => {
      const headingPattern = /^(#{1,6})\s+(.+)$/gm;
      const headings = [...readmeContent.matchAll(headingPattern)];
      
      expect(headings.length).toBeGreaterThan(7);
      
      headings.forEach(([fullMatch, hashes, title]) => {
        expect(hashes.length).toBeGreaterThanOrEqual(1);
        expect(hashes.length).toBeLessThanOrEqual(6);
        expect(title.trim().length).toBeGreaterThan(0);
        expect(title).not.toMatch(/^#+/); // Title shouldn't start with more hashes
      });
    });

    test('verifies consistent markdown list formatting', () => {
      const listItems = readmeContent.match(/^[\s]*[-*+]\s+.+$/gm) || [];
      expect(listItems.length).toBeGreaterThan(10);
      
      listItems.forEach(item => {
        expect(item.trim()).toMatch(/^[-*+]\s+\S/); // Proper list item format
      });
    });
  });

  describe('Project-Specific Validation', () => {
    test('correctly describes the 8x8 Othello board', () => {
      expect(readmeContent).toContain('8x8 Othello');
      expect(readmeContent).toContain('fully functional');
    });

    test('mentions Recharts for charting', () => {
      expect(readmeContent).toContain('Recharts');
      expect(readmeContent).toContain('chart component');
    });

    test('explains the AI training simulation', () => {
      expect(readmeContent).toContain('simulated');
      expect(readmeContent).toContain('training progress');
      expect(readmeContent).toContain('win-rate');
    });

    test('describes structured data from AI flows', () => {
      expect(readmeContent).toContain('structured data');
      expect(readmeContent).toContain('rationale');
      expect(readmeContent).toContain('board state');
    });
  });
});