# Mangalore Inter-College Sports Fest 2026

## Frontend (Vite + React + TypeScript + shadcn/ui)
```bash
npm install
npm run dev  # http://localhost:8080
```

## BGMI Registration Backend (PHP + MySQL)
1. Update `backend/db_config.php` with DB credentials.
2. Run `backend/create_table.sql` in MySQL.
3. Start backend: `cd backend && php -S localhost:8000`
4. Frontend proxies `/api/*` to backend automatically.

## Features
- BGMI Championship registration form with all required fields.
- Real DB submission via PHP.
- Responsive design with animations.
- Prize info, tournament roadmap.

## Testing BGMI Registration
1. Start frontend (`npm run dev`)
2. Fill form in `/bgmi#register`
3. Submit → Data saves to `bgmi_registrations` table.

**Note:** Update DB config before testing. Entry fee ₹1000/squad (recorded).
