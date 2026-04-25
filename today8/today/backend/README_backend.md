# Complete Forms Backend API (BGMI + Marathon + Sports Registrations) ✅

## Prerequisites
- PHP 7.4+ with PDO MySQL extension  
- MySQL 5.7+

## 1. Database Setup
1. Update `db_config.php` credentials.
2. ```bash
mysql -u root -p sports_fest < backend/create_table.sql
```

## 2. Start Backend
```bash
cd backend && php -S localhost:8000
```

## 3. Endpoints (All Standardized)
| Form | Proxy | Direct | Features |
|------|--------|---------|----------|
| BGMI | `/api/bgmi_register.php` | `localhost:8000/bgmi_register.php` | PDO, duplicate email check, phone validation, JSON teams |
| Marathon | `/api/marathon_register.php` | `localhost:8000/marathon_register.php` | PDO, duplicate email, phone/category validation |
| **Sports (Registration)** | `/api/sports_register.php` | `localhost:8000/sports_register.php` | PDO, duplicate (email+sport), JSON player_names, gender enum |

**Vite proxy**: `/api` → `localhost:8000` ✅

## 4. Test (curl)
```bash
curl -X POST http://localhost:8000/sports_register.php \\
-F \"college_name=Test College\" \\
-F \"email=test@example.com\" \\
-F \"phone=9876543210\" \\
-F \"gender=male\" \\
-F \"sport=volleyball\" \\
-F \"player_names=[\\\"John\\\",\\\"Jane\\\"]\" \\
-F \"address=123 St\"
```

## 5. Frontend Test
1. Backend: `php -S localhost:8000` (backend/)
2. Frontend: `npm run dev`
3. Submit forms → verify DB

## Features Added
- ✅ **PDO consistent** (all files)
- ✅ **Duplicate prevention** (email-based, sport-specific for sports)
- ✅ **Input validation** (email/phone/category/gender)
- ✅ **JSON handling** (teams/players)
- ✅ **CORS** headers
- ✅ **Phone normalization**
- ✅ **Error JSON responses**

## Troubleshooting
- DB failed? Check `db_config.php`
- No inserts? Run backend server first
- Duplicates blocked? Intentional security feature
