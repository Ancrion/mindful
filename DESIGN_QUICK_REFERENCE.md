# Mindful Design System - Quick Reference Guide

## File Locations

```
frontend/public/css/
├── style.css (2,433 lines)       - Core system & layouts
├── dashboard.css (944 lines)     - Widget system
├── todo.css (1,372 lines)        - Task management
├── notes.css (931 lines)         - Note editor
├── calendar.css (741 lines)      - Calendar views
├── documents.css (609 lines)     - Document browser
├── pomodoro.css (266 lines)      - Timer UI
├── tracking.css (306 lines)      - Time tracking
├── profile.css (340 lines)       - Settings
└── login.css (345 lines)         - Auth pages
```

## Core Design Tokens

### Colors
- **Accent (Primary):** `#f24b3d` (coral red)
- **Success:** `#10B981` (green)
- **Warning:** `#f59e0b` (gold)
- **Danger:** `#EF4444` (red)
- **Info:** `#3B82F6` (blue)

### Sizing
- **Radius SM:** 8px (buttons, inputs)
- **Radius MD:** 12px (cards, modals)
- **Radius LG:** 16px (large containers)
- **Sidebar:** 72px (collapsed) / 220px (expanded)

### Shadows
- **SM:** `0 1px 3px rgba(0,0,0,0.04)`
- **MD:** `0 4px 12px rgba(0,0,0,0.06)`
- **LG:** `0 8px 30px rgba(0,0,0,0.08)`

### Transitions
- Standard: `0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Quick: `0.15s`
- Medium: `0.2s`

## Component Quick Links

### Global Components (style.css)
- **Sidebar:** Lines 128-327
- **Module Navigation:** Lines 210-257
- **User Profile:** Lines 259-325
- **Search Modal:** Lines 715-937
- **Context Menu:** Lines 573-643
- **Toast:** Lines 645-669
- **Workspace Selector:** Lines 938-1155

### Dashboard (dashboard.css)
- **Widget Grid:** Lines 80-102
- **Widget Card:** Lines 88-247
- **Stats Widget:** Lines 250-284

### Todo (todo.css)
- **Sidebar:** Lines 4-389
- **Task List:** Lines 546-711
- **Task Item:** Lines 554-710
- **Detail Panel:** Lines 963-1143
- **Modal:** Lines 744-823

### Notes (notes.css)
- **Folder Tree:** Lines 170-354
- **Editor:** Lines 362-565
- **File Modal:** Lines 571-781

### Calendar (calendar.css)
- **Month View:** Lines 132-211
- **Week View:** Lines 216-335
- **Day View:** Lines 339-387

### Documents (documents.css)
- **Document Card:** Lines 242-329
- **Upload Area:** Lines 154-232
- **Slide-Over:** Lines 356-507

## Responsive Breakpoints

```
1300px - Large desktop adjustments
1150px - Desktop layout changes
1100px - Stat sections
980px  - MAJOR: Sidebar reflow
900px  - Padding/font reductions
860px  - Slide-over width
800px  - Continue responsive
700px  - MAJOR: Mobile layout
600px  - Compact mobile
```

## Dark Mode

**Trigger:** Add `dark` class to `<body>`

**Overrides in:** Each CSS file has `body.dark { ... }` rules

**Not in:** style.css lines 34-52 (main dark mode variables)

## Quick Fixes Needed

### Priority 1 (Critical)
- [ ] Standardize button padding (currently 9px-12px height)
- [ ] Define typography scale (scattered 10px-48px sizes)
- [ ] Consolidate spacing (no variable scale)
- [ ] Add focus-visible to interactive elements
- [ ] Audit dark mode gaps

### Priority 2 (High)
- [ ] Move secondary colors to CSS variables
- [ ] Consolidate dark mode rules
- [ ] Implement naming convention (BEM)
- [ ] Centralize breakpoints
- [ ] Remove hardcoded values

### Priority 3 (Medium)
- [ ] Standardize animation timings
- [ ] Document component variants
- [ ] Add accessibility labels
- [ ] Create style guide
- [ ] Build Storybook

## Usage Examples

### Button (Inconsistent Currently)
```css
/* Should be: */
.btn-primary {
  background: var(--accent);
  color: white;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: var(--transition);
}
.btn-primary:hover {
  background: var(--accent-hover);
}
```

### Card (Consistent)
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
}
```

### Input (Should Standardize)
```css
/* Target: */
.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--text);
  background: var(--surface);
}
.input:focus {
  border-color: var(--accent);
  outline: none;
}
```

## Current Issues Summary

| Issue | Files Affected | Severity |
|-------|----------------|----------|
| Inconsistent spacing | All 10 | 🔴 Critical |
| Button style variance | 6+ | 🔴 Critical |
| Hardcoded colors | 8+ | 🟠 High |
| Typography not scaled | All 10 | 🔴 Critical |
| Scattered dark mode | All 10 | 🟠 High |
| No component naming | All 10 | 🟠 High |
| Missing focus states | All 10 | 🟠 High |
| Animation inconsistency | 7+ | 🟡 Medium |

## Architecture Recommendations

### Short-term (1-2 weeks)
1. Add CSS variables for secondary colors
2. Standardize button component
3. Define spacing scale
4. Add focus-visible states

### Medium-term (3-4 weeks)
1. Create typography scale variables
2. Implement naming convention (BEM)
3. Consolidate dark mode
4. Centralize breakpoints

### Long-term (5-8 weeks)
1. Build Storybook
2. Create design documentation
3. Implement accessibility audit
4. Create theme system

## File Size Analysis

```
style.css      2,433 lines (29%)  - Too large, needs refactoring
todo.css       1,372 lines (17%)  - Too large, needs splitting
dashboard.css    944 lines (11%)  - Reasonable
notes.css        931 lines (11%)  - Reasonable
calendar.css     741 lines (9%)   - Reasonable
documents.css    609 lines (7%)   - Reasonable
profile.css      340 lines (4%)   - Small
login.css        345 lines (4%)   - Small
tracking.css     306 lines (4%)   - Small
pomodoro.css     266 lines (3%)   - Small
TOTAL          8,287 lines
```

**Note:** style.css is too large and should be split into:
- base.css (reset, variables)
- layout.css (grid, sidebar)
- components.css (global components)
- utilities.css (helpers, animations)

## Next Steps

1. **Read:** DESIGN_ANALYSIS.md (full report)
2. **Review:** CSS variables in style.css (lines 7-32)
3. **Compare:** Button styles across 6 files
4. **Plan:** Standardization strategy
5. **Implement:** Phase 1 fixes (1-2 weeks)

---

Last Updated: June 10, 2026
Analysis Depth: Complete (8,287 lines examined)
