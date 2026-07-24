# UI – Admin konzol és Driver PWA

> PRD 4. fejezet megvalósítása: a felhasználói felület réteg (Admin Web + Driver
> PWA), a meglévő API-kra és design-tokenekre építve.

## Áttekintés

A rendszer két felülete ugyanabban a Next.js alkalmazásban fut (nincs külön
mobilalkalmazás):

- **Admin konzol** – `/[locale]/(app)/*` útvonalcsoport, oldalsáv + fejléc
  kerettel (`AppShell`).
- **Driver PWA** – `/[locale]/driver/*`, érintésre optimalizált keret alsó
  navigációval és offline sávval (`DriverShell`).

Minden oldal a bejelentkezés után elérhető; a `HomePage` a szerepkör alapján a
megfelelő felületre irányít (`landingArea`).

## Design rendszer

Újrafelhasználható, shadcn/ui stílusú komponensek a `src/components/ui/` alatt
(`Button`, `Card`, `Input`, `Label`, `Select`, `Badge`, `Table`, `Dialog`,
`Spinner`, `Toast`). A színek a `globals.css` CSS-változóin keresztül jönnek, így
a világos/sötét mód és a tenant-szintű téma kódmódosítás nélkül állítható. A
sötét mód a `ThemeToggle` villanásmentes inline szkriptjével kerül alkalmazásra.

## Hitelesítés és munkamenet

- `SessionProvider` – a `sessionStore` (localStorage) fölé épülő React kontextus;
  `login`/`logout`, jogosultság-ellenőrzés (`can`), és a `/api/me` profil
  betöltése (nyelv/időzóna).
- `apiFetch` – bearer tokent csatoló `fetch` wrapper, egyszeri, single-flight
  token-frissítéssel `401` esetén; a hibákat fordítható `messageKey`-jel adja
  vissza (`ApiError`).
- `RequireAuth` – kliensoldali útvonalvédelem (a valódi határ minden esetben a
  szerveroldali jogosultság-ellenőrzés).

## Admin oldalak → API

| Oldal        | Végpont                  | Jogosultság         |
| ------------ | ------------------------ | ------------------- |
| Irányítópult | `GET /api/dashboard`     | `document.read`     |
| Fuvarok      | `GET/POST /api/trips`    | `trip.read/write`   |
| Dokumentumok | `GET /api/documents`, AI | `document.read`     |
| Sofőrök      | `GET/POST /api/drivers`  | `driver.read/write` |
| Felhasználók | `GET/POST /api/users`    | `user.manage`       |
| Cég          | `GET /api/settings`      | `tenant.manage`     |
| AI sor       | `GET /api/ai/jobs`       | `ai.execute`        |
| Audit        | `GET /api/audit`         | `audit.read`        |
| Riportok     | `GET /api/dashboard`     | `document.read`     |
| Beállítások  | `GET/PUT /api/settings`  | `settings.manage`   |
| Profil       | `GET /api/me`            | bejelentkezés       |

A menüpontok a `nav-items` katalógusból jönnek, és a hiányzó jogosultságú elemek
elrejtésre kerülnek (a szerveroldali ellenőrzés kiegészítéseként).

## Driver PWA

- **Kezdőlap** – aktív fuvarok és feltöltési összegzés, nagy „Fotózás" gomb.
- **Fotózás** (`/driver/capture`) – fuvar és dokumentumtípus választás, fotó
  készítése (`capture="environment"`), helyi minőségellenőrzés (`assessPhoto` →
  a megosztott `evaluateQuality` kapu), majd feltöltés online vagy sorba állítás
  offline állapotban.
- **Dokumentumaim** – a feltöltések és állapotuk listája.

### Offline működés

A `queue-store` a tiszta `sync-queue` logikát perzisztálja localStorage-ba. A
`useOfflineQueue` a kapcsolat visszatértekor automatikusan újrajátssza a
függőben lévő regisztrációkat (`/api/documents`), felhasználói beavatkozás
nélkül. A minőségileg megfelelő fotó offline esetben sorba kerül, és a
`useOnline` szerinti újracsatlakozáskor szinkronizálódik.

## Többnyelvűség és időzóna

Minden felirat a `messages/hu.json` és `messages/ro.json` katalógusból jön (nincs
beégetett szöveg). A dátumok a felhasználó nyelvének és időzónájának megfelelően
jelennek meg (`useFormatting` → `datetime` segédek). A nyelv a `LocaleSwitch`-csel
bármikor váltható, újbóli bejelentkezés nélkül.
