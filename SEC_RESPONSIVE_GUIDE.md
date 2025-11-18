# SEC Responsive Design Guide

## Overview
This guide documents the responsive design implementation for the SEC (Sales Executive Champion) portal. The design follows a mobile-first approach with carefully defined breakpoints to ensure optimal viewing across all devices.

## Breakpoint Strategy

### Device Targets

| Breakpoint | Min Width | Max Width | Target Devices | Description |
|------------|-----------|-----------|----------------|-------------|
| **xs** | 0px | 374px | Small phones | iPhone SE, small Android phones |
| **sm** | 375px | 639px | Standard phones | iPhone 12/13/14, most Android phones |
| **md** | 640px | 767px | Large phones | iPhone Pro Max, large Android phones |
| **lg** | 768px | 1023px | Tablets | iPad, Android tablets |
| **xl** | 1024px | 1279px | Small desktops | Small laptops, desktop monitors |
| **2xl** | 1280px+ | - | Large desktops | Large monitors, high-resolution displays |

### Tailwind CSS Breakpoints Used

```css
sm:  640px   /* Small devices and up */
md:  768px   /* Medium devices and up */
lg:  1024px  /* Large devices and up */
xl:  1280px  /* Extra large devices and up */
2xl: 1536px  /* 2X large devices and up */
```

## Component-Specific Responsive Implementation

### 1. SECHeader Component

**File:** `src/components/sec/SECHeader.jsx`

**Responsive Features:**
- Padding scales from mobile to desktop: `px-4 → px-6 → px-8 → px-12`
- Notification icon size: `w-5 h-5 → w-6 h-6 → w-7 h-7`
- Notification badge size: `w-2.5 h-2.5 → w-3 h-3 → w-3.5 h-3.5`

**Breakpoint Behavior:**
```
Mobile (< 640px):    Small padding, compact icon
Tablet (768px+):     Medium padding, standard icon
Desktop (1024px+):   Large padding, prominent icon
```

### 2. SECFooter Component

**File:** `src/components/sec/SECFooter.jsx`

**Responsive Features:**
- **Hidden on desktop (768px+)** using `md:hidden` class
- Icon sizes: `w-5 h-5 → w-6 h-6 → w-7 h-7`
- Text sizes: `text-[9px] → text-[10px] → text-xs`
- Minimum widths: `min-w-[50px] → min-w-[60px] → min-w-[80px]`

**Breakpoint Behavior:**
```
Mobile (< 768px):    Visible fixed bottom navigation
Tablet/Desktop:      Hidden (replaced by sidebar navigation)
```

### 3. Landing Page

**File:** `src/app/login/sec/LandingPage.jsx`

#### Greeting Section
```jsx
Heading: text-xl → text-2xl → text-3xl → text-4xl
Subtext: text-xs → text-sm → text-base
Padding: px-4 → px-6 → px-8 → px-12
```

#### Banner Carousel
```jsx
Height:  min-h-[160px] → [180px] → [220px] → [260px]
Padding: px-4 py-4 → px-6 py-5 → px-8 py-6 → py-8
Dots:    h-1.5 w-6 → h-2 w-8 → h-2.5 w-10
```

#### Feature Tiles Grid
```jsx
Layout:  2 columns (mobile) → 3 columns (tablet) → 4 columns (desktop)
Gap:     gap-3 → gap-4 → gap-5 → gap-6
Height:  min-h-[140px] → [155px] → [180px] → [200px]
Icons:   w-9 h-9 → w-10 h-10 → w-12 h-12 → w-14 h-14
```

### 4. Profile Page

**File:** `src/app/SEC/profile/page.tsx`

**Responsive Features:**
- Section padding scales with screen size
- Form inputs grow larger on desktop
- Two-column layout on larger screens (if needed)
- Button sizes increase on larger screens

### 5. Leaderboard Page

**File:** `src/app/SEC/leaderboard/page.tsx`

**Responsive Features:**
- Podium cards scale proportionally
- Table becomes horizontally scrollable on mobile
- Text sizes adjust for readability
- Spacing increases on larger screens

## Custom CSS Classes

### Available in `src/styles/sec-responsive.css`

| Class Name | Purpose |
|------------|---------|
| `.sec-header` | Responsive header padding |
| `.sec-footer` | Footer with desktop hide logic |
| `.sec-main-container` | Max-width container for content |
| `.sec-banner` | Banner carousel sizing |
| `.sec-features-grid` | Feature tiles grid layout |
| `.sec-feature-card` | Individual feature card styling |
| `.sec-title-xl` | Responsive title typography |
| `.sec-leaderboard-container` | Leaderboard container padding |
| `.sec-profile-section` | Profile section spacing |
| `.sec-input` | Form input responsive sizing |
| `.sec-button` | Button responsive sizing |
| `.sec-spacing-sm/md/lg` | Utility spacing classes |
| `.sec-hide-mobile` | Hide on mobile, show on desktop |
| `.sec-hide-desktop` | Hide on desktop, show on mobile |
| `.sec-tap-target` | Touch-friendly minimum sizes |

## Testing Checklist

### Mobile Testing (320px - 767px)
- [ ] Header displays correctly with proper padding
- [ ] Footer navigation is visible and accessible
- [ ] Banner carousel is readable and slides work
- [ ] Feature tiles are in 2-column grid
- [ ] All tap targets are at least 44x44px
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling

### Tablet Testing (768px - 1023px)
- [ ] Footer is hidden
- [ ] Content centered with max-width
- [ ] Feature tiles in 3-column grid
- [ ] Banner text is larger and clear
- [ ] Forms and inputs are appropriately sized

### Desktop Testing (1024px+)
- [ ] Content uses full width up to max-width
- [ ] Feature tiles in 4-column grid
- [ ] All elements scale proportionally
- [ ] Typography is large and readable
- [ ] Ample white space around content

## Implementation Guidelines

### 1. Always Use Mobile-First Approach
Start with mobile styles and add responsive classes for larger screens:

```jsx
// ✅ Good
className="text-sm md:text-base lg:text-lg"

// ❌ Bad
className="text-lg md:text-sm"
```

### 2. Use Consistent Spacing Scale
Follow the spacing progression:
```
Mobile: 1rem (16px)
Small:  1.5rem (24px)
Medium: 2rem (32px)
Large:  3rem (48px)
```

### 3. Test on Real Devices
- iPhone SE (375px) - smallest modern phone
- iPhone 13/14 (390px) - standard modern phone
- iPad (768px) - standard tablet
- MacBook (1280px+) - desktop

### 4. Accessibility Considerations
- Maintain minimum touch target size of 44x44px on mobile
- Ensure text contrast ratios meet WCAG AA standards
- Test with screen readers on mobile and desktop
- Ensure keyboard navigation works on desktop

## Future Enhancements

### Desktop Sidebar Navigation
When implementing desktop navigation:
1. Create a fixed left sidebar (240px-280px width)
2. Add `.sec-desktop-nav` class
3. Use `.sec-content-with-nav` for main content margin
4. Hide footer on desktop, show sidebar instead

### Landscape Orientation
Consider adding landscape-specific styles for better mobile landscape experience:
```css
@media (max-height: 500px) and (orientation: landscape) {
  /* Landscape-specific styles */
}
```

### Print Styles
Add print-friendly styles for reports and leaderboards:
```css
@media print {
  .sec-footer { display: none; }
  .sec-header { position: static; }
}
```

## Common Issues and Solutions

### Issue: Text too small on large screens
**Solution:** Use responsive text utilities consistently
```jsx
className="text-xs sm:text-sm md:text-base lg:text-lg"
```

### Issue: Images distorted on different screen sizes
**Solution:** Use object-fit and maintain aspect ratios
```jsx
className="object-cover aspect-video"
```

### Issue: Layout breaks at specific width
**Solution:** Test at exact breakpoint boundaries (639px, 767px, 1023px)

### Issue: Touch targets too small
**Solution:** Apply `.sec-tap-target` class or ensure minimum 44x44px

## Performance Considerations

1. **Image Optimization**
   - Use responsive images with `srcset`
   - Lazy load images below the fold
   - Use modern formats (WebP, AVIF)

2. **CSS Optimization**
   - Use Tailwind's JIT mode for minimal CSS
   - Purge unused styles in production
   - Minimize custom CSS file

3. **JavaScript**
   - Use code splitting for mobile vs desktop
   - Lazy load non-critical components
   - Optimize re-renders in responsive logic

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive Images](https://web.dev/responsive-images/)
- [Material Design Breakpoints](https://material.io/design/layout/responsive-layout-grid.html)

## Support

For questions or issues with the responsive implementation:
1. Check this documentation
2. Review the custom CSS file (`src/styles/sec-responsive.css`)
3. Test on multiple devices and browsers
4. Consult the development team
