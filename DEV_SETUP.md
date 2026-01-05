# Development Setup med Lokal Databas

Denna guide förklarar hur du sätter upp en dev-server med lokal databas som fungerar med Cloudflare D1.

## Översikt

- **Lokal databas**: Alla läsningar och skrivningar går till en lokal SQLite-fil
- **Isolerad utveckling**: Testa ändringar utan att påverka produktion
- **Snabb utveckling**: Ingen nätverksfördröjning till molndatabasen

## Steg 1: Skapa lokal databas

```bash
npm run db:create:local
```

Detta skapar en lokal SQLite-databas som används för allt i dev-servern.

## Steg 2: Kör migrations på lokal databas

```bash
npm run db:migrate:local
```

Detta skapar alla tabeller i din lokala databas.

## Steg 3: (Valfritt) Kopiera data från produktion

Om du vill ha produktionsdata i din lokala databas:

```bash
# Exportera data från produktion
wrangler d1 execute georgiobandera-db --remote --command "SELECT * FROM products" > products.sql

# Importera till lokal databas
wrangler d1 execute georgiobandera-db-local --local --file products.sql
```

Eller kopiera hela databasen:
```bash
# Exportera hela databasen
wrangler d1 export georgiobandera-db --remote --output backup.sql

# Importera till lokal databas
wrangler d1 execute georgiobandera-db-local --local --file backup.sql
```

## Steg 4: Starta dev-servern

```bash
npm run dev:cf
```

Detta kommer:
1. Bygga projektet med OpenNext
2. Starta Wrangler Pages dev-server
3. Ansluta till lokal databas

Dev-servern kommer köra på `http://localhost:8788`

## Hur det fungerar

### Konfiguration

I `wrangler.toml` finns en `[env.development]` sektion som konfigurerar:
- `DB`: Lokal databas (SQLite-fil i `.wrangler/state/v3/d1/`)

### Databas-klient

I `lib/db/client.ts` finns funktionen:
- `getDB()`: Returnerar databasen (lokal i dev, produktion i prod)

Alla API routes använder `getDB()` för både läsningar och skrivningar, så det fungerar direkt utan ändringar.

## Felsökning

### Databasen är tom
Om din lokala databas är tom:
1. Kör migrations: `npm run db:migrate:local`
2. (Valfritt) Kopiera data från produktion (se Steg 3 ovan)

### Migrations misslyckas
Om migrations misslyckas på lokal databas:
```bash
# Ta bort lokal databas och skapa om
rm -rf .wrangler/state/v3/d1/
npm run db:create:local
npm run db:migrate:local
```

### Dev-servern startar inte
Kontrollera att:
1. Du har byggt projektet: `npm run build:cf`
2. Wrangler är inloggad: `wrangler login`
3. Port 8788 är ledig

### Hitta lokal databas-filen
Lokal databas sparas i:
```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/
```

Du kan öppna denna SQLite-fil med t.ex. DB Browser for SQLite för att se innehållet.

## Alternativ: Vanlig Next.js dev-server

Om du inte behöver Cloudflare-kontext (D1, R2), använd den vanliga dev-servern:
```bash
npm run dev
```

Detta kör Next.js dev-server på `http://localhost:3000` men fungerar inte med D1/R2.

