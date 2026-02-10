# Changelog

This document lists all notable changes to Elden Ring Cheat Sheets with each deployment.
Dates follow the ISO 8601 standard (YYYY-MM-DD).

## 2026-02-10

### Breaking Changes!
- Large rewrite of profile logic. If you were previously on your own created profile, you may have to manually switch back. Make sure to create a new backup, and consider deleting your old ones since they might be invalid.
- If you lost your progress due to the rewrite, you can now click the section totals (e.g. Tutorial [0/14]) to quickly complete entire sections at a time.
- Split the Legendary Equipment checklist on the Achievements sheet into separate sections. You may need to recheck several items you had already completed.

### Fixed
- Users on Android or other devices that force true dark mode should now see the website's actual color scheme, and not be met with inverted brown/black colors.
- Checkbox-related keyboard shortcuts "/" and "h" can no longer be used on pages without checkboxes.
- Closing the sidebar on mobile would trigger a background color in the navbar to linger until tapped away.

### Added
- All section progress numbers are now CLICKABLE BUTTONS! Clicking them will check all unchecked checkboxes in that section, or uncheck them if a section is "DONE".
- MISSABLE tags can now be hovered over to see why they're missable. For users on mobile, simply tapping on the tag will toggle its visibility. I am still in the process of writing these, so it could be some time until they all have explanations.
- New Talismans sheet with all talismans in the base game and DLC.
- New content in the Miscellaneous Items, Key Items, and New Game Plus sheets (will receive more updates after the DLC is written).
- All steps and items related to the DLC are now marked with "SOTE".
- Collapsed checklists and color theme now sync across multiple open tabs, no longer requiring a page reload.
- New "System" color theme option applies light or dark mode automatically based on your operating system's theme.
- New keyboard shortcut "t" will click the to-top button for you, moving you to the top of the page.
- Now uses the "Inter" variable font for all users instead of using the default system fonts, which resulted in misaligned text and checkboxes all across platforms.
- Note to a Golden Rune [11] in Leyndell Catacombs that may be bugged and not show for all players.
- Note to the Endings section in the walkthrough that all endings can still be gotten without Miquella's Needle.
- Links to the DLC sheet where mentioned in the walkthrough.
- The Resources sheet now uses tabular numbers for tables.
- Improved wording of some sentences across various sheets.

#### Accessibility Features
- Added skip links to all pages for keyboard users that want to skip navigation links.
- Everything now scales with the browser's font size, whereas before users would have to manually zoom in/out.
- Screen readers should now announce the action of keyboard shortcuts.
- Keyboard users can now call the sidebar from any focused element with the "s" keybind and return where they were (no longer forces focus to the menu).

### Changed
- Keyboard shortcut "q" for toggling the sidebar has been replaced by the more obvious "s" for "Sheets" or "sidebar".
- The color theme now defaults to the user's system preference if not set on the Options page.
- Heavily modified the colors in both light and dark mode for better contrast and readability. Dark mode now has a warmer and less cool tone, but most importantly the progress numbers are now white instead of dark.
- Complete code refactor. Unnecessary code will no longer run unless needed so the website should feel slightly faster, at least on phones loading the Walkthrough sheet with Vodafone 3G.
- Reduced the amount of inline styles required to load the website, which should result in faster load for slower connections.
- Simplified the way the search bar filters checklists, so searching should feel quite a bit faster.
- Searching on the Walkthrough sheet specifically is now slightly delayed on purpose to prevent your phone from overheating (Eh, it's still fast).
- Text should now be a lot bigger on mobile than before. Similarly, text has been slightly increased on desktop for readability.
- DLC in the NG+ Prep section now links to the DLC sheet.
- Achievement links in the walkthrough now go to Eldenpedia instead of the Achievements sheet.
- Changed group password from "ERSHEET" to "ERSHEETS" to fit the new name.

### Removed
- "Hide checked steps" button no longer persists across page reload; you'll need to click it or use the "h" shortcut every time. This was done to prevent FOUC and potential confusion for returning users.
- Old or unused localStorage keys should be automatically cleaned up the next time you load the website, freeing up some used space.

## 2026-01-16

### Added
- All sorceries and incantations to the Spells sheet.
- All Spirit Ashes and Ashes of War to the Ashes sheet.
- Simplified lead text across pages

## 2026-01-12

### Added
- All remaining armor pieces.
- All chest pieces to the Armor sheet.
- All headgear pieces to the Armor sheet.

## 2026-01-09

### Added
- Sticky notes to multiple Walkthrough, NPC Walkthrough, Questline, Merchant, and New Game Plus sections.
- Night labels to night bosses in Bosses.
- All melee armaments to Weapons.
- All ranged weapons, catalysts, and shields to Weapons.

## 2026-01-07

### Added
- Scadutree Fragment and Revered Spirit Ash tables to Resources.

### Changed
- Moved Remembrance table out of Runes section in Resources.
- Text should be slightly denser for legibility.
- Light and dark mode should be much more readable and accessible to all users.
- Links to regular font weight to improve readability.
- Sidebar will should no longer extend past the viewport height on smaller screens.

### Fixed
- Missable tags to Margit, Draconic Tree Sentinel, and steps in Fia's questline.
- First column links in tables on the Resources sheet are no longer bold.
- Collapse buttons appearing too low on mobile.

### Removed
- Multiple duplicate links across all sheets.
- Optional tags in Diallos's and Yura's questline.
- Scrollbar styling.
- Purple and green links that cluttered readability.
- Half implemented colorblind support (may implement a proper solution later).

## 2026-01-03

### Changed
- Armaments sheet renamed to Weapons.
- Miscellaneous sheet renamed to Miscellaneous Items.

## 2026-01-01

### Changed
- Site name (Elden Ring Cheat Sheet: 100% Completion Guide & Checklists -> Elden Ring Cheat Sheets).
- Page descriptions and lead text below the title.

### Removed
- Site name from each individual page (Walkthrough - Elden Ring Cheat Sheet -> Walkthrough).

## 2025-12-29

### Added
- Parenthesis behind every painting reward.

### Changed
- Use stele as a more accurate term for the map pillars.
- Slightly increased space between steps.
- Slightly decreased sidebar width.

### Fixed
- Missing reference to Seluvis in Nepheli's questline.
- Blurry checkboxes.
- Inconsistent text and header size depending on device.

## 2025-12-28

### Added
- West Gravesite Plain (DLC Walkthrough, NPC Walkthrough, Questlines, Bosses).
- Moore's inventory (Merchants).
- DLC divider in each Current Progress section.

### Changed
- Shortened URL fragments (e.g. /questlines#ranni-the-witch -> /questlines#ranni).
- Corrected all sentences where camp and campsite were used interchangeably.

### Fixed
- Missing mention of the Questlines sheet in the FAQ.

Older changes are not listed here.
