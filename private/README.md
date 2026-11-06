# Private, in house menus

The restaurant (dine in) and bar menus are for staff only. They are never part of the
public website and their prices never go to GitHub in readable form.

| Path | In git? | What it is |
|------|---------|------------|
| `private/data/*.ts` | No | Dine in menu data, checked against the owner's Word documents |
| `private/menus/*.pdf` | No | Readable A4 PDFs, for the owner on this computer |
| `private/encrypted/*.pdf.enc` | Yes | AES-256-GCM encrypted copies served to signed in staff |

Build: `npm run menu:dine-in` (needs Chrome and `MENU_FILES_KEY` in `.env`).
Credentials: `npm run staff:credentials` creates `.env` with random values. Never commit `.env`.

Staff sign in at `/staff/`. The live site needs the same six `.env` values set in
Vercel, Project Settings, Environment Variables. If `MENU_FILES_KEY` changes, rebuild
so the encrypted files match. Keep a backup of `private/data` and `.env`: they are not in git.
