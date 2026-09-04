# Custom Employee Portal with Zoho One Integration

A full-stack web application featuring built-in authentication and Role-Based Access Control (RBAC). The portal securely integrates with Zoho One APIs so employees can view and access only the Zoho applications permitted by their assigned role — without needing individual Zoho credentials.

## 🚀 Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React.js (Vite)               |
| Backend    | Node.js + Express.js          |
| Database   | MongoDB (Mongoose ODM)        |
| Auth       | JWT (JSON Web Tokens)         |
| API        | Zoho One OAuth2 Integration   |

## 📋 Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Zoho One** free trial account with API Console access
- **Git**

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory (copy from `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/employee_portal

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Zoho API
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_ACCOUNT_DOMAIN=https://accounts.zoho.com

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd custom-employee-portal
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Edit with your credentials
node src/utils/seedData.js   # Seed database
npm start
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔑 Default Credentials

After running the seed script:

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@portal.com   | Admin@123  |

## 📊 Database Schema

### Users
| Field     | Type       | Description                   |
|-----------|------------|-------------------------------|
| name      | String     | Full name                     |
| email     | String     | Unique email (login)          |
| password  | String     | Bcrypt hashed password        |
| roles     | [ObjectId] | References to Role documents  |
| isActive  | Boolean    | Account status                |

### Roles
| Field       | Type       | Description                    |
|-------------|------------|--------------------------------|
| name        | String     | Role name (Admin, HR, etc.)    |
| description | String     | Role description               |
| permissions | [ObjectId] | References to Permissions      |
| zohoApps    | [Object]   | Authorized Zoho applications   |

### Permissions
| Field    | Type   | Description                     |
|----------|--------|---------------------------------|
| name     | String | Permission identifier           |
| resource | String | Resource being protected        |
| action   | String | Allowed action (read/write/delete) |

### AuditLogs
| Field     | Type     | Description             |
|-----------|----------|-------------------------|
| userId    | ObjectId | User who performed action|
| action    | String   | Action performed         |
| resource  | String   | Affected resource        |
| details   | Mixed    | Additional context       |
| ipAddress | String   | Client IP address        |

## 🔒 RBAC - Role to Zoho App Mapping

| Role    | Zoho Application | Access Level |
|---------|-----------------|--------------|
| Admin   | All Applications | Full Access  |
| HR      | Zoho People      | Read/Write   |
| Sales   | Zoho CRM         | Read/Write   |
| Support | Zoho Desk        | Read/Write   |
| Finance | Zoho Books       | Read/Write   |

## 📡 API Endpoints

### Authentication
| Method | Endpoint             | Description          | Auth |
|--------|---------------------|----------------------|------|
| POST   | /api/auth/login     | Login user           | No   |
| POST   | /api/auth/register  | Register user        | Admin|
| POST   | /api/auth/refresh   | Refresh JWT token    | Yes  |
| GET    | /api/auth/me        | Get current user     | Yes  |

### Users (Admin Only)
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/users            | List all users       |
| GET    | /api/users/:id        | Get user by ID       |
| PUT    | /api/users/:id        | Update user          |
| DELETE | /api/users/:id        | Deactivate user      |
| PUT    | /api/users/:id/roles  | Assign roles         |

### Roles (Admin Only)
| Method | Endpoint                   | Description            |
|--------|---------------------------|------------------------|
| GET    | /api/roles                | List all roles         |
| POST   | /api/roles                | Create role            |
| PUT    | /api/roles/:id            | Update role            |
| DELETE | /api/roles/:id            | Delete role            |
| PUT    | /api/roles/:id/permissions| Assign permissions     |

### Zoho Integration
| Method | Endpoint                  | Description              | Auth |
|--------|--------------------------|--------------------------|------|
| GET    | /api/zoho/apps           | Get authorized apps      | Yes  |
| ALL    | /api/zoho/proxy/:service | Proxy to Zoho service    | Yes  |

### Audit Logs (Admin Only)
| Method | Endpoint         | Description             |
|--------|-----------------|-------------------------|
| GET    | /api/audit-logs | Get paginated audit logs|

## 📁 Project Structure

```
custom-employee-portal/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & environment
│   │   ├── controllers/     # Route handler logic
│   │   ├── middlewares/     # JWT & RBAC middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express API routes
│   │   ├── services/        # Zoho API & audit services
│   │   └── utils/           # Seed data & helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context provider
│   │   ├── pages/           # Page views
│   │   ├── services/        # API call handlers
│   │   └── App.jsx
│   └── package.json
├── commands.txt
├── README.md
└── .gitignore
```

## 🧪 Testing

```bash
# Backend
cd backend
npm start   # Verify server starts on port 5000

# Frontend
cd frontend
npm run dev   # Verify dev server on port 5173
```

## 📜 License

MIT License
