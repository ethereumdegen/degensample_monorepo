# DeFi Relay Frontend Design Specification

## Design Philosophy
The new DeFi Relay interface aims to be modern, professional, and approachable. We want to convey trust and security while remaining visually engaging. The design should emphasize clarity and usability, making complex DeFi operations feel simple and intuitive.

## Color Palette

### Primary Colors
- **Blue 1** `#3b5dc9` - Primary brand color
- **Muted Purple** `#29366f` - Secondary/accent color
- **Steel Blue** `#789aac` - Call-to-action, success states

### Secondary Colors
- **Navy Blue** `#0D1B3E` - Headers, dark backgrounds
- **Cool Gray** `#F5F7FA` - Page backgrounds, containers
- **Slate** `#64748B` - Secondary text, borders

### Semantic Colors
- **Success** `#10B981` - Confirmations, completed transactions
- **Warning** `#F59E0B` - Alerts, pending states
- **Error** `#EF4444` - Error messages, failed transactions
- **Info** `#3B82F6` - Informational messages

## Typography

### Fonts
- **Heading Font**: Inter (Bold, SemiBold)
- **Body Font**: Inter (Regular, Medium)
- **Monospace**: Fira Code (for addresses, code blocks)

### Type Scale
- **Display**: 36px/2.25rem (large headlines)
- **H1**: 30px/1.875rem
- **H2**: 24px/1.5rem
- **H3**: 20px/1.25rem
- **H4**: 18px/1.125rem
- **Body**: 16px/1rem
- **Small**: 14px/0.875rem
- **Tiny**: 12px/0.75rem (addresses, disclaimers)

## Components

### Buttons
- **Primary**: Gradient background from Deep Indigo to Electric Purple, rounded corners (8px), subtle hover effect
- **Secondary**: Outlined with 1.5px border, transparent background
- **Tertiary**: Text only with hover underline
- **Icon Buttons**: Circular with 40px diameter for consistent tap targets

### Cards
- Light drop shadows
- Rounded corners (12px)
- Subtle hover states that elevate the card
- Internal padding of 24px
- Optional accent borders on the left side (4px) for categorization

### Forms
- Floating labels
- 8px rounded corners on inputs
- Clear validation states with inline error messages
- Spacious input fields (min-height 48px)

### Data Visualization
- Use gradients for charts and graphs
- Consistent data representation across the platform
- Loading states should use skeleton loaders with subtle animation

### Tables
- Zebra striping for better readability
- Sticky headers
- Rounded container corners
- Pagination controls with clear current state

## Layout

### Spacing System
- Base unit: 4px
- Common spacing values: 8px, 16px, 24px, 32px, 48px, 64px

### Grid System
- 12-column layout
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Navigation
- Sidebar navigation on desktop
- Bottom navigation on mobile
- Highlight current section
- Use icons paired with labels for better recognition

## Iconography
- Consistent stroke width (1.5px)
- Rounded corners
- Filled variants for active/selected states
- Outlined variants for inactive states

## Animations & Transitions
- Subtle micro-interactions for feedback
- Page transitions with cross-fades
- Loading indicators should be unobtrusive but informative
- Transaction confirmations should have celebratory animations

## Accessibility Guidelines
- Maintain WCAG AA compliance minimum
- Ensure color contrast ratios meet standards
- Focus states should be clearly visible
- Include alternative text for all interactive elements

## Dark Mode
- True black backgrounds (`#000000`) for OLED screens
- Reduce brightness of primary colors
- Increase contrast for text elements
- Maintain consistent branding across both modes

## Implementation Notes
- Utilize Tailwind's configuration to create custom theme
- Create reusable component library for consistent application
- Document component variants in Storybook
- Ensure responsive behavior is thoroughly tested across devices