# Vallordocs

# AI Instructions

Ez a dokumentum a projekt elsődleges specifikációja.

A fejlesztés során mindig ezt tekintsd elsődleges forrásnak.

Ha a meglévő kód és ez a dokumentum ellentmond egymásnak, először jelezd az eltérést, majd kérj jóváhagyást.

Ne találj ki új működést.

Ne egyszerűsítsd a specifikációt.

Ha egy követelmény nem egyértelmű, kérdezz.

Minden új funkciónál:

1. Elemezd a jelenlegi architektúrát.
2. Illeszkedj a meglévő kódhoz.
3. Kövesd a dokumentumban leírt szabályokat.
4. Ne duplikálj kódot.
5. Írj teszteket.
6. Frissítsd a dokumentációt.

# 1. FEJEZET – PROJEKT CÉLJA, KÖVETELMÉNYEK, TECHNOLÓGIAI STACK ÉS ARCHITEKTÚRA

# SZEREP

Te egy Principal Software Architect, Senior Full Stack Developer, AI Engineer, DevOps Engineer, Security Engineer és UX Designer vagy.

A célod nem egy prototípus vagy demo elkészítése, hanem egy hosszú távon fenntartható, biztonságos és skálázható SaaS rendszer fejlesztése, amelyet fuvarozó vállalatok használhatnak Romániában és később egész Európában.

Minden döntés során az alábbi alapelveket kövesd:

- Clean Architecture
- Modular Monolith
- SOLID
- Domain Driven Design
- Security First
- Privacy by Design
- GDPR by Design
- Audit by Design
- AI First
- Offline First
- Production Ready

Ne készíts ideiglenes vagy gyors megoldásokat. Minden funkció legyen bővíthető, tesztelhető és karbantartható.

---

# A PROJEKT CÉLJA

A rendszer célja, hogy a sofőrök mobiltelefonjukkal lefotózott fuvardokumentumaiból automatikusan professzionális, szkennelt minőségű PDF dokumentumokat készítsen.

A rendszer elsősorban nem OCR alkalmazás, hanem intelligens dokumentum-helyreállító rendszer.

A támogatott dokumentumtípusok:

- CMR
- Számla (Invoice)
- POD (Proof of Delivery)
- Delivery Note
- ADR dokumentumok
- Mérlegjegyek
- Üzemanyag nyugták
- Útdíj bizonylatok
- Vámdokumentumok
- Egyéb fuvarozási dokumentumok

---

# ÜZLETI CÉLOK

A rendszer segítsen:

- csökkenteni a hibás dokumentumokat
- csökkenteni az adminisztrációs időt
- gyorsítani a dokumentumfeldolgozást
- egységes PDF-eket készíteni
- egyszerűsíteni az archiválást
- növelni az ügyfelek felé küldött dokumentumok minőségét
- minimalizálni az emberi hibákat

---

# FEJLESZTÉSI FILOZÓFIA

A teljes rendszer egyetlen alkalmazásként fusson.

Ne legyen külön backend és frontend szerver.

Ne legyen külön API projekt.

Minden egyetlen Fly.io alkalmazásként fusson.

A Next.js szolgálja ki:

- Admin felületet
- Driver felületet
- API végpontokat
- Server Actionöket
- Hitelesítést
- AI feldolgozást
- PDF generálást
- Fájlkezelést

A belső modulok azonban legyenek teljesen elkülönítve.

---

# TECHNOLÓGIAI STACK

Frontend:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- Next.js Route Handlers
- Next.js Server Actions
- TypeScript

Adatbázis:

- Neon PostgreSQL
- Prisma ORM

AI:

- Gemini API

Queue:

- BullMQ
- Redis

Storage:

Első verzió:

- Fly.io Volume

Később:

- Cloudflare R2

Úgy kell megtervezni, hogy csak environment változók módosításával lehessen másik storage szolgáltatóra váltani.

---

# MODULAR MONOLITH

A projekt egyetlen alkalmazásként fusson.

Viszont a kód modulokra legyen bontva.

Ajánlott könyvtárszerkezet:

/app

/modules

/auth

/ai

/storage

/audit

/users

/tenants

/documents

/trips

/notifications

/settings

/dashboard

/services

/repositories

/shared

/lib

/hooks

/components

/messages

/public

/prisma

/scripts

Minden modul önálló legyen.

Ne hivatkozzanak egymás belső implementációjára.

---

# KÓDOLÁSI SZABÁLYOK

Használj:

- TypeScript Strict Mode
- ESLint
- Prettier
- Husky
- Lint Staged

Kerüld:

- any típust
- ismétlődő kódot
- globális állapotot, ha nem szükséges
- felesleges függőségeket

---

# UI KÖVETELMÉNYEK

A felület legyen:

- gyors
- letisztult
- modern
- mobilbarát
- reszponzív
- könnyen használható

Használj:

- shadcn/ui komponenseket
- Tailwind CSS-t
- egységes design rendszert

---

# PWA

A Driver felület teljes értékű Progressive Web App legyen.

Támogatnia kell:

- telepítést
- offline működést
- háttérszinkronizálást
- automatikus újrapróbálkozást internetkapcsolat visszatérésekor

---

# TÖBBNYELVŰ TÁMOGATÁS

A rendszer első naptól kezdve kétnyelvű legyen.

Nyelvek:

- Magyar
- Román

Használj i18n fordítási rendszert.

Ajánlott:

next-intl

Minden felhasználói szöveg fordítási fájlokból érkezzen.

Soha ne írj fix szöveget a komponensekbe.

Fordítási fájlok:

/messages

hu.json

ro.json

Fordítandó elemek:

- gombok
- menük
- hibaüzenetek
- értesítések
- dashboard
- státuszok
- űrlapok
- validációk
- e-mailek
- AI üzenetek

Minden felhasználónak saját nyelve lehet.

Minden tenantnak alapértelmezett nyelve lehet.

A felhasználó felülírhatja a tenant alapértelmezett nyelvét.

---

# IDŐZÓNA

Támogatott időzónák:

Europe/Budapest

Europe/Bucharest

A dátumok és időpontok mindig a felhasználó nyelvének és időzónájának megfelelő formátumban jelenjenek meg.

---

# KÓDMINŐSÉG

Minden új funkcióhoz:

- Unit Test
- Integration Test
- E2E Test

A kód minden commit előtt automatikusan ellenőrzésre kerüljön.

---

# FEJLESZTÉSI STRATÉGIA

Ne építsd meg egyszerre az egész rendszert.

Minden fejlesztést bonts kisebb mérföldkövekre.

Minden mérföldkő után várd meg a jóváhagyásomat.

Ne ugorj előre.

Ha egy funkció nem egyértelmű, kérdezz.

A cél egy professzionális, hosszú távon fenntartható, skálázható és biztonságos SaaS rendszer elkészítése, amely megfelel a romániai és európai uniós követelményeknek, és később könnyen bővíthető új AI szolgáltatókkal, új storage rendszerekkel és további funkciókkal.

# 2. FEJEZET – MULTI-TENANT RENDSZER, FELHASZNÁLÓK, JOGOSULTSÁGOK, ADATBÁZIS ÉS HITELESÍTÉS

# MULTI-TENANT ARCHITEKTÚRA

A rendszer valódi (True Multi-Tenant) SaaS alkalmazás legyen.

Minden fuvarozó vállalat külön Tenant.

Egy Tenant teljesen elkülönül minden más Tenanttól.

A Tenant izoláció kötelező az alábbiakra:

- Felhasználók
- Sofőrök
- Fuvarok
- Dokumentumok
- AI feldolgozások
- Audit naplók
- Értesítések
- Beállítások
- Statisztikák
- Fájlok
- Storage útvonalak

Soha semmilyen lekérdezés nem adhat vissza más Tenant adatait.

Minden adatbázis lekérdezés automatikusan Tenant ID alapján szűrjön.

---

# PLATFORM SZINT

A rendszer két szintből áll.

## Platform

A platform tulajdonosa kezeli:

- Tenant létrehozása
- Tenant törlése
- Tenant felfüggesztése
- Előfizetések
- Rendszerbeállítások
- AI limitek
- Storage limitek
- Platform statisztikák

---

## Tenant

A Tenant saját adatait kezeli.

Nem lát más céget.

Nem módosíthat platform beállításokat.

---

# FELHASZNÁLÓI SZEREPKÖRÖK

## Platform Owner

Teljes hozzáférés.

Minden Tenant kezelése.

---

## Platform Administrator

Platform kezelés.

Tenant kezelés.

Nem fér hozzá a rendszer titkos kulcsaihoz.

---

## Tenant Administrator

Saját cég kezelése.

Felhasználók.

Jogosultságok.

Beállítások.

Sofőrök.

Fuvarok.

Dokumentumok.

---

## Dispatcher

Fuvarok kezelése.

Dokumentumok megtekintése.

Sofőrök kezelése.

AI állapot figyelése.

---

## Office User

Dokumentumok.

PDF letöltés.

Keresés.

Megtekintés.

---

## Driver

Csak saját fuvarjai.

Csak saját dokumentumai.

Fotózás.

Feltöltés.

PDF letöltés.

---

## Read Only

Csak olvasási jogosultság.

---

# RBAC

Role Based Access Control használata kötelező.

Minden végpont jogosultság ellenőrzést végez.

Ne csak a frontend ellenőrizze.

A backend minden művelet előtt ellenőrizze:

- Tenant
- Szerepkör
- Jogosultság

---

# AUTHENTIKÁCIÓ

Bejelentkezési lehetőségek:

- E-mail + jelszó
- Magic Link
- Később OAuth előkészítés
- 2FA előkészítés

Jelszavak:

Argon2 hash.

Soha ne tárolj jelszót.

---

# MUNKAMENET

JWT Access Token.

Refresh Token.

Secure Cookie.

HTTP Only.

SameSite.

Automatikus token frissítés.

Automatikus kijelentkeztetés lejárat után.

---

# ESZKÖZKEZELÉS

Felhasználó lássa:

- aktív eszközök
- utolsó belépés
- IP cím
- böngésző
- operációs rendszer

Lehessen:

- kijelentkeztetni egy eszközt
- kijelentkeztetni minden eszközt

---

# FELHASZNÁLÓ PROFIL

Minden felhasználó rendelkezzen:

- név
- e-mail
- telefonszám
- nyelv
- időzóna
- avatar
- státusz
- szerepkör

---

# SOFŐR PROFIL

A sofőr külön entitás.

Tárolható:

- név
- sofőrkód
- telefon
- e-mail
- jogosítvány száma
- ADR jogosultság
- státusz

---

# TENANT BEÁLLÍTÁSOK

Minden Tenant rendelkezzen:

- cégnév
- adószám
- ország
- cím
- logó
- alapértelmezett nyelv
- alapértelmezett időzóna
- dokumentum megőrzési idő
- AI engedélyezése
- PDF minőség
- storage limit

---

# ADATBÁZIS

Használj:

Neon PostgreSQL.

ORM:

Prisma.

Ne használj nyers SQL-t, kivéve teljesítménykritikus esetben.

---

# FŐBB TÁBLÁK

- tenants
- users
- roles
- permissions
- user_roles
- drivers
- trips
- documents
- document_versions
- ai_jobs
- notifications
- audit_logs
- login_history
- refresh_tokens
- settings
- storage_files

---

# SOFT DELETE

A legtöbb rekord használjon Soft Delete mezőket:

deleted_at

deleted_by

Csak Platform Owner törölhet véglegesen.

---

# VERZIÓKEZELÉS

Minden dokumentumnak lehessen több verziója.

Például:

- eredeti fotó
- AI javított kép
- végleges PDF

Ezek külön rekordok legyenek.

---

# ADATINTEGRITÁS

Minden rekord rendelkezzen:

- UUID azonosítóval
- created_at
- updated_at
- created_by
- updated_by
- tenant_id

---

# INDEXEK

Optimalizálj indexeket:

- tenant_id
- user_id
- driver_id
- trip_id
- document_type
- created_at
- status

---

# KERESÉS

Gyors keresés:

- dokumentum
- fuvar
- sofőr
- felhasználó
- dátum
- dokumentumtípus
- státusz

---

# VALIDÁCIÓ

Minden adat validálása kötelező.

Frontend.

Backend.

Adatbázis.

Háromszintű validáció.

---

# API SZABÁLYOK

Minden Route Handler:

- autentikáció
- Tenant ellenőrzés
- jogosultság ellenőrzés
- input validáció
- audit napló
- egységes hibakezelés

---

# HIBAKEZELÉS

Ne jelenjenek meg belső hibák.

Felhasználóbarát üzenetek.

Részletes hibák kizárólag logban szerepeljenek.

---

# FEJLESZTÉSI ELV

A teljes jogosultsági rendszer legyen könnyen bővíthető.

Új szerepkör vagy jogosultság hozzáadása ne igényeljen jelentős kódmódosítást.

A Tenant izoláció minden körülmények között elsődleges biztonsági követelmény.

# 3. FEJEZET – AI DOKUMENTUMFELDOLGOZÁS, KÉPFELDOLGOZÁS, PDF GENERÁLÁS, STORAGE ÉS HÁTTÉRFELDOLGOZÁS

# AI RENDSZER CÉLJA

Az AI elsődleges feladata NEM az OCR.

Az AI feladata a dokumentum vizuális helyreállítása úgy, hogy a végeredmény úgy nézzen ki, mintha professzionális A4 dokumentumszkennerrel készült volna.

A rendszernek minden feldolgozás során meg kell őriznie a dokumentum hitelességét.

Az AI semmilyen adatot nem találhat ki.

---

# TÁMOGATOTT DOKUMENTUMOK

A rendszer automatikusan kezelje többek között:

- CMR
- Invoice
- POD
- Delivery Note
- ADR dokumentum
- Weight Ticket
- Fuel Receipt
- Toll Receipt
- Vámdokumentumok
- Egyéb fuvarozási dokumentumok

---

# AI FELDOLGOZÁSI FOLYAMAT

1. A sofőr elkészíti a fényképet.

↓

2. Az alkalmazás helyben minőségellenőrzést végez.

↓

3. A kép feltöltésre kerül.

↓

4. Az eredeti kép változatlanul mentésre kerül.

↓

5. AI feldolgozás indul háttérben.

↓

6. Perspektíva javítás.

↓

7. Lap széleinek felismerése.

↓

8. Automatikus kivágás.

↓

9. Árnyék eltávolítás.

↓

10. Háttér eltávolítás.

↓

11. Geometriai torzítás javítása.

↓

12. Kontraszt optimalizálása.

↓

13. Fehéregyensúly javítása.

↓

14. Enyhe zajszűrés.

↓

15. Enyhe élesítés.

↓

16. A4 méretre igazítás.

↓

17. PDF generálás.

↓

18. Mentés Storage-ba.

↓

19. Értesítés a felhasználónak.

---

# AZ AI MIT JAVÍTHAT

Megengedett:

- perspektíva
- zaj
- árnyék
- háttér
- megvilágítás
- fehéregyensúly
- enyhe homály
- enyhe torzítás
- lap szélei
- automatikus crop
- dokumentum igazítása

---

# AZ AI MIT NEM MÓDOSÍTHAT

Szigorúan tilos:

- karaktereket kitalálni
- számokat javítani
- dátumokat módosítani
- kézzel írt szöveget újragenerálni
- aláírást módosítani
- pecséteket módosítani
- hiányzó részeket kitalálni
- olvashatatlan adatokat kiegészíteni

Ha egy adat nem olvasható, maradjon úgy.

---

# DOKUMENTUM HITELLESSÉG

A rendszer célja a dokumentum olvashatóságának javítása, nem pedig annak tartalmi módosítása.

A dokumentum mindig hiteles másolat maradjon.

---

# FOTÓ MINŐSÉGELLENŐRZÉS

Még feltöltés előtt ellenőrizni kell:

- életlenség
- bemozdulás
- túl sötét
- túl világos
- vaku csillanás
- tükröződés
- hiányzó laprész
- levágott dokumentum
- több dokumentum egyszerre
- ujj a képen
- rossz távolság
- alacsony felbontás

Ha hiba van:

Ne engedje a feltöltést.

Mutassa a pontos hibát.

---

# PDF GENERÁLÁS

A végleges PDF:

- A4
- 300 DPI
- eredeti színek
- megfelelő margók
- torzításmentes
- kiváló olvashatóság

---

# TÖBBOLDALAS DOKUMENTUM

Támogatni kell:

- több fotóból egy PDF
- oldalak sorrendjének módosítása
- oldal törlése
- oldal újrafotózása
- hiányzó oldal figyelmeztetés

---

# STORAGE RENDSZER

Storage használata Interface alapú legyen.

Soha ne közvetlenül Fly.io vagy Cloudflare API-t hívjon az alkalmazás.

Használjon Storage Provider mintát.

Például:

StorageProvider

↓

FlyStorageProvider

↓

CloudflareR2Provider

↓

AmazonS3Provider

↓

AzureBlobProvider

↓

GoogleCloudStorageProvider

Így később egyetlen konfigurációs módosítással lehessen szolgáltatót váltani.

---

# ELSŐ VERZIÓ

Storage:

Fly.io Volume

Minden fájl ide kerüljön.

---

# KÉSŐBBI VERZIÓ

Ha létezik megfelelő Environment Secret:

automatikusan használja:

Cloudflare R2

Ne kelljen kódot módosítani.

Csak a Secret értékét.

---

# FÁJLSTRUKTÚRA

Példa:

tenant-id/

documents/

trip-id/

document-id/

original/

processed/

pdf/

thumbnail/

preview/

Minden Tenant teljesen elkülönített könyvtárat kapjon.

---

# FÁJLVERZIÓK

Minden dokumentum rendelkezzen:

- eredeti fotó
- AI javított kép
- előnézeti kép
- végleges PDF

Soha ne írjuk felül az eredeti képet.

---

# AI SZOLGÁLTATÓ

Elsődlegesen:

Google Gemini API.

Az AI modul Provider mintát használjon.

Példa:

AIProvider

↓

GeminiProvider

↓

OpenAIProvider

↓

ClaudeProvider

↓

VertexAIProvider

A jövőben szolgáltatóváltás csak konfiguráció kérdése legyen.

---

# HÁTTÉRFELDOLGOZÁS

Minden AI feldolgozás Queue rendszerben fusson.

Használj:

BullMQ

Redis

Minden feldolgozás:

- újrapróbálható
- naplózott
- megszakítható
- monitorozható

---

# DEAD LETTER QUEUE

Sikertelen feldolgozás után:

Dead Letter Queue.

Admin újraindíthatja.

---

# ÉRTESÍTÉSEK

AI feldolgozás állapotai:

- Feltöltve
- Feldolgozás alatt
- PDF készül
- Kész
- Sikertelen
- Újrapróbálás
- Megszakítva

---

# KÉPFORMÁTUMOK

Támogatott bemenet:

- JPG
- JPEG
- PNG
- HEIC
- WEBP

Kimenet:

- PDF
- JPG előnézet
- Thumbnail

---

# TELJESÍTMÉNY

A rendszer egyszerre több AI feladatot is tudjon feldolgozni.

A Queue automatikusan szabályozza a terhelést.

Ne blokkolja a felhasználói felületet.

---

# NAPLÓZÁS

Minden AI feldolgozásról készüljön napló:

- Ki indította
- Mikor
- Mennyi ideig tartott
- Melyik AI modellt használta
- Sikeres volt-e
- Hiba esetén részletes hibanapló

---

# FEJLESZTÉSI ELV

Az AI modul teljesen független legyen az alkalmazás többi részétől.

A Storage modul teljesen cserélhető legyen.

Az eredeti fájlok sértetlensége minden körülmények között biztosított legyen.

A rendszer minden feldolgozási lépése visszakövethető és auditálható legyen.

# 4. FEJEZET – DRIVER PWA, ADMIN FELÜLET, UI/UX, i18n, OFFLINE MŰKÖDÉS ÉS FELHASZNÁLÓI ÉLMÉNY

# ALAPELVEK

A rendszer két fő felületből áll:

1. Driver (PWA)
2. Admin Web

Mindkettő ugyanabban a Next.js alkalmazásban fusson.

Ne legyen külön mobilalkalmazás.

Ne legyen React Native.

Ne legyen Flutter.

A Driver felület teljes értékű Progressive Web App (PWA) legyen.

---

# DESIGN RENDSZER

Használj:

- TailwindCSS
- shadcn/ui
- Lucide Icons

A teljes rendszer egységes design rendszert használjon.

Minden komponens újrafelhasználható legyen.

Ne legyen ismétlődő UI.

---

# SZÍNVILÁG

Modern.

Minimalista.

Gyors.

Professzionális.

Fuvarozási környezethez illő.

Világos és sötét mód támogatása.

Tenant saját logója megjeleníthető.

---

# DRIVER FELÜLET

A Driver felületet olyan sofőrök használják, akik gyakran:

- kesztyűben dolgoznak
- napsütésben használják a telefont
- kevés idejük van
- nem informatikusok

Ezért:

Kevés kattintás.

Nagy gombok.

Nagy betűk.

Jól látható ikonok.

Egyszerű navigáció.

---

# DRIVER FOLYAMAT

Bejelentkezés

↓

Fuvar kiválasztása

↓

Dokumentum típus kiválasztása

↓

Fotó készítése

↓

Automatikus minőségellenőrzés

↓

Sikeres?

↓

Igen

↓

Feltöltés

↓

AI feldolgozás

↓

PDF elkészül

↓

Értesítés

↓

Megtekintés

↓

Letöltés

---

# OFFLINE MŰKÖDÉS

A Driver alkalmazás működjön internet nélkül is.

Offline esetben:

- fotózhat
- dokumentumokat sorba állíthat
- megtekintheti saját feltöltéseit

Internet visszatérésekor:

Automatikus szinkronizálás.

Felhasználói beavatkozás nélkül.

---

# PWA KÖVETELMÉNYEK

Támogassa:

- Home Screen telepítés
- Offline cache
- Background Sync
- Service Worker
- Automatikus frissítés
- Push Notification előkészítés

---

# DRIVER KEZDŐLAP

Mutassa:

- aktív fuvarok
- feltöltendő dokumentumok
- sikeres feltöltések
- AI feldolgozás alatt
- hibás feltöltések

---

# DOKUMENTUM FOTÓZÁS

Automatikus:

- dokumentum keret felismerés
- minőségellenőrzés
- fókusz ellenőrzés
- fényviszony ellenőrzés

Hibák esetén:

Jelenjen meg:

Mi a probléma.

Hogyan javítható.

---

# DRIVER ÉRTESÍTÉSEK

Értesítések:

- Feltöltés sikeres
- AI feldolgozás elindult
- PDF elkészült
- Hiba történt
- Újrapróbálás szükséges

---

# ADMIN FELÜLET

A Dashboard legyen személyre szabható.

Widget alapú.

Például:

Mai feltöltések

AI feldolgozások

Hibák

Aktív sofőrök

Legutóbbi dokumentumok

Storage használat

---

# ADMIN MENÜ

Dashboard

Fuvarok

Dokumentumok

Sofőrök

Felhasználók

Tenant

AI Queue

Audit

Riportok

Beállítások

Profil

---

# DOKUMENTUM KEZELŐ

Dokumentum lista.

Szűrés:

- sofőr
- fuvar
- státusz
- dátum
- dokumentumtípus

Rendezés.

Lapozás.

Gyors keresés.

---

# DOKUMENTUM ELŐNÉZET

Megjeleníthető:

- eredeti fotó
- AI javított kép
- PDF
- verziók

Lehessen váltani közöttük.

---

# AI STÁTUSZ

Minden dokumentumnál látható:

- Feltöltve
- Feldolgozás alatt
- Várakozik
- Kész
- Sikertelen

---

# DASHBOARD

Mutasson statisztikákat:

Mai feltöltések.

Heti feltöltések.

AI sikerességi arány.

Átlagos feldolgozási idő.

Legaktívabb sofőrök.

Legtöbb dokumentum.

Storage használat.

---

# KERESÉS

Globális kereső.

Keressen:

- dokumentumban
- fuvarban
- sofőrben
- felhasználóban

Azonnali keresési eredmények.

---

# I18N

A teljes rendszer kétnyelvű legyen.

Nyelvek:

Magyar

Román

---

# FORDÍTÁS

Minden szöveg fordítási fájlban legyen.

Ne legyen hardcode-olt felirat.

Példa:

/messages

hu.json

ro.json

---

# FORDÍTANDÓ ELEMEK

- Menü
- Dashboard
- Gombok
- Űrlapok
- Értesítések
- Hibaüzenetek
- AI státuszok
- Validációk
- PDF státuszok
- Audit
- Riportok

---

# NYELVVÁLTÁS

A felhasználó bármikor válthat:

HU

RO

Új bejelentkezés nélkül.

---

# IDŐZÓNA

Minden felhasználónál külön:

Europe/Budapest

Europe/Bucharest

Minden dátum ennek megfelelően jelenjen meg.

---

# HOZZÁFÉRHETŐSÉG

WCAG AA kompatibilitás.

Billentyűzet támogatás.

Megfelelő kontraszt.

Screen Reader előkészítés.

---

# ÉRTESÍTÉSI RENDSZER

Toast értesítések.

Státusz értesítések.

Hibaüzenetek.

Sikeres műveletek.

Később Push Notification támogatás.

---

# RESZPONZÍV MŰKÖDÉS

A rendszer hibátlanul működjön:

Mobil

Tablet

Laptop

Desktop

---

# TELJESÍTMÉNY

Az UI gyors legyen.

Használj:

- Lazy Loading
- Code Splitting
- Dynamic Imports
- Image Optimization
- Infinite Scroll ahol szükséges

---

# FELHASZNÁLÓI ÉLMÉNY

A cél, hogy egy új sofőr legfeljebb 5 perc alatt megtanulja használni az alkalmazást.

A kezelőfelület legyen intuitív, gyors és minimális számú kattintást igényeljen.

Minden fontos művelethez jelenjen meg vizuális visszajelzés (betöltés, siker, hiba, feldolgozás).

A teljes UI legyen modern, letisztult, professzionális és hosszú távon könnyen bővíthető.

# 5. FEJEZET – BIZTONSÁG, GDPR, ROMÁN ÉS EU MEGFELELŐSÉG, AUDIT, NAPLÓZÁS ÉS MONITORING

# ALAPELV

A biztonság nem külön funkció, hanem a rendszer minden részének alapkövetelménye.

A teljes alkalmazás megfeleljen a "Security by Design" és "Privacy by Design" elveknek.

Minden új funkció fejlesztésekor elsőként a biztonsági és adatvédelmi szempontokat kell figyelembe venni.

---

# OWASP TOP 10

A rendszer feleljen meg az aktuális OWASP Top 10 ajánlásainak.

Különösen védekezzen:

- SQL Injection
- Cross Site Scripting (XSS)
- Cross Site Request Forgery (CSRF)
- Broken Authentication
- Broken Access Control
- Security Misconfiguration
- Sensitive Data Exposure
- SSRF
- Path Traversal
- File Upload támadások

---

# AUTHENTIKÁCIÓ

Használj:

- JWT Access Token
- Refresh Token
- HTTP Only Cookie
- Secure Cookie
- SameSite Cookie

Tokenek automatikus megújítása.

Automatikus kijelentkeztetés lejáratkor.

Később könnyen bekapcsolható legyen:

- TOTP 2FA
- SMS 2FA
- Passkey/WebAuthn

---

# JELSZAVAK

Minden jelszó:

Argon2 algoritmussal hash-elve.

Soha ne tárolj:

- sima jelszót
- visszafejthető jelszót

Erős jelszókövetelmények:

- minimum 12 karakter
- kisbetű
- nagybetű
- szám
- speciális karakter

---

# JOGOSULTSÁG

Minden kérés előtt kötelező ellenőrizni:

- bejelentkezés
- Tenant ID
- szerepkör
- jogosultság

A frontend jogosultságellenőrzése önmagában nem elegendő.

---

# FÁJLBIZTONSÁG

Minden feltöltött fájlt ellenőrizni kell.

Vizsgálatok:

- MIME típus
- kiterjesztés
- maximális méret
- sérült fájl
- dupla kiterjesztés
- rossz fejléc
- rossz PDF

Később vírusellenőrzés integrálható legyen.

---

# RATE LIMIT

Minden végpont rendelkezzen Rate Limittel.

Külön szabályok:

- Login
- File Upload
- AI feldolgozás
- API végpontok

Brute Force támadások automatikus blokkolása.

---

# SECRET KEZELÉS

Semmilyen érzékeny adat ne legyen hardcode-olva.

Minden kizárólag Environment Variable-ből érkezzen.

Példák:

DATABASE_URL

GEMINI_API_KEY

JWT_SECRET

REDIS_URL

STORAGE_PROVIDER

FLY_STORAGE_PATH

R2_ACCOUNT_ID

R2_ACCESS_KEY

R2_SECRET_KEY

R2_BUCKET

SMTP_HOST

SMTP_USER

SMTP_PASSWORD

---

# STORAGE BIZTONSÁG

A fájlok neve ne legyen kitalálható.

Használj UUID alapú fájlneveket.

Minden letöltés jogosultság-ellenőrzés után történjen.

Ne legyen publikus storage.

---

# NAPLÓZÁS

A rendszer külön naplókat vezessen:

Application Log

Security Log

Audit Log

AI Log

Storage Log

Authentication Log

Performance Log

Error Log

Deployment Log

---

# AUDIT

Minden fontos esemény naplózása kötelező.

Példák:

Bejelentkezés

Kijelentkezés

Sikertelen login

Dokumentum feltöltés

AI feldolgozás

PDF létrehozás

Felhasználó létrehozása

Jogosultság módosítása

Tenant módosítása

Storage törlés

Beállítás módosítása

---

# AUDIT ADATOK

Minden eseményhez tárolni kell:

UUID

Tenant

Felhasználó

IP cím

Böngésző

Operációs rendszer

Eszköz

Időpont

Művelet

Régi érték

Új érték

Sikeres vagy sikertelen

Hiba oka

---

# AUDIT SZABÁLYOK

Az Audit rekord:

- nem módosítható
- nem törölhető
- csak olvasható

Csak Platform Owner exportálhatja.

---

# GDPR

A rendszer feleljen meg az Európai Unió GDPR rendeletének.

Privacy by Design kötelező.

---

# GDPR FUNKCIÓK

A rendszer támogassa:

- Hozzájárulás kezelése
- Adat export
- Adat törlése
- Right to be Forgotten
- Adathordozhatóság
- Retention Policy
- Anonimizálás

---

# RETENTION POLICY

Tenant szinten állítható:

Dokumentum megőrzési idő.

Audit megőrzési idő.

Log megőrzési idő.

Lejárt adatok automatikus archiválása vagy törlése.

---

# ROMÁN ÉS EU MEGFELELÉS

A rendszer tervezésekor vedd figyelembe:

- GDPR
- eIDAS
- NIS2 ajánlások
- Román adatvédelmi szabályozás
- Elektronikus dokumentum-megőrzési ajánlások

A rendszer legyen felkészítve külső auditokra.

---

# TITKOSÍTÁS

Minden kapcsolat TLS-en keresztül történjen.

Érzékeny adatok titkosítása:

- Tokenek
- API kulcsok
- Storage hitelesítő adatok

A jövőben támogassa az adatbázis mezőszintű titkosítást is.

---

# MONITORING

A rendszer folyamatosan figyelje:

- CPU
- Memória
- Redis
- Queue
- Storage
- AI feldolgozás
- API válaszidők

---

# HEALTH CHECK

Külön Health Endpoint:

Database

Redis

Storage

Gemini API

Queue

Disk

Memory

---

# METRIKÁK

Készüljön statisztika:

- napi feltöltések
- AI sikerességi arány
- AI hibák
- átlagos feldolgozási idő
- storage használat
- aktív felhasználók
- aktív tenantok

---

# HIBAKEZELÉS

A felhasználó csak biztonságos hibaüzenetet lásson.

A részletes kivétel kizárólag logban jelenjen meg.

Ne szivárogjon ki:

- stack trace
- SQL hiba
- fájlrendszer útvonal
- API kulcs
- belső konfiguráció

---

# BIZTONSÁGI ELV

A rendszer minden komponense alapértelmezetten biztonságos legyen.

Ha két megoldás közül kell választani, mindig a biztonságosabbat válaszd, még akkor is, ha annak fejlesztése összetettebb.

Minden új modulnak automatikusan illeszkednie kell a hitelesítési, jogosultsági, audit és naplózási rendszerhez.

# 6. FEJEZET – DEPLOYMENT, DEVOPS, CI/CD, DOKUMENTÁCIÓ, TESZTELÉS ÉS FEJLESZTÉSI SZABÁLYOK

# CÉL

A rendszer legyen production-ready már az első verziótól.

Minden komponens úgy készüljön, hogy hosszú távon karbantartható, skálázható és könnyen bővíthető legyen.

A teljes alkalmazás egyetlen Fly.io alkalmazásként fusson.

Ne legyen külön frontend és backend szerver.

---

# DEPLOYMENT

Elsődleges környezet:

Fly.io

A rendszer egy Docker konténerben fusson.

Minden szolgáltatás ugyanabban az alkalmazásban működjön:

- Next.js
- API Route Handlers
- Server Actions
- AI Orchestrator
- PDF Generálás
- Storage
- Hitelesítés
- Admin felület
- Driver PWA

---

# ADATBÁZIS

Neon PostgreSQL

Kapcsolódás kizárólag:

DATABASE_URL

Environment Variable segítségével.

---

# REDIS

BullMQ Queue használatához Redis szükséges.

Kapcsolódás:

REDIS_URL

Environment Variable.

---

# STORAGE

A Storage Provider automatikusan válasszon szolgáltatót.

Ha csak Fly konfiguráció érhető el:

Fly Volume használata.

Ha Cloudflare R2 Secret is elérhető:

Automatikusan Cloudflare R2 használata.

Semmilyen kódmódosítás ne legyen szükséges.

Csak Environment Variable módosítása.

---

# ENVIRONMENT VARIABLES

Minden konfiguráció kizárólag Environment Variable legyen.

Példák:

DATABASE_URL

REDIS_URL

JWT_SECRET

GEMINI_API_KEY

STORAGE_PROVIDER

FLY_STORAGE_PATH

R2_ACCOUNT_ID

R2_ACCESS_KEY

R2_SECRET_KEY

R2_BUCKET

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASSWORD

APP_URL

DEFAULT_LANGUAGE

DEFAULT_TIMEZONE

LOG_LEVEL

---

# KONFIGURÁCIÓ

Ne legyen Hardcode.

Minden konfiguráció egy központi Config modulból érkezzen.

A Config modul validálja az összes Environment Variable-t induláskor.

Hiányzó konfiguráció esetén az alkalmazás ne induljon el.

---

# DOCKER

Készíts:

Dockerfile

docker-compose.yml

.devcontainer előkészítés

Production optimalizált image.

Minimalizált méret.

---

# CI/CD

GitHub Actions használata.

Pipeline lépései:

1. Install

2. Lint

3. Type Check

4. Unit Test

5. Integration Test

6. Build

7. Docker Build

8. Deploy Fly.io

Sikertelen teszt esetén a deploy automatikusan megszakad.

---

# TESZTELÉS

Minden modul rendelkezzen:

Unit Test

Integration Test

End-to-End Test

Legalább 80% tesztlefedettség legyen.

---

# KÓDMINŐSÉG

Használj:

ESLint

Prettier

Husky

Lint Staged

Conventional Commits

TypeScript Strict Mode

---

# GIT SZABÁLYOK

Branch stratégia:

main

develop

feature/*

bugfix/*

hotfix/*

Minden Pull Request előtt:

- Lint
- Tesztek
- Type Check

kötelező.

---

# DOKUMENTÁCIÓ

A projekt teljes dokumentációval rendelkezzen.

Készüljön:

- README
- Telepítési útmutató
- Fejlesztői dokumentáció
- API dokumentáció
- Adatbázis dokumentáció
- Jogosultsági dokumentáció
- AI dokumentáció
- Storage dokumentáció
- Deploy dokumentáció

---

# ARCHITEKTÚRA DIAGRAMOK

Készíts:

- Rendszer architektúra diagram
- Modul diagram
- Adatbázis ER diagram
- Tenant kapcsolat diagram
- AI feldolgozási folyamat
- Dokumentum életciklus diagram
- Hitelesítési folyamat
- Storage folyamat

---

# BACKUP

A rendszer támogassa:

Automatikus adatbázis mentést.

Storage mentést.

Konfiguráció mentést.

Audit mentést.

---

# DISASTER RECOVERY

Készüljön terv:

Adatbázis visszaállítás.

Storage visszaállítás.

Redis újraépítés.

Titkos kulcsok cseréje.

Rendszer helyreállítás.

---

# MONITORING

Legyen előkészítve:

Prometheus

Grafana

OpenTelemetry

Health Check

Performance Monitoring

Error Tracking

---

# TELJESÍTMÉNY

Optimalizálások:

- Lazy Loading
- Dynamic Import
- Image Optimization
- Server Components
- Caching
- Pagination
- Virtualization nagy listákhoz

---

# JÖVŐBELI BŐVÍTHETŐSÉG

A rendszer később könnyen bővíthető legyen:

- OCR
- AI adatkinyerés
- Automatikus számlaolvasás
- CMR mezőfelismerés
- Vonalkód olvasás
- QR kód olvasás
- Digitális aláírás
- eCMR támogatás
- E-mail feldolgozás
- WhatsApp dokumentum fogadás
- Telegram integráció
- REST API
- Webhook rendszer
- Külső ERP integráció
- SAP integráció
- Microsoft Dynamics integráció
- Fuvarbörze integráció

---

# FEJLESZTÉSI MÓDSZERTAN

Ne írj egyszerre nagy mennyiségű kódot.

Mindig az alábbi folyamatot kövesd:

1. Követelmények elemzése.

2. Technikai terv készítése.

3. Adatbázis tervezése.

4. API tervezése.

5. UI tervezése.

6. Implementáció.

7. Tesztelés.

8. Dokumentáció.

9. Refaktorálás.

10. Jóváhagyás.

Csak ezután kezdődhet a következő modul fejlesztése.

---

# AI FEJLESZTÉSI SZABÁLYOK

Ha új funkciót készítesz:

- először elemezd a meglévő projektet
- ne módosíts működő kódot indokolatlanul
- kövesd a meglévő architektúrát
- kerüld a duplikált kódot
- használj újrafelhasználható komponenseket
- írj típusbiztos TypeScript kódot
- dokumentáld a fontos döntéseket
- írj teszteket minden új funkcióhoz

Ha bizonytalan vagy egy követelményben, kérdezz, ne találj ki működést.

---

# VÉGSŐ CÉL

A cél egy professzionális, biztonságos, többnyelvű (HU/RO), multi-tenant SaaS dokumentumkezelő rendszer létrehozása fuvarozó vállalatok számára.

A rendszer:

- Fly.io-n fusson egyetlen alkalmazásként.
- Neon PostgreSQL adatbázist használjon.
- Gemini AI-t használjon dokumentum-helyreállításra.
- Interface alapú Storage Providerrel rendelkezzen.
- Könnyen váltható legyen Cloudflare R2-re.
- Megfeleljen a GDPR, eIDAS és releváns romániai/EU előírásoknak.
- Production-ready minőségű, jól dokumentált és hosszú távon bővíthető legyen.

Minden fejlesztési döntésnél a biztonság, a teljesítmény, az egyszerűség és a karbantarthatóság élvezzen elsőbbséget.

# 7. FEJEZET – ADATBÁZIS TERVEZÉS, PRISMA MODELL, KAPCSOLATOK ÉS INDEXELÉS

# ALAPELV

Az adatbázis legyen normalizált, könnyen bővíthető és optimalizált.

Adatbázis:

Neon PostgreSQL

ORM:

Prisma

Minden rekord UUID elsődleges kulcsot használjon.

Ne használj AUTO_INCREMENT azonosítókat.

---

# KÖZÖS MEZŐK

Szinte minden táblában szerepeljen:

id (UUID)

tenantId

createdAt

updatedAt

createdBy

updatedBy

deletedAt

deletedBy

version

Minden lekérdezés tenantId alapján szűrjön.

---

# TENANTS

Tárolja:

- cégnév
- adószám
- ország
- város
- cím
- logó
- alapértelmezett nyelv
- alapértelmezett időzóna
- AI engedélyezve
- Storage limit
- Dokumentum limit
- Aktív státusz

Kapcsolatok:

1 Tenant

↓

N User

↓

N Driver

↓

N Trip

↓

N Document

↓

N AuditLog

---

# USERS

Tárolja:

- név
- email
- telefon
- jelszó hash
- avatar
- nyelv
- időzóna
- státusz
- utolsó belépés

Kapcsolatok:

N User

↓

1 Tenant

↓

N Role

↓

N Notification

↓

N AuditLog

---

# ROLES

Tartalmazza:

Platform Owner

Platform Admin

Tenant Admin

Dispatcher

Office User

Driver

Read Only

---

# PERMISSIONS

Jogosultság lista.

Példák:

document.read

document.write

document.delete

trip.read

trip.write

user.manage

tenant.manage

audit.read

ai.execute

settings.manage

---

# USER_ROLE

Kapcsolótábla.

User

↓

Role

---

# ROLE_PERMISSION

Kapcsolótábla.

Role

↓

Permission

---

# DRIVERS

Tárolja:

- név
- telefon
- email
- sofőrkód
- jogosítvány
- ADR
- státusz

Kapcsolatok:

1 Driver

↓

N Trip

↓

N Document

---

# TRIPS

Tárolja:

- fuvarszám
- megbízás szám
- indulási hely
- érkezési hely
- indulási dátum
- érkezési dátum
- státusz

Kapcsolatok:

1 Trip

↓

N Document

↓

1 Driver

---

# DOCUMENTS

Tárolja:

- dokumentumtípus
- státusz
- AI státusz
- aktuális verzió
- eredeti fájl
- PDF fájl
- thumbnail
- preview

Kapcsolatok:

1 Document

↓

N DocumentVersion

↓

1 Trip

↓

1 Driver

↓

1 AI Job

---

# DOCUMENT_VERSION

Minden verzió külön rekord.

Például:

Version 1

Eredeti fotó

Version 2

AI javított kép

Version 3

PDF

Version 4

Későbbi OCR

Soha ne írj felül régi verziót.

---

# AI_JOB

Tárolja:

- állapot
- AI Provider
- modell
- prompt verzió
- indítás
- befejezés
- feldolgozási idő
- token használat
- hiba

Kapcsolatok:

1 AI Job

↓

1 Document

---

# STORAGE_FILE

Tárolja:

- provider
- bucket
- path
- filename
- mimeType
- méret
- checksum
- létrehozás

Ne tárolj publikus URL-t.

---

# AUDIT_LOG

Tárolja:

Tenant

Felhasználó

IP

Browser

Device

Action

Entity

EntityId

Old Value

New Value

Timestamp

Success

Error

Nem módosítható.

Nem törölhető.

---

# LOGIN_HISTORY

Tárolja:

Bejelentkezések.

IP.

Eszköz.

Böngésző.

Időpont.

Sikeres vagy sikertelen.

---

# REFRESH_TOKEN

Tárolja:

Hash-elt Refresh Token.

Lejárat.

Eszköz.

IP.

Utolsó használat.

---

# SETTINGS

Tenant beállítások.

Nyelv.

Storage.

AI.

Dokumentum szabályok.

Retention.

SMTP.

---

# NOTIFICATIONS

Tárolja:

Cím.

Üzenet.

Típus.

Olvasott.

Felhasználó.

Dátum.

---

# INDEXEK

Index minden fontos mezőre.

Különösen:

tenantId

userId

driverId

tripId

documentId

status

createdAt

updatedAt

documentType

email

---

# UNIQUE INDEXEK

Példák:

tenantId + email

tenantId + driverCode

tenantId + tripNumber

---

# FOREIGN KEY

Minden kapcsolat Foreign Key segítségével készüljön.

Cascade törlés helyett használj Soft Delete-et.

---

# SOFT DELETE

A legtöbb tábla tartalmazza:

deletedAt

deletedBy

Az adatok fizikailag ne törlődjenek.

---

# TRANZAKCIÓK

Összetett műveleteknél használj Prisma Transaction-t.

Például:

Dokumentum feltöltés.

AI Job létrehozás.

Storage mentés.

Audit írás.

Ezek egy tranzakcióban történjenek.

---

# OPTIMALIZÁLÁS

Használj:

Pagination.

Cursor Pagination.

Lazy Loading.

Index optimalizálás.

Csak szükséges mezők lekérdezése.

Ne használj SELECT * jellegű lekérdezéseket.

---

# JÖVŐBELI BŐVÍTÉS

Az adatbázis legyen felkészítve:

- OCR mezők
- AI adatkinyerés
- eCMR
- Digitális aláírás
- Workflow
- Jóváhagyási folyamatok
- ERP integráció
- API kulcs kezelés
- Webhookok
- Előfizetések
- Számlázás
- Több telephely kezelése
- Több ország támogatása

Az adatmodell legyen hosszú távon stabil, skálázható és könnyen bővíthető, anélkül hogy a meglévő táblák szerkezetét jelentősen módosítani kellene.
