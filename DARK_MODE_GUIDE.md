# Dark Mode Customization Guide

This project uses **global CSS variables** for easy dark mode customization. You can change the entire dark theme by modifying just a few variables in one file!

## Where to Change Dark Mode Colors

Open `src/app/globals.css` and find the `.dark` section (around line 143-161).

## Available Color Variables

### Dark Mode Colors (Change These!)

```css
.dark {
  /* Main heading text (h1, h2, card titles, etc) */
  --text-heading: 226 232 240; /* Currently slate-200 */

  /* Body text (paragraphs, descriptions) */
  --text-body: 148 163 184; /* Currently slate-400 */

  /* Card backgrounds (all cards, modals, sheets) */
  --bg-card: 15 23 42; /* Currently slate-900 */

  /* Subtle backgrounds (table headers, section backgrounds) */
  --bg-subtle: 30 41 59; /* Currently slate-800 */

  /* Hover state backgrounds */
  --bg-hover: 51 65 85; /* Currently slate-700 */
}
```

### Light Mode Colors

```css
:root {
  /* Main heading text */
  --text-heading: 15 23 42; /* Currently slate-900 */

  /* Body text */
  --text-body: 71 85 105; /* Currently slate-600 */

  /* Card backgrounds */
  --bg-card: 255 255 255; /* Currently white */

  /* Subtle backgrounds */
  --bg-subtle: 248 250 252; /* Currently slate-50 */

  /* Hover state backgrounds */
  --bg-hover: 241 245 249; /* Currently slate-100 */
}
```

## How to Use These Variables in Your Code

Instead of hardcoding colors like `text-slate-900` or `bg-white`, use the semantic CSS variable classes:

```tsx
// ❌ Don't do this (hardcoded colors):
<h1 className="text-slate-900 dark:text-slate-100">Title</h1>
<div className="bg-white dark:bg-slate-900">Card</div>

// ✅ Do this (using semantic variables):
<h1 className="text-text-heading">Title</h1>
<div className="bg-bg-card">Card</div>
```

### Available Tailwind Classes

- `text-text-heading` - Main heading text color
- `text-text-body` - Body text color
- `bg-bg-card` - Card background color
- `bg-bg-subtle` - Subtle background color (headers, sections)
- `bg-bg-hover` - Hover state background

## Example: Changing to a Blue Dark Theme

Edit `src/app/globals.css` in the `.dark` section:

```css
.dark {
  --text-heading: 219 234 254;  /* blue-100 - bright blue text */
  --text-body: 147 197 253;     /* blue-300 - lighter blue text */
  --bg-card: 30 58 138;         /* blue-900 - dark blue cards */
  --bg-subtle: 30 64 175;       /* blue-800 - medium blue backgrounds */
  --bg-hover: 59 130 246;       /* blue-600 - bright blue on hover */
}
```

## Example: Changing to a Purple Dark Theme

```css
.dark {
  --text-heading: 233 213 255;  /* purple-200 */
  --text-body: 196 181 253;     /* purple-300 */
  --bg-card: 59 7 100;          /* purple-950 */
  --bg-subtle: 88 28 135;       /* purple-900 */
  --bg-hover: 107 33 168;       /* purple-800 */
}
```

## RGB Format Note

The values are in **RGB format without `rgb()`**. For example:
- ✅ Correct: `226 232 240`
- ❌ Wrong: `rgb(226, 232, 240)`
- ❌ Wrong: `#e2e8f0`

To convert a color:
1. Find the RGB values (e.g., from Tailwind docs or color picker)
2. Write them as: `R G B` (space-separated, no commas, no rgb())

## Testing Your Changes

1. Edit the color variables in `src/app/globals.css`
2. Save the file
3. Click the floating theme toggle button (bottom-right corner)
4. Toggle between light and dark to see your changes

## Where These Colors Are Used

These semantic colors are used throughout the project:
- ✅ Dashboard cards and KPI widgets
- ✅ Table backgrounds and headers
- ✅ Modal and sheet backgrounds
- ✅ Sidebar and navigation
- ✅ All heading text
- ✅ Card titles and descriptions

**Important**: Pages that haven't been updated yet may still use hardcoded colors. Gradually update them to use these semantic variables for consistency.

## Need Help?

The current setup uses a slate-based color scheme. All you need to do is:
1. Find your desired colors (use Tailwind color palette or any RGB color)
2. Update the 5 variables in `.dark` section
3. Save and refresh - your entire dark theme changes!
