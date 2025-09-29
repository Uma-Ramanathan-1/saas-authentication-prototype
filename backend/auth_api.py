# auth_api.py
from fastapi import FastAPI, APIRouter, Depends, status, concurrency
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt, enum
from uuid import uuid4
import os
from dotenv import load_dotenv

from database import SessionLocal, engine, create_db_and_tables, User as UserModel, TokenStore as TokenStoreModel, PreRegistrationUser as PreRegUserModel

load_dotenv() # Load environment variables from .env file

app = FastAPI()

# Read the frontend URL from environment variables, with a fallback.
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:4000")

# Create database tables on startup
@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

# Enable CORS for your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,  # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# --- Improved Error Handling: Models and Handlers ---

class ErrorDetail(BaseModel):
    code: str
    message: str

class AuthException(Exception):
    """Custom exception to be caught by the exception handler."""
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message

@app.exception_handler(AuthException)
async def auth_exception_handler(request, exc: AuthException):
    """Handles custom authentication errors and returns a structured response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )

# --- End of Error Handling Setup ---

# --- Create a router for auth endpoints ---
auth_router = APIRouter(prefix="/auth")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Database Dependency ---
async def get_db() -> AsyncSession:
    async with SessionLocal() as db:
        yield db

SECRET_KEY = os.getenv("SECRET_KEY", "a-secure-default-secret-key-for-development")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

class User(BaseModel):
    email: EmailStr
    password: str
    role: 'UserRole' = 'user'

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"

class Token(BaseModel):
    access_token: str
    token_type: str

class VerificationData(BaseModel):
    email: EmailStr
    token: str

class ResetPasswordData(BaseModel):
    email: EmailStr
    token: str
    newPassword: str

class ForgotPasswordData(BaseModel):
    email: EmailStr

async def verify_password(plain_password, hashed_password):
    # bcrypt expects bytes, so we encode the strings.
    return await concurrency.run_in_threadpool(bcrypt.checkpw, plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_password_hash(password):
    # Hash the password and return it as a string.
    return (await concurrency.run_in_threadpool(bcrypt.hashpw, password.encode('utf-8'), bcrypt.gensalt())).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise AuthException(status.HTTP_401_UNAUTHORIZED, "INVALID_TOKEN", "Invalid token.")
        result = await db.execute(select(UserModel).filter(UserModel.email == email))
        user = result.scalars().first()
        if not user:
            raise AuthException(status.HTTP_401_UNAUTHORIZED, "USER_NOT_FOUND", "User not found.")
        return user
    except JWTError:
        raise AuthException(status.HTTP_401_UNAUTHORIZED, "INVALID_TOKEN", "Invalid token.")

@auth_router.post("/register")
async def register(user: User, db: AsyncSession = Depends(get_db)):
    # Check if user is already fully registered
    result = await db.execute(select(UserModel).filter(UserModel.email == user.email))
    db_user = result.scalars().first()
    if db_user:
        raise AuthException(status.HTTP_400_BAD_REQUEST, "USER_EXISTS", "A user with this email already exists.")
    
    # Check for pending registration and delete it to allow re-registration
    prereg_result = await db.execute(select(PreRegUserModel).filter(PreRegUserModel.email == user.email))
    existing_prereg = prereg_result.scalars().first()
    if existing_prereg:
        await db.delete(existing_prereg)
        await db.flush()  # Immediately execute the delete statement

    hashed_password = await get_password_hash(user.password)
    token = str(uuid4())
    
    new_prereg_user = PreRegUserModel(
        email=user.email, 
        hashed_password=hashed_password, 
        role=user.role,
        verification_token=token
    )
    db.add(new_prereg_user)
    
    await db.commit()
    return {"msg": f"User registered. Verification token sent: {token}"}

@auth_router.post("/login", response_model=Token)
async def login(user_credentials: User, db: AsyncSession = Depends(get_db)):
    # Note: We only check the main users table for login
    result = await db.execute(select(UserModel).filter(UserModel.email == user_credentials.email))
    db_user = result.scalars().first()
    if not db_user or not await verify_password(user_credentials.password, db_user.hashed_password):
        raise AuthException(status.HTTP_401_UNAUTHORIZED, "INVALID_CREDENTIALS", "Incorrect email or password.")
    token = create_access_token({"sub": user_credentials.email})
    return {"access_token": token, "token_type": "bearer"}

@auth_router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_me(current_user: UserModel = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Allows an authenticated user to delete their own account."""
    # Also delete any outstanding tokens for this user
    token_result = await db.execute(select(TokenStoreModel).filter(TokenStoreModel.email == current_user.email))
    for token in token_result.scalars().all():
        await db.delete(token)

    await db.delete(current_user)
    await db.commit()

    return {"msg": "Account deleted successfully."}

@auth_router.get("/me")
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """Gets the profile of the currently authenticated user."""
    return {"email": current_user.email, "role": current_user.role}

@auth_router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordData, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).filter(UserModel.email == data.email))
    user = result.scalars().first()
    if not user:
        raise AuthException(status.HTTP_404_NOT_FOUND, "EMAIL_NOT_FOUND", "No user found with this email address.")
    token = str(uuid4())
    new_token = TokenStoreModel(email=data.email, token=token, token_type="reset")
    db.add(new_token)
    await db.commit()
    return {"msg": f"Reset link sent with token: {token}"}

@auth_router.post("/reset-password")
async def reset_password(data: ResetPasswordData, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TokenStoreModel).filter(TokenStoreModel.email == data.email, TokenStoreModel.token == data.token, TokenStoreModel.token_type == "reset"))
    token_entry = result.scalars().first()
    if not token_entry:
        raise AuthException(status.HTTP_400_BAD_REQUEST, "INVALID_RESET_TOKEN", "The password reset token is invalid or has expired.")
    
    user_result = await db.execute(select(UserModel).filter(UserModel.email == data.email))
    user = user_result.scalars().first()
    user.hashed_password = await get_password_hash(data.newPassword)
    await db.delete(token_entry)
    await db.commit()
    return {"msg": "Password updated"}

@auth_router.post("/verify-email-request")
async def request_verification(email: EmailStr, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).filter(UserModel.email == email))
    user = result.scalars().first()
    if not user:
        raise AuthException(status.HTTP_404_NOT_FOUND, "EMAIL_NOT_FOUND", "No user found with this email address.")
    token = str(uuid4())
    new_token = TokenStoreModel(email=email, token=token, token_type="verification")
    db.add(new_token)
    await db.commit()
    return {"msg": f"Verification token sent: {token}"}

@auth_router.post("/verify-email")
async def verify_email(data: VerificationData, db: AsyncSession = Depends(get_db)):
    # Find the pre-registration entry
    prereg_result = await db.execute(
        select(PreRegUserModel).filter(
            PreRegUserModel.email == data.email, 
            PreRegUserModel.verification_token == data.token
        )
    )
    prereg_user = prereg_result.scalars().first()

    if not prereg_user or prereg_user.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AuthException(status.HTTP_400_BAD_REQUEST, "INVALID_VERIFICATION_TOKEN", "The email verification token is invalid or has expired.")
    
    # Create the final user in the main users table
    new_user = UserModel(
        email=prereg_user.email,
        hashed_password=prereg_user.hashed_password,
        role=prereg_user.role,
        is_verified=True
    )
    db.add(new_user)
    await db.delete(prereg_user) # Clean up the pre-registration entry
    await db.commit()
    return {"msg": "Email verified"}
    
# Role-based Access

async def require_admin(current_user: UserModel = Depends(get_current_user)):
    if current_user.role != "admin":
        raise AuthException(status.HTTP_403_FORBIDDEN, "ADMIN_ACCESS_REQUIRED", "You do not have permission to access this resource.")
    return current_user

@auth_router.get("/admin/dashboard")
async def admin_dashboard(current_user: UserModel = Depends(require_admin)):
    return {"msg": f"Welcome, admin {current_user.email}"}

@auth_router.get("/admin/users")
async def get_all_users(current_user: UserModel = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Admin-only endpoint to get a list of all users."""
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return [{"email": user.email, "role": user.role, "is_verified": user.is_verified} for user in users]

@auth_router.delete("/admin/users/{user_email}")
async def delete_user_by_admin(user_email: EmailStr, current_user: UserModel = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Admin-only endpoint to delete a user."""
    if current_user.email == user_email:
        raise AuthException(status.HTTP_400_BAD_REQUEST, "CANNOT_DELETE_SELF", "Admin cannot delete their own account via this endpoint.")
    
    result = await db.execute(select(UserModel).filter(UserModel.email == user_email))
    user_to_delete = result.scalars().first()

    if not user_to_delete:
        raise AuthException(status.HTTP_404_NOT_FOUND, "USER_NOT_FOUND", "User not found.")

    await db.delete(user_to_delete)
    await db.commit()
    return {"msg": f"User {user_email} deleted successfully."}

# Include the router in the main FastAPI app
app.include_router(auth_router)