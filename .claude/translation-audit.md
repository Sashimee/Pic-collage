You are reviewing the Pic-Collage React app for missing translations and UI issues.

## Task
1. Find ALL translation keys used via `t('...')` across `src/components/` and `src/App.tsx`
2. Check which ones are MISSING from `src/i18n/translations.ts` in ALL 5 languages (en, de, es, fr, it)
3. Add every missing key to all 5 language blocks with appropriate translations
4. Look for any other UI issues (broken imports, unused variables, missing error boundaries)
5. Fix everything you find

## Known Missing Keys (definitely add these)
- `watermark.title`, `watermark.enabled`, `watermark.text`, `watermark.placeholder`, `watermark.position`
- `print.title`, `print.enabled`, `print.bleed`, `print.bleedEnabled`, `print.crop`
- `onboard.welcomeTitle`, `onboard.next`, `onboard.skip` (check if these exist)
- `menu.more` (check if exists)
- Any other keys you find that aren't in translations.ts

## Rules
- Use single quotes for strings that contain apostrophes, escape with `\'`
- Keep the same structure: each language is a flat object of `'key': 'value'`
- English is the fallback — make sure every key exists in English
- Run `npm run lint` after changes and keep iterating until it passes
- Commit with conventional commits when done

Go!