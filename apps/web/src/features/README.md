# Feature-Sliced Design (FSD) Structure

This project uses [Feature-Sliced Design](https://feature-sliced.design/) to organize code by business domain.

## Layers

```
src/
├── app/              # App Router pages & layouts (Next.js)
├── widgets/          # Composite UI blocks composed from features
│   ├── toolbar/      #   Top toolbar
│   └── prompt-bar/   #   Bottom prompt input
├── features/         # Business logic organized by domain
│   ├── canvas/       #   Pan, zoom, drag, frame management
│   ├── design/       #   AI pipeline (plan → layout → images → review → critique)
│   ├── settings/     #   BYOK, model selection, preferences
│   ├── comments/     #   Figma-style comment pins & AI response threads
│   ├── export/       #   Export to Figma, Tailwind CSS, React components
│   └── onboarding/   #   Tutorial, walkthrough, first-run experience
├── shared/           # Code shared across features
│   ├── types/        #   Domain type definitions
│   ├── constants/    #   Application-wide constants
│   └── utils/        #   Pure utility functions
├── components/       # Shared UI components (buttons, inputs, etc.) - TO BE MOVED
├── hooks/            # Shared React hooks - TO BE MOVED
└── lib/              # Third-party integrations & shared utilities
```

## Feature Slice Template

Each feature directory follows this internal structure:

```
features/{feature}/
├── index.ts      # Public API barrel export
├── ui/           # React components specific to this feature
├── hooks/        # Feature-specific React hooks
├── api/          # API route handlers & client functions
└── lib/          # Feature utilities & helpers
```

## Import Rules

- `app/` may import from `widgets/`, `features/`, `shared/`, `components/`, `hooks/`, `lib/`
- `widgets/` may import from `features/`, `shared/`, `components/`
- `features/` may import from `shared/`, `components/`
- `features/` must NOT import from other `features/` (use shared/ for cross-feature code)
- `shared/` must NOT import from any other layer

## Migration Progress

- [ ] Stage 1: File structure created (THIS TASK)
- [ ] Stage 1.2: Move types to src/shared/types/
- [ ] Stage 1.3: Move hooks to feature slices
- [ ] Stage 1.4: Move components to feature slices
- [ ] Stage 1.5: Extract API logic to feature slices
- [ ] Stage 1.6: Clean up old directories and update imports
