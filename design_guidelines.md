# Short Video Social Platform - Design Guidelines

## Brand Identity

**Purpose**: A legitimate content creator platform where users earn real money from video ads and withdraw via USDC. Trustworthy, transparent, professional.

**Aesthetic Direction**: Bold & Professional - High contrast dark mode design with sharp accents. Strike a balance between TikTok's engaging energy and fintech's trustworthiness. The memorable element is TRANSPARENCY - real numbers, clear earnings breakdowns, no fake metrics.

**Differentiation**: Crystal-clear earnings visibility. Every screen shows real data. Users instantly trust the platform because everything is measurable and withdrawable.

---

## Navigation Architecture

**Root Navigation**: 5-Tab Bottom Navigation
- **Home** (Feed icon): Infinite video feed
- **Discover** (Search icon): Trending videos, search
- **Upload** (Plus icon, center, elevated): Video creation
- **Activity** (Bell icon): Notifications, earnings alerts
- **Profile** (User icon): Creator dashboard, settings, wallet

---

## Screen Specifications

### 1. Authentication Screens
- **Login/Signup Stack**: Email/password forms with terms/privacy links
- Layout: Centered vertical stack, logo at top, form fields, submit button below form
- Include "Forgot Password" link under login form

### 2. Home Feed (Tab 1)
- **Purpose**: Infinite scrolling vertical video feed with ads between content
- **Layout**:
  - Full-screen video player (no header)
  - Floating right sidebar: Like count + button, comment count + button, share button, creator avatar (tappable)
  - Bottom overlay: Creator name, video caption (expandable), sound info
  - Top safe area: insets.top + Spacing.xl
  - Bottom safe area: tabBarHeight + Spacing.xl
- **Components**: Video player, engagement buttons, ad indicator badge
- Empty state (if no content): empty-feed.png illustration

### 3. Discover (Tab 2)
- **Purpose**: Search videos, browse trending hashtags, categories
- **Layout**:
  - Header: Search bar, transparent background
  - Scrollable grid of video thumbnails (3 columns)
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- Empty state: empty-search.png illustration

### 4. Upload (Tab 3 - Modal)
- **Purpose**: Record/upload video, add caption, publish
- **Layout**: Native modal, full-screen camera/gallery picker
- Form for title, caption, hashtags with submit/cancel in header
- Top inset: headerHeight + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl

### 5. Activity (Tab 4)
- **Purpose**: Notifications for likes, comments, earnings milestones
- **Layout**:
  - Header: "Activity" title, mark all read button (right)
  - Scrollable list of notification cards
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- Empty state: empty-notifications.png illustration

### 6. Profile (Tab 5)
- **Purpose**: Creator dashboard, earnings, video grid, settings
- **Layout**:
  - Header: Settings button (right), transparent
  - Scrollable content:
    - Profile info: Avatar, name, follower count
    - Earnings card: Total earnings (prominent), views, ad impressions
    - "Withdraw" button (primary CTA)
    - Grid of user's videos
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- Empty state: empty-videos.png illustration (for user's video grid)

### 7. Earnings Dashboard (Stack from Profile)
- **Purpose**: Detailed revenue breakdown, transaction history
- **Layout**:
  - Default header with back button
  - Scrollable form/list:
    - Total balance (large, bold)
    - Revenue breakdown cards (views, CPM, ad impressions)
    - Transaction history list
    - "Request Withdrawal" button (floating or below list)
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl

### 8. Withdrawal Screen (Stack from Earnings)
- **Purpose**: Connect Binance wallet, request USDC payout
- **Layout**:
  - Default header with back button
  - Scrollable form:
    - Wallet address input field
    - Amount input (with minimum threshold warning)
    - Network selection (BEP20/ERC20)
    - Submit button below form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl

### 9. Video Detail/Comments (Modal)
- **Purpose**: View comments, reply, moderate
- **Layout**: Sheet modal from bottom
- Scrollable list of comments with reply threads
- Text input at bottom for new comments

### 10. Admin Panel (Web-based or separate stack)
- Not part of mobile prototype, mentioned for completeness

---

## Color Palette

**Dark Mode Optimized** (all colors must work on dark backgrounds):
- **Primary**: `#00D9FF` (Cyan - trustworthy, tech, stands out on dark)
- **Primary Variant**: `#0099CC` (Darker cyan for pressed states)
- **Accent**: `#FF3B5C` (Vibrant red for likes, attention)
- **Background**: `#0A0A0A` (Near-black)
- **Surface**: `#1C1C1E` (Dark gray cards)
- **Surface Elevated**: `#2C2C2E` (Lighter for modals/overlays)
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#A0A0A0`
- **Success**: `#00D084` (Earnings, withdrawal success)
- **Warning**: `#FFB800` (Minimum threshold warnings)
- **Error**: `#FF453A`

---

## Typography

**Font**: System font (SF Pro for iOS, Roboto for Android) - ensures readability at high speed scrolling
- **Heading 1**: Bold, 28pt (Dashboard headers, earnings totals)
- **Heading 2**: Bold, 22pt (Section titles)
- **Body**: Regular, 16pt (Captions, descriptions)
- **Caption**: Regular, 14pt (Metadata, counts)
- **Small**: Regular, 12pt (Timestamps, hints)

---

## Visual Design

- All touchable elements have opacity feedback (0.7 on press)
- Floating action button (Upload tab): Shadow with shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Use Feather icons from @expo/vector-icons (no emojis)
- Video thumbnails have 2:1 aspect ratio (vertical)
- Earnings numbers use monospace variant for stability

---

## Assets to Generate

1. **icon.png** - App icon with cyan/black gradient play button - Home screen
2. **splash-icon.png** - Same as icon - Launch screen
3. **empty-feed.png** - Illustration of video reel with "No videos yet" - Home feed empty state
4. **empty-search.png** - Magnifying glass with sparkles - Discover empty state
5. **empty-notifications.png** - Bell with checkmark - Activity empty state
6. **empty-videos.png** - Video camera with upload arrow - Profile video grid empty state
7. **avatar-default.png** - Default user avatar (cyan gradient circle) - Profile placeholders
8. **earnings-success.png** - Coin stack with checkmark - Withdrawal confirmation screen

All illustrations: Minimal line art style, cyan accent color, dark backgrounds.