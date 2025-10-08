# Builders Lab by Programmify - Frontend

A modern React application for discovering and exploring AI tools, frameworks, and resources for developers.

## 🚀 Features

- **Tool Discovery**: Browse and search through curated AI tools and resources
- **Category Filtering**: Filter tools by categories like AI & LLM APIs, Frontend Frameworks, Backend Tools, etc.
- **Smart Search**: Search by tool name, description, or tags
- **Interactive Chat**: AI-powered chat interface to help users find the right tools
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Lucide React** for icons
- **Supabase** for backend services

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd builder-lab/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at `http://localhost:8080`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── CategoryFilter.tsx
│   ├── ChatInterface.tsx
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   └── ToolCard.tsx
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── main.tsx            # Application entry point
```

### Key Components

- **CategoryFilter**: Handles category selection with icons and custom styling
- **ToolCard**: Displays individual tools with visit, tutorial, and example links
- **SearchBar**: Provides search functionality across tools
- **ChatInterface**: AI-powered chat for tool recommendations

## 🌐 Environment Variables

Create a `.env` file in the frontend directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For AI chat functionality
VITE_OPENAI_API_KEY=your_openai_api_key
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the frontend directory
3. Follow the prompts to configure your deployment

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to Netlify
3. Configure redirects for SPA routing if needed

## 🎨 Customization

### Styling

The application uses Tailwind CSS with custom design tokens. Key customization points:

- **Colors**: Defined in `tailwind.config.ts`
- **Components**: shadcn/ui components in `src/components/ui/`
- **Animations**: Framer Motion configurations

### Adding New Categories

1. Update the `Category` type in `src/types/tool.ts`
2. Add the category icon in `src/components/CategoryFilter.tsx`
3. Update the data files in the `../data/` directory

### Adding New Tools

Tools are defined in JSON files in the `../data/` directory. Each tool should have:

```json
{
  "name": "Tool Name",
  "description": "Tool description",
  "link": "https://tool-website.com",
  "type": "Free|Paid|Freemium",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "popularity": "Popularity indicator",
  "tutorial": "https://tutorial-link.com"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Backend by [Supabase](https://supabase.com/)