# NGMC Chat Frontend Documentation

## 1. Introduction

NGMC Chat is a modern web application designed as an official chat assistant for Nallamuthu Gounder Mahalingam College students and faculty. The application provides a secure, authenticated chat interface for college-related queries and support.

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Package Manager**: pnpm

### Key Features
- 🔐 Secure authentication system with access keys
- 💬 Interactive chat interface
- 🎨 Modern dark theme UI
- 📱 Responsive design
- 🏫 College-branded experience
- 💾 Persistent session management

### Demo
- **Production URL**: [To be configured]
- **API Base URL**: `https://ngmchatbot.onrender.com`

## 2. Project Setup

### Prerequisites
- Node.js 18.x or higher
- pnpm (recommended) or npm/yarn
- Modern web browser
- Code editor (VS Code recommended)

### Installation Guide

1. **Clone the repository**
```bash
git clone [repository-url]
cd Frontend
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Environment Variables**
Create a `.env.local` file in the root directory:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://ngmchatbot.onrender.com

# Optional: For production builds
NODE_ENV=production
```

4. **Run Development Server**
```bash
pnpm dev
# or
npm run dev
```

5. **Build for Production**
```bash
pnpm build
pnpm start
```

The application will be available at `http://localhost:3000`

## 3. Project Structure

```
Frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page component
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   └── alert.tsx
│   └── chat-interface.tsx # Main chat component
├── lib/                   # Utilities and configurations
│   └── utils.ts          # Helper functions
├── public/               # Static assets
├── styles/               # Additional stylesheets
├── components.json       # Shadcn/ui configuration
├── next.config.mjs      # Next.js configuration
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 4. Routing & Navigation

### App Router Structure
- **Home Page**: `app/page.tsx` - Main authentication and chat interface
- **Layout**: `app/layout.tsx` - Root layout with fonts and metadata

### Navigation Flow
1. **Unauthenticated**: Shows login form
2. **Authenticated**: Displays chat interface
3. **Loading States**: Handled with loading spinners

### Dynamic Routing
Currently using a single-page application pattern. Future routes can be added:
```
app/
├── page.tsx              # Home route (/)
├── profile/
│   └── page.tsx         # Profile route (/profile)
└── settings/
    └── page.tsx         # Settings route (/settings)
```

## 5. Styling & Theming

### CSS Strategy
- **Primary**: Tailwind CSS utility classes
- **Components**: Shadcn/ui component library
- **Fonts**: Geist Sans (primary), Geist Mono (monospace)
- **Theme**: Dark mode by default

### Design System
```css
/* Primary Colors (from Tailwind) */
background: hsl(var(--background))
foreground: hsl(var(--foreground))
muted: hsl(var(--muted))
border: hsl(var(--border))

/* Component Variants */
.btn-primary: bg-primary text-primary-foreground
.btn-destructive: bg-destructive text-destructive-foreground
```

### Responsive Breakpoints
```css
sm: 640px   # Small devices
md: 768px   # Medium devices  
lg: 1024px  # Large devices
xl: 1280px  # Extra large devices
```

### Global Styles Location
- `app/globals.css` - Global CSS and Tailwind imports
- Dark mode enabled by default via `<html className="dark">`

## 6. Components Guide

### Component Architecture
All components follow TypeScript + React functional component pattern with hooks.

### Core Components

#### Authentication Form (`app/page.tsx`)
```tsx
interface LoginData {
  name: string
  email: string  
  password: string
}

// Features:
// - Form validation
// - Loading states
// - Error handling
// - LocalStorage integration
```

#### Chat Interface (`components/chat-interface.tsx`)
```tsx
interface ChatInterfaceProps {
  onLogout: () => void
}

// Features:
// - Message handling
// - User session display
// - Logout functionality
```

#### UI Components (`components/ui/`)
- **Button**: Multiple variants (default, destructive, outline)
- **Input**: Form input with validation states
- **Card**: Container component with header/content sections
- **Label**: Form labels with proper accessibility
- **Alert**: Success/error message display

### Component Naming Conventions
- PascalCase for component files: `ChatInterface.tsx`
- camelCase for props and variables: `loginData`, `isLoading`
- kebab-case for CSS classes: `min-h-screen`, `bg-background`

### Reusable Patterns
```tsx
// Loading State Pattern
{isLoading && <Loader2 className="animate-spin" />}

// Error Display Pattern  
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// Form Field Pattern
<div className="space-y-2">
  <Label htmlFor="field">Field Name</Label>
  <Input
    id="field"
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    disabled={loading}
  />
</div>
```

## 7. State Management

### Local Component State
Using React's built-in `useState` and `useEffect` hooks:

```tsx
// Authentication state
const [isAuthenticated, setIsAuthenticated] = useState(false)
const [isLoading, setIsLoading] = useState(true)
const [loginData, setLoginData] = useState({
  name: "",
  email: "", 
  password: ""
})

// UI state
const [loginLoading, setLoginLoading] = useState(false)
const [error, setError] = useState("")
```

### Persistent State
Using `localStorage` for session persistence:
```tsx
// Storage keys
'ngmc-auth-key'    // Authentication token
'ngmc-user-name'   // User's full name
'ngmc-user-email'  // User's email
```

### State Management Best Practices
1. **Lift State Up**: Share state between components via props
2. **Single Source of Truth**: Centralize related state
3. **Immutable Updates**: Use functional state updates
4. **Error Boundaries**: Handle component errors gracefully

## 8. API & Data Fetching

### API Configuration
```tsx
const API_BASE_URL = "https://ngmchatbot.onrender.com"
```

### Authentication Flow
```tsx
// Check Authentication
GET /checkAuth
Headers: { 'x-api-key': 'user-password' }
Response: 200 OK (authenticated) | 401/403 (unauthorized)

// Login Process
1. User submits credentials
2. Frontend sends password as API key
3. Backend validates key
4. Frontend stores auth data in localStorage
5. User gains access to chat interface
```

### Data Fetching Patterns
```tsx
// Authentication Check
const checkAuth = async () => {
  const storedPassword = localStorage.getItem("ngmc-auth-key")
  if (storedPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/checkAuth`, {
        headers: { 'x-api-key': storedPassword }
      })
      if (response.ok) {
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      // Clear invalid credentials
    }
  }
}

// Login Request
const handleLogin = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/checkAuth`, {
    headers: { "x-api-key": credentials.password }
  })
  
  if (response.ok) {
    // Store credentials and update state
    localStorage.setItem("ngmc-auth-key", credentials.password)
    setIsAuthenticated(true)
  } else {
    setError("Invalid credentials")
  }
}
```

### Error Handling Strategy
1. **Network Errors**: Catch fetch errors, show user-friendly messages
2. **API Errors**: Handle HTTP status codes appropriately
3. **Validation Errors**: Client-side validation before API calls
4. **Session Expiry**: Automatic logout on auth failure

## 9. Authentication & Authorization

### Authentication Flow
1. **Initial Load**: Check for stored auth key
2. **Login**: Validate credentials via API
3. **Session**: Persist auth state in localStorage
4. **Logout**: Clear stored credentials

### Session Management
```tsx
// Session Check (on app load)
useEffect(() => {
  checkAuth()
}, [])

// Auto-logout on auth failure
if (!response.ok) {
  localStorage.removeItem("ngmc-auth-key")
  localStorage.removeItem("ngmc-user-name") 
  localStorage.removeItem("ngmc-user-email")
  setIsAuthenticated(false)
}
```

### Security Considerations
- Credentials stored in localStorage (client-side)
- API key-based authentication
- No JWT tokens (simplified auth model)
- HTTPS required for production

### Protected Routes Pattern
```tsx
// Route Protection
if (!isAuthenticated) {
  return <LoginForm />
}
return <ChatInterface />
```

## 10. Testing

### Testing Setup (Recommended)
```bash
# Install testing dependencies
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event jest-environment-jsdom
```

### Test Structure
```
__tests__/
├── components/
│   ├── LoginForm.test.tsx
│   └── ChatInterface.test.tsx
├── pages/
│   └── Home.test.tsx
└── utils/
    └── api.test.tsx
```

### Example Test Cases
```tsx
// Login Form Tests
describe('LoginForm', () => {
  test('validates required fields', () => {
    render(<LoginForm />)
    // Test validation logic
  })
  
  test('handles successful login', async () => {
    // Mock API response
    // Test authentication flow
  })
  
  test('displays error messages', () => {
    // Test error handling
  })
})
```

### Running Tests
```bash
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
```

## 11. Performance & Optimization

### Next.js Optimizations
```tsx
// Image Optimization
import Image from 'next/image'
<Image
  src="/logo.png"
  alt="NGMC Logo"
  width={64}
  height={64}
  priority
/>

// Font Optimization (already implemented)
import { GeistSans, GeistMono } from 'geist/font/sans'
className={GeistSans.variable}
```

### Code Splitting
```tsx
// Dynamic imports for large components
const ChatInterface = dynamic(() => import('@/components/chat-interface'), {
  loading: () => <Loader2 className="animate-spin" />
})
```

### Performance Best Practices
1. **Minimize Bundle Size**: Tree-shake unused dependencies
2. **Lazy Loading**: Load components on-demand
3. **Image Optimization**: Use Next.js Image component
4. **Caching**: Implement proper caching headers
5. **Code Splitting**: Split routes and heavy components

### SEO Optimization
```tsx
// Metadata (in layout.tsx)
export const metadata: Metadata = {
  title: "NGMC Chat - Nallamuthu Gounder Mahalingam College",
  description: "Official chat assistant for NGMC students and faculty",
  keywords: "NGMC, chat, college, assistant",
  robots: "index, follow"
}
```

## 12. Deployment Guide

### Build Process
```bash
# Production build
pnpm build

# Test production build locally
pnpm start
```

### Environment Setup
```env
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://ngmchatbot.onrender.com
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Render
1. Connect GitHub repository
2. Set build command: `pnpm build`
3. Set start command: `pnpm start`
4. Configure environment variables

#### Netlify
```bash
# Build settings
Build command: pnpm build
Publish directory: out
```

### Domain Configuration
1. Configure custom domain in deployment platform
2. Update CORS settings in backend API
3. Update any hardcoded URLs

## 13. Contribution Guidelines

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/new-feature`
3. **Commit** changes: `git commit -m "Add new feature"`
4. **Push** branch: `git push origin feature/new-feature`
5. **Create** Pull Request

### Code Style Guidelines
```bash
# ESLint configuration
pnpm add -D eslint @typescript-eslint/eslint-plugin
pnpm add -D prettier eslint-config-prettier

# Format code
pnpm lint:fix
pnpm format
```

### Commit Message Convention
```bash
feat: add new chat feature
fix: resolve authentication bug
docs: update README
style: format code with prettier
refactor: restructure components
test: add login form tests
```

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers

## 14. FAQ & Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -p 3001
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Environment Variables Not Loading
```bash
# Ensure .env.local exists and has correct format
NEXT_PUBLIC_API_BASE_URL=https://ngmchatbot.onrender.com

# Restart development server after changes
```

#### API Connection Issues
```bash
# Check network connectivity
curl https://ngmchatbot.onrender.com/checkAuth

# Verify CORS configuration
# Check browser developer tools for errors
```

### Debugging Tips
1. **Browser DevTools**: Check Network and Console tabs
2. **React DevTools**: Install browser extension
3. **Logging**: Add console.log statements strategically
4. **Error Boundaries**: Implement for better error handling

## 15. Changelog & Roadmap

### Current Version: 1.0.0
- ✅ Authentication system
- ✅ Chat interface integration
- ✅ Responsive design
- ✅ Dark theme
- ✅ Session persistence

### Upcoming Features
- 🔄 **v1.1.0**
  - Light theme toggle
  - User profile management
  - Chat history persistence
  - File upload support

- 🔄 **v1.2.0**
  - Multi-language support
  - Advanced chat features
  - Admin dashboard
  - Analytics integration

- 🔄 **v2.0.0**
  - Real-time messaging
  - Voice chat support
  - Mobile app development
  - Advanced AI features

### Version History
- **v1.0.0** (Current) - Initial release with core features
- **v0.9.0** - Beta release for testing
- **v0.1.0** - Initial development version

---

## Support & Contact

For technical support or questions:
- **Email**: [technical-support@ngmc.org]
- **Documentation**: This README file
- **Issues**: Create GitHub issues for bug reports
- **Contributions**: Follow contribution guidelines above

---

**NGMC Chat Frontend** - Built with ❤️ for Nallamuthu Gounder Mahalingam College