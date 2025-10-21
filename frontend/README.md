# Profit Share Calculator - Frontend

Next.js frontend for the Profit Share Calculator application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── app/                 # Next.js app router pages
├── components/
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── lib/
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
└── public/             # Static assets
```
