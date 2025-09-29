# Design Document: SaaS Authentication Flow Prototype

## 1. Introduction

This document outlines the technical design and architecture of the SaaS Authentication Flow prototype. The project is a full-stack application featuring a Python-based FastAPI backend, a persistent SQLite database, and a Next.js frontend. Its primary goal is to provide a robust, modular, and secure foundation for user authentication, featuring a two-step registration process and admin user management.

The system is designed for rapid prototyping, prioritizing clear logic, asynchronous operations, and standard practices, while simulating email sending for simplicity.

---

## 2. System Architecture

The application follows a classic client-server architecture.

-   **Frontend (Client)**: A Next.js single-page application (SPA) that provides the user interface for all authentication-related actions. It communicates with the backend via a RESTful API.
-   **Backend (Server)**: A FastAPI server that exposes a set of RESTful API endpoints to handle user registration, login, password management, and data access.
-   **Communication**: Communication occurs over HTTP. The frontend uses the `axios` library to make API requests to the backend. The backend is configured with CORS (Cross-Origin Resource Sharing) to specifically allow requests from the frontend's origin.
-   **State & Session Management**: The system is stateless. After a successful login, the backend issues a JSON Web Token (JWT) to the client. The frontend stores this token in `localStorage` and includes it in the `Authorization` header for all subsequent requests to protected endpoints. All backend database operations are now asynchronous.



---

## 3. Backend Design (FastAPI)

The backend is built with FastAPI, chosen for its high performance, asynchronous capabilities, automatic documentation, and dependency injection system.

### 3.1. API Endpoints

A dedicated `APIRouter` (`/auth`) groups all authentication-related endpoints.

-   `POST /auth/register`: Initiates registration by creating a temporary user record and returning a verification token.
-   `POST /auth/login`: Authenticates a user with an email and password. Returns a JWT on success.
-   `GET /auth/me`: A protected endpoint that returns the current authenticated user's profile (email, role).
-   `DELETE /auth/me`: A protected endpoint allowing a user to delete their own account.
-   `POST /auth/forgot-password`: Initiates the password reset flow. Generates a reset token and returns it.
-   `POST /auth/reset-password`: Sets a new password for a user, validating the provided reset token.
-   `POST /auth/verify-email`: Completes the registration process by validating the token and creating a permanent user record.
-   `GET /auth/admin/users`: An admin-only endpoint to retrieve a list of all registered users.
-   `DELETE /auth/admin/users/{user_email}`: An admin-only endpoint to delete a specific user.

All these endpoints are implemented as `async def` functions, leveraging FastAPI's asynchronous nature for non-blocking I/O operations, especially with the database.

### 3.2. Authentication & Authorization

-   **Password Hashing**: Passwords are never stored in plaintext. The `bcrypt` library is used to generate a strong, salted hash. This CPU-bound operation is correctly run in a separate thread pool using `fastapi.concurrency.run_in_threadpool` to prevent blocking the async event loop.
-   **JSON Web Tokens (JWT)**: The `python-jose` library manages JWTs.
    -   **Creation**: Upon successful login, a token is created containing the user's email (`sub` claim) and an expiration timestamp (`exp`).
    -   **Validation**: Protected endpoints use FastAPI's `OAuth2PasswordBearer` dependency to extract the token from the `Authorization` header. The token is then decoded and validated. If the token is invalid, expired, or the user doesn't exist, a structured error is returned.
-   **Role-Based Access Control (RBAC)**: A simple RBAC is implemented using a dependency (`require_admin`). This function first gets the current user (asynchronously from the database) and then checks their role. This is used to protect all `/admin/*` endpoints.

### 3.3. Data Persistence

Data is persistently stored in a **SQLite database** (`auth.db`). The backend interacts with this database using **SQLAlchemy's asynchronous API (`sqlalchemy.ext.asyncio`)**.
-   **`User` Model**: Stores user details including email, hashed password, verification status, and role.
-   **`PreRegistrationUser` Model**: A temporary table to hold user data during the two-step registration process. Records are deleted upon successful verification or when a user re-registers.
-   **`TokenStore` Model**: Temporarily stores tokens for password reset and email verification flows, ensuring they are persistent across server restarts.

The database connection is managed via `create_async_engine` and `AsyncSession`, allowing all database operations within the FastAPI endpoints to be non-blocking (`await db.execute(...)`, `await db.commit()`). This significantly improves the application's performance and scalability under concurrent load.

### 3.4. Error Handling

A robust, centralized error handling mechanism is implemented.
-   A custom `AuthException` class is defined to represent application-specific errors.
-   A global `@app.exception_handler(AuthException)` catches these exceptions.
-   This handler formats the error into a consistent JSON structure (`{"error": {"code": "...", "message": "..."}}`), providing clear, machine-readable error codes and human-readable messages to the frontend. This simplifies error handling on the client side.

### 3.5. Configuration

Configuration is managed via environment variables loaded from a `.env` file using `python-dotenv`. This includes:
-   `SECRET_KEY`: The secret used for signing JWTs.
-   `FRONTEND_URL`: The origin URL of the frontend, used for CORS configuration.

---

## 4. Frontend Design (Next.js)

The frontend is built with Next.js, chosen for its file-based routing, server-side rendering capabilities, and overall developer experience.

### 4.1. Component Architecture

The UI is built from a set of reusable React components.

-   **`AuthForm`**: A versatile component that handles both the Login and Register forms. It manages its own state for form inputs, loading, and errors. It accepts an `onSubmit` prop, making it a controlled component that is decoupled from the specific API logic of the page it's used on.
-   **`TokenModal`**: A modal dialog used to display simulated tokens (for email verification, password reset) to the user, facilitating the prototype's workflow without a real email client.
-   **`PasswordStrengthMeter`**: A visual component providing real-time feedback on password strength during registration, improving user experience.
-   **`ProtectedRoute`**: A higher-order component that wraps pages or layouts. It checks for the presence of a valid auth token and redirects unauthenticated users to the login page.

### 4.2. State Management

Local component state is managed primarily with React Hooks (`useState`, `useEffect`).
-   `useState` is used for managing form inputs, error messages, and loading indicators.
-   `useEffect` is used in `AuthForm` to reactively check password strength as the user types.

For a larger application, a global state management solution like React Context, Redux, or Zustand would be considered to manage the user's authentication status and profile information across the app.

### 4.3. Routing

Next.js's file-based routing is used to define the application's URL structure.
-   **Public Routes**: Pages like `/`, `/auth/login`, `/auth/register` are publicly accessible.
-   **Protected Routes**: The `/dashboard` and `/dashboard/admin` pages are wrapped with the `ProtectedRoute` component to restrict access to authenticated users only.
-   **Role-Based Redirects**: After login, the application fetches the user's role and programmatically redirects them to the appropriate dashboard (`/dashboard/admin` for admins, `/dashboard` for regular users).

### 4.4. API Interaction

-   **API Client**: A pre-configured `axios` instance is defined in `utils/api.js`. It sets the `baseURL` from an environment variable (`NEXT_PUBLIC_BACKEND_URL`) and configures `withCredentials: true` for potential future use with cookies.
-   **Auth Utilities**: Helper functions in `utils/auth.js` (`setToken`, `getToken`, `removeToken`) abstract the logic of interacting with `localStorage` for JWT management. This keeps token handling logic separate from component logic.

### 4.5. Styling

Styling is implemented using simple CSS-in-JS with inline style objects. This approach is self-contained and sufficient for a prototype. For a production application, this would likely be migrated to a more robust solution like CSS Modules, Tailwind CSS, or a dedicated CSS-in-JS library like `styled-components` or Emotion for better maintainability, theming, and performance.

---

## 5. Core Authentication Flows

### 5.1. User Registration and Verification

The application uses a secure two-step registration process:
1.  A user fills out the registration form (`/auth/register`), choosing a role.
2.  The backend creates a temporary record in the `preregistration_users` table and returns a unique verification token. **No user is created in the main `users` table at this point.**
3.  The frontend displays this token in a modal, and the user proceeds to the `/auth/verify-email` page.
4.  The user submits their email and the verification token.
5.  The backend validates the token against the `preregistration_users` table.
6.  If valid, a new record is created in the main `users` table, and the temporary record is deleted.
7.  If the token is invalid, an error is returned, and no user is created.

### 5.2. User Login

1.  User fills out the login form (`/auth/login`).
2.  On submit, `api.post('/auth/login')` is called.
3.  The backend validates credentials against the `users` table and returns a JWT.
4.  The frontend saves the JWT and immediately calls `api.get('/auth/me')` to fetch the user's role.
5.  Based on the role, the user is redirected to either `/dashboard/admin` or `/dashboard`.

### 5.3. Password Reset

1.  User enters their email on the `/auth/forgot-password` page.
2.  The backend generates a reset token, saves it to the `token_store` table, and returns it.
3.  The frontend shows the token in a modal and redirects the user to `/auth/reset-password`, passing the email in the URL query.
4.  The user enters the token and their new password.
5.  The backend validates the token, updates the user's password hash, and deletes the token from the `token_store`.

### 5.4. User Deletion

-   **Self-Deletion**: A regular user can delete their own account from their dashboard. This calls `DELETE /auth/me`, which is protected by the `get_current_user` dependency to ensure a user can only delete themselves.
-   **Admin Deletion**: An admin can delete other users from the admin dashboard. This calls `DELETE /auth/admin/users/{user_email}`, which is protected by the `require_admin` dependency. An admin cannot delete their own account via this endpoint.

---

## 6. Security Considerations

-   **JWT Security**: The JWT is signed with a strong, secret key (`HS256` algorithm) stored securely as an environment variable on the backend. The token has a short expiration time (30 minutes) to limit the window of opportunity if it is compromised.
-   **Password Security**: `bcrypt` is used for hashing. The hashing operation is run in a separate thread pool to prevent blocking the server's event loop.
-   **Two-Step Registration**: Users are only added to the primary `users` table after email verification, preventing database pollution with unverified accounts.
-   **CORS**: The backend is configured to only accept requests from the specified frontend URL, preventing other websites from making requests to the API on behalf of a user.
-   **Data Transfer**: While not explicitly configured in the prototype, a production deployment would run over HTTPS to encrypt all data in transit between the client and server.

---

## 7. Design Trade-offs & Future Improvements

-   **SQLite Database**: While persistent and suitable for this prototype, a production environment would benefit from migrating to a more robust client-server database like PostgreSQL or MySQL.
-   **Simulated Emails**: Chosen to avoid email service setup. The next step is to integrate a service like SendGrid or Mailgun to send real emails for verification and password resets.
-   **State Management**: Local state is sufficient for the prototype. For more complex applications, implementing a global state management solution (React Context or Redux) would be beneficial.
-   **Refresh Tokens**: The current implementation uses short-lived access tokens. A more advanced implementation would include a refresh token flow to allow users to stay logged in for longer periods without compromising security.