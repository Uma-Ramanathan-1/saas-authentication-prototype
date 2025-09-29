# 🔐 SaaS Authentication Flow – Rapid Prototype

A modular, full-stack user authentication system for SaaS applications, designed for rapid prototyping. Built with a FastAPI backend and a Next.js frontend, this project provides a solid foundation for user management.

It includes user registration, JWT-based login, a simulated email verification flow, a complete password reset process, and role-based access control.

**Note:** Email sending for verification and password resets is simulated. The API returns the necessary tokens in the response, allowing you to copy them directly for testing the UI flow without a mail server.

---

## 🚀 Features

- ✅ **Two-Step User Registration:** Secure registration flow where users are only created after email verification.
- ✅ **JWT-Based Login:** Secure, token-based authentication.
- 🔁 **Password Reset:** A complete, token-based password reset flow.
- ✉️ **Email Verification:** Simulated email verification process with token handling.
- 🛡️ **Role-Based Access Control:** Differentiates between `admin` and `user` roles to manage access.
- 👤 **User Self-Service:** Users can delete their own accounts from their dashboard.
- 🛠️ **Admin User Management:** Admins can view and delete user accounts from a dedicated dashboard.
- 🔒 **Protected Routes:** Frontend route protection based on user authentication status.
- 💪 **Password Strength Meter:** Visual feedback for users during registration.

---

## 🧱 Tech Stack

| Layer          | Technology                               |
|----------------|----------------------------------------------------------|
| **Backend**    | FastAPI (Python)                                         |
| **Frontend**   | Next.js (React)                                          |
| **Database**   | SQLite with SQLAlchemy (asynchronous)                    |
| **Auth**       | JWT (`python-jose`) & `bcrypt`                           |
| **Styling**    | CSS-in-JS (Inline Style Objects) & Basic CSS             |

---

## 📦 Project Structure

```
saas-auth-prototype/
├── backend/
│   └── auth_api.py       # FastAPI application with all auth endpoints
└── frontend/
    ├── components/
    │   ├── AuthForm.js         # Reusable form for Login/Register
    │   ├── ResetForm.js        # Form for resetting the password
    │   ├── VerifyForm.js       # Form for email verification
    │   ├── TokenModal.js       # Modal to display simulated tokens
    │   └── ...
    ├── pages/
    │   ├── auth/
    │   │   ├── login.js
    │   │   ├── register.js
    │   │   ├── forgot-password.js
    │   │   ├── reset-password.js
    │   │   └── verify-email.js
    │   └── dashboard/
    │       └── ...
    ├── utils/
    │   ├── api.js            # Axios instance pre-configured for the backend
    │   └── auth.js           # Helpers for handling JWT in localStorage
    └── .env.local            # Frontend environment variables
```

---

## 🧪 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/saas-auth-prototype.git
cd saas-auth-prototype
```

### 2. Backend Setup (FastAPI)

First, navigate to the backend directory and create a `.env` file for environment variables.

```bash
cd backend
touch .env
```

Add the following to your `.env` file. The `SECRET_KEY` is critical for signing JWTs. **Generate a new, strong key** using one of the commands below and replace the placeholder.

It's recommended to copy `backend/.env.example` to `.env` and then fill in the values.
```env
# backend/.env
FRONTEND_URL="http://localhost:4000"
SECRET_KEY="your-super-strong-and-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
```

**Generate a `SECRET_KEY`:**
```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

Now, install the dependencies and run the server:

```bash
# Ensure all dependencies are installed
pip install "fastapi[all]" python-jose[cryptography] bcrypt python-dotenv sqlalchemy aiosqlite

# Run the server using the python -m uvicorn command
python -m uvicorn auth_api:app --reload
```

The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup (Next.js)

In a new terminal, navigate to the frontend directory and create a `.env.local` file.

```bash
cd frontend
touch .env.local
```

Copy .env.example to .env.local and then replace the placeholder values with their actual settings.
Add the backend URL to your `.env.local` file:
```env
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

Install the dependencies and run the development server on port `4000`:

```bash
npm install
npm run dev -- -p 4000
```

Open your browser and navigate to `http://localhost:4000/auth/login` to get started!
