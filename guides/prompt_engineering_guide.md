# 50 Essential Prompt Engineering Tips for Builders

A practical guide to getting exactly what you want from AI coding assistants.

---

## Design & Styling

### 1. Specify Exact Fonts

**❌ Bad:**
```
Make it look good
```

**✅ Good:**
```
Use Montserrat for headings (font-weight: 700) and Inter for body text (font-weight: 400). Apply font-size: 48px for h1, 24px for h2.
```

### 2. Define Color Themes

**❌ Bad:**
```
Use dark colors
```

**✅ Good:**
```
Use a dark theme with #0f172a background, #1e293b for cards, #3b82f6 for primary buttons, and #f8fafc for text.
```

### 3. Specify Design System

**❌ Bad:**
```
Make it modern
```

**✅ Good:**
```
Follow a glassmorphism design with backdrop-blur-lg, bg-white/10, and subtle shadows. Use 12px border-radius throughout.
```

> To find more design systems, check out [this article](https://www.designsystems.com/)

### 4. Request Specific Layouts

**❌ Bad:**
```
Create a nice layout
```

**✅ Good:**
```
Create a 3-column grid layout: sidebar (250px fixed), main content (flex-1), and right panel (300px). Use gap-6 between sections.
```

### 5. Define Spacing System

**❌ Bad:**
```
Add some spacing
```

**✅ Good:**
```
Use 8px base unit: 8px (xs), 16px (sm), 24px (md), 32px (lg), 48px (xl). Apply consistent padding and margins.
```

---

## Architecture & Structure

### 6. Specify File Structure

**❌ Bad:**
```
Build a todo app
```

**✅ Good:**
```
Create a todo app with this structure: components/TodoList.tsx, components/TodoItem.tsx, lib/api.ts, types/todo.ts
```

### 7. Define Component Hierarchy

**❌ Bad:**
```
Make components
```

**✅ Good:**
```
Create: App → TodoContainer → TodoList → TodoItem. Each component should handle one responsibility.
```

### 8. Request Separation of Concerns

**❌ Bad:**
```
Put everything in one file
```

**✅ Good:**
```
Separate: UI components in /components, business logic in /lib, types in /types, API calls in /services, constants in /config
```

### 9. Specify State Management

**❌ Bad:**
```
Handle the data
```

**✅ Good:**
```
Use React useState for local state, create a custom useAuth hook for authentication, and Context API for theme switching.
```

### 10. Define Data Flow

**❌ Bad:**
```
Connect the parts
```

**✅ Good:**
```
Props flow down: App passes user data → Dashboard → UserProfile. Events bubble up: TodoItem onClick → TodoList onToggle → App
```

---

## Code Quality

### 11. Request TypeScript Types

**❌ Bad:**
```
Write TypeScript
```

**✅ Good:**
```
Define interfaces: User {id: string, name: string, email: string}, Todo {id: string, task: string, completed: boolean, userId: string}
```

### 12. Specify Error Handling

**❌ Bad:**
```
Handle errors
```

**✅ Good:**
```
Wrap API calls in try-catch, show user-friendly error messages with toast notifications, log errors to console in dev mode.
```

### 13. Request Loading States

**❌ Bad:**
```
Show when loading
```

**✅ Good:**
```
Add loading state with useState(false). Show skeleton loaders for list items, spinner for buttons, and disable inputs during API calls.
```

### 14. Define Validation Rules

**❌ Bad:**
```
Validate the form
```

**✅ Good:**
```
Email: regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/, Password: min 8 chars with 1 uppercase, 1 number. Show inline errors below each field.
```

### 15. Specify Code Style

**❌ Bad:**
```
Write clean code
```

**✅ Good:**
```
Use functional components, arrow functions, destructuring, early returns, and avoid nested ternaries. Max 20 lines per function.
```

---

## Functionality

### 16. Define User Interactions

**❌ Bad:**
```
Make it interactive
```

**✅ Good:**
```
Add hover effects: scale-105 on cards, bg-blue-600 on buttons. Click: toggle todo completion. Double-click: edit mode.
```

### 17. Specify Animations

**❌ Bad:**
```
Add animations
```

**✅ Good:**
```
Fade in on mount (transition-opacity duration-300), slide in from left for sidebar (translate-x), bounce effect on button click.
```

### 18. Request Keyboard Shortcuts

**❌ Bad:**
```
Add keyboard support
```

**✅ Good:**
```
Ctrl+K: open search, Enter: submit form, Escape: close modal, Arrow keys: navigate list, Tab: focus next input.
```

### 19. Define Form Behavior

**❌ Bad:**
```
Create a form
```

**✅ Good:**
```
Auto-focus first input, clear form on submit, disable button while submitting, show success message for 3s, reset validation on input change.
```

### 20. Specify Data Operations

**❌ Bad:**
```
Handle CRUD
```

**✅ Good:**
```
Create: POST /api/todos with optimistic update. Read: GET with pagination (?page=1&limit=10). Update: PATCH with only changed fields. Delete: soft delete (is_deleted flag).
```

---

## Technical Details

### 21. Request Performance Optimization

**❌ Bad:**
```
Make it fast
```

**✅ Good:**
```
Use React.memo for TodoItem, useMemo for filtered lists, useCallback for event handlers, lazy load images, debounce search input by 300ms.
```

### 22. Specify API Integration

**❌ Bad:**
```
Connect to backend
```

**✅ Good:**
```
Use axios with baseURL http://localhost:3000/api, add Authorization header with Bearer token, set timeout 5000ms, handle 401 by redirecting to /login.
```

### 23. Define Responsive Breakpoints

**❌ Bad:**
```
Make it responsive
```

**✅ Good:**
```
Mobile (<640px): single column, hidden sidebar. Tablet (640-1024px): 2 columns. Desktop (>1024px): 3 columns with visible sidebar.
```

### 24. Request Accessibility

**❌ Bad:**
```
Make it accessible
```

**✅ Good:**
```
Add aria-label to icon buttons, role="main" for content, tabIndex={0} for focusable divs, alt text for images, semantic HTML (nav, main, section).
```

### 25. Specify Browser Support

**❌ Bad:**
```
Make it work everywhere
```

**✅ Good:**
```
Support Chrome 90+, Firefox 88+, Safari 14+. Use @supports for grid fallbacks. Polyfill Promise.allSettled for older browsers.
```

---

## Libraries & Tools

### 26. Name Specific Libraries

**❌ Bad:**
```
Use a date library
```

**✅ Good:**
```
Use date-fns for date formatting: format(new Date(), 'MMM dd, yyyy'). Import only needed functions to reduce bundle size.
```

### 27. Request Specific Hooks

**❌ Bad:**
```
Manage state
```

**✅ Good:**
```
Create useLocalStorage hook that syncs with localStorage, returns [value, setValue], handles JSON parsing, and updates on storage events.
```

### 28. Define Utility Functions

**❌ Bad:**
```
Add helper functions
```

**✅ Good:**
```
Create utils/classNames.ts for conditional classes, utils/formatters.ts for currency/date formatting, utils/validators.ts for email/phone validation.
```

### 29. Specify Testing Approach

**❌ Bad:**
```
Add tests
```

**✅ Good:**
```
Use Vitest. Test: component rendering, user interactions with fireEvent, async operations with waitFor, edge cases like empty states.
```

### 30. Request Documentation

**❌ Bad:**
```
Add comments
```

**✅ Good:**
```
Add JSDoc comments for functions: @param, @returns, @example. Document complex logic inline. Create README with setup steps.
```

---

## UI/UX Patterns

### 31. Define Empty States

**❌ Bad:**
```
Show when no data
```

**✅ Good:**
```
Display centered message "No todos yet", an illustration (empty-state.svg), and a "Create your first todo" button with onClick handler.
```

### 32. Specify Loading Patterns

**❌ Bad:**
```
Show loading
```

**✅ Good:**
```
Use skeleton loaders matching actual content layout: 3 rows of animated gradient rectangles (h-20, bg-gray-200, animate-pulse).
```

### 33. Request Feedback Messages

**❌ Bad:**
```
Show success message
```

**✅ Good:**
```
Display toast notification at top-right (fixed, top-4, right-4) with green checkmark icon, "Todo created!" message, auto-dismiss after 3s.
```

### 34. Define Modal Behavior

**❌ Bad:**
```
Add a modal
```

**✅ Good:**
```
Modal: center screen, backdrop blur-sm bg-black/50, close on backdrop click, ESC key, X button. Focus trap, prevent body scroll.
```

### 35. Specify Dropdown Patterns

**❌ Bad:**
```
Create a dropdown
```

**✅ Good:**
```
Dropdown: trigger on click, position absolute below button, close on outside click, arrow key navigation, highlight on hover.
```

---

## Security & Privacy

### 36. Define Auth Flow

**❌ Bad:**
```
Add login
```

**✅ Good:**
```
Login: validate input, POST /api/auth/login, store JWT in httpOnly cookie, redirect to /dashboard, handle 401 with "Invalid credentials".
```

### 37. Specify Data Validation

**❌ Bad:**
```
Check the input
```

**✅ Good:**
```
Server-side: validate with Zod schema, sanitize HTML with DOMPurify. Client-side: real-time validation, show errors on blur.
```

### 38. Request Rate Limiting

**❌ Bad:**
```
Prevent spam
```

**✅ Good:**
```
Add rate limiting: max 5 requests per minute per IP. Show "Too many requests, try again in 60s" message. Disable button during cooldown.
```

### 39. Define Permission Checks

**❌ Bad:**
```
Check permissions
```

**✅ Good:**
```
Before DELETE: verify user.id === todo.userId. For admin routes: check user.role === 'admin'. Show 403 error if unauthorized.
```

### 40. Specify Environment Variables

**❌ Bad:**
```
Use API keys
```

**✅ Good:**
```
Store in .env.local: NEXT_PUBLIC_API_URL, DATABASE_URL (secret), API_KEY (secret). Never expose secrets to client. Use for build-time config.
```

---

## Mobile & Touch

### 41. Define Touch Interactions

**❌ Bad:**
```
Make it mobile friendly
```

**✅ Good:**
```
Add touch handlers: swipe left to delete (touchStart, touchMove, touchEnd), pull to refresh (threshold 80px), tap to select (no 300ms delay).
```

### 42. Specify Mobile Navigation

**❌ Bad:**
```
Add mobile menu
```

**✅ Good:**
```
Bottom navigation: 4 tabs with icons, active state with bg-blue-600, fixed bottom-0. Hamburger menu: slide in from left, overlay backdrop.
```

### 43. Request Gesture Support

**❌ Bad:**
```
Handle swipes
```

**✅ Good:**
```
Use react-swipeable: left/right threshold 50px, up/down 30px. Prevent default scrolling during swipe. Show visual feedback during drag.
```

### 44. Define Touch Targets

**❌ Bad:**
```
Make buttons bigger
```

**✅ Good:**
```
Minimum 44x44px touch targets. Buttons: h-12 min-w-12. Icons: p-3 for 48px total. Spacing: min 8px gap between clickable elements.
```

### 45. Specify Mobile Forms

**❌ Bad:**
```
Optimize forms
```

**✅ Good:**
```
Use inputMode="numeric" for numbers, type="email" for email (shows @ key), autocomplete="name", prevent zoom with max font-size 16px.
```

---

## Advanced Techniques

### 46. Request Code Splitting

**❌ Bad:**
```
Optimize bundle
```

**✅ Good:**
```
Use React.lazy for routes: const Dashboard = lazy(() => import('./Dashboard')). Dynamic imports for heavy libs: const Chart = await import('chart.js').
```

### 47. Specify Caching Strategy

**❌ Bad:**
```
Cache API calls
```

**✅ Good:**
```
Use SWR: useSWR('/api/todos', fetcher, {revalidateOnFocus: true, dedupingInterval: 2000}). Cache for 5 min, refresh on window focus.
```

### 48. Define Image Optimization

**❌ Bad:**
```
Add images
```

**✅ Good:**
```
Use Next.js Image: width={800} height={600}, quality={80}, loading="lazy", placeholder="blur", formats=[webp, avif]. Serve from CDN.
```

### 49. Request SEO Optimization

**❌ Bad:**
```
Improve SEO
```

**✅ Good:**
```
Add: title tag (50-60 chars), meta description (150-160 chars), Open Graph tags, canonical URL, JSON-LD schema, semantic HTML.
```

### 50. Specify Analytics

**❌ Bad:**
```
Track users
```

**✅ Good:**
```
Use Plausible: track pageviews, custom events (plausible('signup', {props: {plan: 'pro'}})), exclude /admin, respect DNT header.
```

---

## Pro Tips

### Combine Multiple Tips
```
Create a todo app with:
- Dark theme (#0f172a bg, #3b82f6 primary)
- Montserrat headings, Inter body
- 3-column layout (sidebar, main, panel)
- useState for todos, Context for theme
- Skeleton loaders, toast notifications
- Zod validation, error boundaries
- Mobile: bottom nav, swipe to delete
- TypeScript with proper interfaces
```

### Be Specific About Edge Cases
```
Handle: empty state (show illustration), loading (skeleton), error (retry button), no internet (cached data), rate limit (countdown timer)
```

### Reference Examples
```
Make it look like Linear's interface: clean, minimal, keyboard-first, subtle animations, monospace font for code.
```

---

## Remember

- **Specificity wins** - The more details, the better the output
- **Show, don't just tell** - Give examples when possible
- **Iterate quickly** - Start with basics, refine in follow-ups
- **Use constraints** - "No external libraries" or "Under 100 lines"
- **Request explanations** - "Explain why you chose this approach"

---

## Quick Reference

**Colors:** Exact hex codes (#3b82f6)  
**Fonts:** Name + weights (Inter 400, 700)  
**Spacing:** Specific units (16px, 2rem)  
**Breakpoints:** Exact pixels (640px, 1024px)  
**Timing:** Milliseconds (300ms, 3s)  
**Sizes:** Width × Height (800×600)  
**Limits:** Numbers (max 20 lines, 5 requests/min)  
**Patterns:** Named systems (glassmorphism, atomic design)