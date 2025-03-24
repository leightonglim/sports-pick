# main.py
import asyncio
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import databases
import sqlalchemy
import jwt
import bcrypt
import uuid
import httpx
import os
# from apscheduler.schedulers.background import BackgroundScheduler
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from dotenv import load_dotenv
import uvicorn
import requests
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/sports_pickem")
database = databases.Database(DATABASE_URL)

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email settings
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@sportspickem.com")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    # scheduler.start()
    yield
    await database.disconnect()
    # scheduler.shutdown()
    
# FastAPI app
app = FastAPI(title="Sports Pick'em API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class LeagueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tiebreaker_enabled: bool = False
    sports: List[int] = []

class LeagueJoin(BaseModel):
    invite_code: str

class LeagueSportUpdate(BaseModel):
    sports: List[int]

class PickCreate(BaseModel):
    game_id: int
    league_id: int
    picked_team: str

class GameSync(BaseModel):
    sport_id: int
    season: str
    week: int

class StandingsCalculate(BaseModel):
    league_id: int
    sport_id: int
    season: str
    week: int

# Database connection
metadata = sqlalchemy.MetaData()

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String(50), unique=True),
    sqlalchemy.Column("email", sqlalchemy.String(100), unique=True),
    sqlalchemy.Column("password_hash", sqlalchemy.String(255)),
    sqlalchemy.Column("display_name", sqlalchemy.String(100)),
    sqlalchemy.Column("avatar_url", sqlalchemy.String(255)),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, default=datetime.utcnow)
)

leagues = sqlalchemy.Table(
    "leagues",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String(100)),
    sqlalchemy.Column("description", sqlalchemy.Text),
    sqlalchemy.Column("created_by", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("tiebreaker_enabled", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("invite_code", sqlalchemy.String(20), unique=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, default=datetime.utcnow)
)

sports = sqlalchemy.Table(
    "sports",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String(50)),
    sqlalchemy.Column("espn_id", sqlalchemy.Integer, unique=True),
    sqlalchemy.Column("current_season", sqlalchemy.String(20)),
    sqlalchemy.Column("current_week", sqlalchemy.Integer),
    sqlalchemy.Column("link", sqlalchemy.Text),
    sqlalchemy.Column("display_name", sqlalchemy.Text)
)

league_sports = sqlalchemy.Table(
    "league_sports",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("league_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("leagues.id", ondelete="CASCADE")),
    sqlalchemy.Column("sport_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("sports.id", ondelete="CASCADE")),
    sqlalchemy.Column("active", sqlalchemy.Boolean, default=True)
)

league_members = sqlalchemy.Table(
    "league_members",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("league_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("leagues.id", ondelete="CASCADE")),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id", ondelete="CASCADE")),
    sqlalchemy.Column("is_admin", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("joined_at", sqlalchemy.DateTime, default=datetime.utcnow)
)

games = sqlalchemy.Table(
    "games",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("sport_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("sports.id")),
    sqlalchemy.Column("espn_game_id", sqlalchemy.String(50), unique=True),
    sqlalchemy.Column("home_team", sqlalchemy.String(100)),
    sqlalchemy.Column("away_team", sqlalchemy.String(100)),
    sqlalchemy.Column("home_team_score", sqlalchemy.Integer),
    sqlalchemy.Column("away_team_score", sqlalchemy.Integer),
    sqlalchemy.Column("spread", sqlalchemy.Float),
    sqlalchemy.Column("favorite", sqlalchemy.String(100)),
    sqlalchemy.Column("game_time", sqlalchemy.DateTime),
    sqlalchemy.Column("venue", sqlalchemy.String(100)),
    sqlalchemy.Column("season", sqlalchemy.String(20)),
    sqlalchemy.Column("week", sqlalchemy.Integer),
    sqlalchemy.Column("status", sqlalchemy.String(20), default="scheduled"),
    sqlalchemy.Column("last_updated", sqlalchemy.DateTime, default=datetime.utcnow)
)

picks = sqlalchemy.Table(
    "picks",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("game_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("games.id")),
    sqlalchemy.Column("league_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("leagues.id")),
    sqlalchemy.Column("picked_team", sqlalchemy.String(100)),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, default=datetime.utcnow)
)

league_standings = sqlalchemy.Table(
    "league_standings",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("league_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("leagues.id")),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("sport_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("sports.id")),
    sqlalchemy.Column("season", sqlalchemy.String(20)),
    sqlalchemy.Column("week", sqlalchemy.Integer),
    sqlalchemy.Column("wins", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("losses", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("ties", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("points", sqlalchemy.Float, default=0)
)

email_notifications = sqlalchemy.Table(
    "email_notifications",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("notification_type", sqlalchemy.String(50)),
    sqlalchemy.Column("processed", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("scheduled_for", sqlalchemy.DateTime),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow)
)

# Helper functions
async def get_user_by_username(username: str):
    query = users.select().where(users.c.username == username)
    return await database.fetch_one(query)

async def get_user_by_id(user_id: int):
    query = users.select().where(users.c.id == user_id)
    return await database.fetch_one(query)

async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed.decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = await get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return user

async def is_league_admin(league_id: int, user_id: int):
    query = league_members.select().where(
        (league_members.c.league_id == league_id) & 
        (league_members.c.user_id == user_id) & 
        (league_members.c.is_admin == True)
    )
    result = await database.fetch_one(query)
    return bool(result)

async def is_league_member(league_id: int, user_id: int):
    query = league_members.select().where(
        (league_members.c.league_id == league_id) & 
        (league_members.c.user_id == user_id)
    )
    result = await database.fetch_one(query)
    return bool(result)

async def send_email(to_email: str, subject: str, html_content: str):
    message = MIMEMultipart()
    message["From"] = EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_content, "html"))
    
    try:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.sendmail(EMAIL_FROM, to_email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# Scheduled tasks
async def process_email_notifications():
    # Get pending notifications
    query = """
    SELECT n.id, n.notification_type, u.email, u.username
    FROM email_notifications n
    JOIN users u ON n.user_id = u.id
    WHERE n.processed = false AND n.scheduled_for <= :now
    """
    notifications = await database.fetch_all(query=query, values={"now": datetime.utcnow()})
    
    for notification in notifications:
        # Process different notification types
        if notification["notification_type"] == "REMIND_PICKS":
            # Get leagues and sports for user
            user_leagues_query = """
            SELECT l.id, l.name, s.id as sport_id, s.name as sport_name, s.current_week
            FROM league_members lm
            JOIN leagues l ON lm.league_id = l.id
            JOIN league_sports ls ON l.id = ls.league_id
            JOIN sports s ON ls.sport_id = s.id
            WHERE lm.user_id = :user_id AND ls.active = true
            """
            user_id = await database.fetch_val(
                "SELECT user_id FROM email_notifications WHERE id = :id",
                values={"id": notification["id"]}
            )
            
            leagues_data = await database.fetch_all(
                user_leagues_query,
                values={"user_id": user_id}
            )
            
            # Check if user has pending picks
            pending_picks = False
            for league in leagues_data:
                # Check if user has picks for current week
                picks_count = await database.fetch_val(
                    """
                    SELECT COUNT(*) FROM picks p
                    JOIN games g ON p.game_id = g.id
                    WHERE p.user_id = :user_id
                    AND p.league_id = :league_id
                    AND g.sport_id = :sport_id
                    AND g.season = :season
                    AND g.week = :week
                    """,
                    values={
                        "user_id": user_id,
                        "league_id": league["id"],
                        "sport_id": league["sport_id"],
                        "season": await database.fetch_val(
                            "SELECT current_season FROM sports WHERE id = :id",
                            values={"id": league["sport_id"]}
                        ),
                        "week": league["current_week"]
                    }
                )
                
                games_count = await database.fetch_val(
                    """
                    SELECT COUNT(*) FROM games
                    WHERE sport_id = :sport_id
                    AND season = :season
                    AND week = :week
                    AND game_time > :now
                    """,
                    values={
                        "sport_id": league["sport_id"],
                        "season": await database.fetch_val(
                            "SELECT current_season FROM sports WHERE id = :id",
                            values={"id": league["sport_id"]}
                        ),
                        "week": league["current_week"],
                        "now": datetime.utcnow()
                    }
                )
                
                if picks_count < games_count:
                    pending_picks = True
                    break
            
            if pending_picks:
                subject = "Reminder: Make your picks for this week!"
                content = f"""
                <html>
                <body>
                    <h2>Hello {notification['username']}!</h2>
                    <p>This is a friendly reminder that you have upcoming games to make picks for.</p>
                    <p>Make sure to log in and make your picks before the games start!</p>
                    <p><a href="https://yourpickemapp.com/picks">Click here to make your picks</a></p>
                </body>
                </html>
                """
                await send_email(notification["email"], subject, content)
        
        elif notification["notification_type"] == "GAME_UPDATED":
            # Get affected games for user
            user_id = await database.fetch_val(
                "SELECT user_id FROM email_notifications WHERE id = :id",
                values={"id": notification["id"]}
            )
            
            # Find games that have been updated and user has picked
            updated_games_query = """
            SELECT g.id, g.home_team, g.away_team, g.game_time, g.venue,
                   p.picked_team, l.name as league_name
            FROM picks p
            JOIN games g ON p.game_id = g.id
            JOIN leagues l ON p.league_id = l.id
            WHERE p.user_id = :user_id
            AND g.game_time > :now
            AND g.last_updated > p.updated_at
            """
            
            updated_games = await database.fetch_all(
                updated_games_query,
                values={"user_id": user_id, "now": datetime.utcnow()}
            )
            
            if updated_games:
                games_html = ""
                for game in updated_games:
                    games_html += f"""
                    <tr>
                        <td>{game['away_team']} @ {game['home_team']}</td>
                        <td>{game['game_time'].strftime('%Y-%m-%d %H:%M')}</td>
                        <td>{game['venue']}</td>
                        <td>{game['picked_team']}</td>
                        <td>{game['league_name']}</td>
                    </tr>
                    """
                
                subject = "Game Updates Affecting Your Picks"
                content = f"""
                <html>
                <body>
                    <h2>Hello {notification['username']}!</h2>
                    <p>We wanted to let you know that some games you have picks for have been updated.</p>
                    <p>You may want to review your picks:</p>
                    <table border="1" cellpadding="5">
                        <tr>
                            <th>Game</th>
                            <th>New Time</th>
                            <th>New Venue</th>
                            <th>Your Pick</th>
                            <th>League</th>
                        </tr>
                        {games_html}
                    </table>
                    <p><a href="https://yourpickemapp.com/picks">Click here to review your picks</a></p>
                </body>
                </html>
                """
                await send_email(notification["email"], subject, content)
        
        # Mark notification as processed
        await database.execute(
            "UPDATE email_notifications SET processed = true WHERE id = :id",
            values={"id": notification["id"]}
        )

async def schedule_pick_reminders():
    # Get list of sports and their current weeks
    sports_data = await database.fetch_all("SELECT id, current_season, current_week FROM sports")
    
    for sport in sports_data:
        # Find next game time for each sport's current week
        next_game_time = await database.fetch_val(
            """
            SELECT MIN(game_time) FROM games
            WHERE sport_id = :sport_id
            AND season = :season
            AND week = :week
            AND game_time > :now
            """,
            values={
                "sport_id": sport["id"],
                "season": sport["current_season"],
                "week": sport["current_week"],
                "now": datetime.utcnow()
            }
        )
        
        if next_game_time:
            # Calculate reminder time (24 hours before first game)
            reminder_time = next_game_time - timedelta(hours=24)
            
            if reminder_time > datetime.utcnow():
                # Get users in leagues that include this sport
                users_query = """
                SELECT DISTINCT u.id
                FROM users u
                JOIN league_members lm ON u.id = lm.user_id
                JOIN league_sports ls ON lm.league_id = ls.league_id
                WHERE ls.sport_id = :sport_id
                AND ls.active = true
                """
                
                users = await database.fetch_all(users_query, values={"sport_id": sport["id"]})
                
                # Schedule reminders for these users
                for user in users:
                    # Check if reminder already exists
                    existing_reminder = await database.fetch_one(
                        """
                        SELECT id FROM email_notifications
                        WHERE user_id = :user_id
                        AND notification_type = 'REMIND_PICKS'
                        AND scheduled_for BETWEEN :start AND :end
                        """,
                        values={
                            "user_id": user["id"],
                            "start": reminder_time - timedelta(hours=1),
                            "end": reminder_time + timedelta(hours=1)
                        }
                    )
                    
                    if not existing_reminder:
                        await database.execute(
                            """
                            INSERT INTO email_notifications 
                            (user_id, notification_type, scheduled_for)
                            VALUES (:user_id, 'REMIND_PICKS', :scheduled_for)
                            """,
                            values={
                                "user_id": user["id"],
                                "scheduled_for": reminder_time
                            }
                        )

# Initialize scheduler
# scheduler = BackgroundScheduler()
# scheduler.add_job(lambda: asyncio.run(process_email_notifications()), 'interval', minutes=10)
# scheduler.add_job(lambda: asyncio.run(schedule_pick_reminders()), 'interval', hours=6)

# Authentication endpoints
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    # Check if username or email already exists
    existing_user = await database.fetch_one(
        "SELECT * FROM users WHERE username = :username OR email = :email",
        values={"username": user.username, "email": user.email}
    )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    hashed_password = hash_password(user.password)
    display_name = user.display_name or user.username
    
    query = users.insert().values(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        display_name=display_name
    )
    
    user_id = await database.execute(query)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": user_id,
            "username": user.username,
            "email": user.email,
            "display_name": display_name
        }
    }

@app.put("/api/users")
async def update_user(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_values = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_values:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_values["updated_at"] = datetime.utcnow()
    
    query = users.update().where(users.c.id == current_user["id"]).values(**update_values)
    await database.execute(query)
    
    # Get updated user
    updated_user = await get_user_by_id(current_user["id"])
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": updated_user["id"],
            "username": updated_user["username"],
            "email": updated_user["email"],
            "display_name": updated_user["display_name"],
            "avatar_url": updated_user["avatar_url"]
        }
    }

@app.post("/auth/login")
async def login(user_login: UserLogin):
    user = await authenticate_user(user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "display_name": user["display_name"],
            "avatar_url": user["avatar_url"]
        }
    }

# League endpoints
@app.post("/api/leagues", status_code=status.HTTP_201_CREATED)
async def create_league(league: LeagueCreate, current_user: dict = Depends(get_current_user)):
    # Generate invite code
    invite_code = str(uuid.uuid4())[:8]
    
    async with database.transaction():
        # Create league
        query = leagues.insert().values(
            name=league.name,
            description=league.description,
            created_by=current_user["id"],
            tiebreaker_enabled=league.tiebreaker_enabled,
            invite_code=invite_code
        )
        
        league_id = await database.execute(query)
        
        # Add creator as admin
        member_query = league_members.insert().values(
            league_id=league_id,
            user_id=current_user["id"],
            is_admin=True
        )
        
        await database.execute(member_query)
        
        # Add sports to league
        if league.sports:
            for sport_id in league.sports:
                sport_query = league_sports.insert().values(
                    league_id=league_id,
                    sport_id=sport_id
                )
                await database.execute(sport_query)
    
    # Get created league
    created_league = await database.fetch_one(
        "SELECT * FROM leagues WHERE id = :id",
        values={"id": league_id}
    )
    
    return {
        "message": "League created successfully",
        "league": {
            **created_league,
            "sports": league.sports
        }
    }

@app.post("/api/leagues/join")
async def join_league(league_join: LeagueJoin, current_user: dict = Depends(get_current_user)):
    # Find league by invite code
    league = await database.fetch_one(
        "SELECT * FROM leagues WHERE invite_code = :invite_code",
        values={"invite_code": league_join.invite_code}
    )
    
    if not league:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found"
        )
    
    # Check if user is already a member
    existing_member = await database.fetch_one(
        "SELECT * FROM league_members WHERE league_id = :league_id AND user_id = :user_id",
        values={"league_id": league["id"], "user_id": current_user["id"]}
    )
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this league"
        )
    
    # Add user to league
    query = league_members.insert().values(
        league_id=league["id"],
        user_id=current_user["id"],
        is_admin=False
    )
    
    await database.execute(query)
    
    return {
        "message": "Successfully joined league",
        "league": league
    }

@app.post("/api/leagues/{league_id}/leave")
async def leave_league(league_id: int, current_user: dict = Depends(get_current_user)):
    # Check if user is a member
    member = await database.fetch_one(
        "SELECT * FROM league_members WHERE league_id = :league_id AND user_id = :user_id",
        values={"league_id": league_id, "user_id": current_user["id"]}
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this league"
        )
    
    # Check if user is the only admin
    if member["is_admin"]:
        admin_count = await database.fetch_val(
            "SELECT COUNT(*) FROM league_members WHERE league_id = :league_id AND is_admin = true",
            values={"league_id": league_id}
        )
        
        if admin_count == 1:
            member_count = await database.fetch_val(
                "SELECT COUNT(*) FROM league_members WHERE league_id = :league_id",
                values={"league_id": league_id}
            )
            
            if member_count > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot leave league as the only admin. Please assign another admin first."
                )
    
    # Remove user from league
    await database.execute(
        "DELETE FROM league_members WHERE league_id = :league_id AND user_id = :user_id",
        values={"league_id": league_id, "user_id": current_user["id"]}
    )
    
    return {
        "message": "Successfully left league",
        "league_id": league_id
    }

# Additional FastAPI endpoints for the Sports Pick'em app

@app.get("/api/leagues")
async def get_user_leagues(current_user: dict = Depends(get_current_user)):
    """Get all leagues for the current user"""
    query = """
    SELECT l.*, 
           (lm.is_admin) as is_admin,
           (SELECT COUNT(*) FROM league_members WHERE league_id = l.id) as member_count
    FROM leagues l
    JOIN league_members lm ON l.id = lm.league_id
    WHERE lm.user_id = :user_id
    ORDER BY l.created_at DESC
    """
    
    user_leagues = await database.fetch_all(query, values={"user_id": current_user["id"]})
    
    result = []
    for league in user_leagues:
        # Get sports for this league
        sports_query = """
        SELECT s.id, s.name 
        FROM sports s
        JOIN league_sports ls ON s.id = ls.sport_id
        WHERE ls.league_id = :league_id AND ls.active = true
        """
        league_sports = await database.fetch_all(
            sports_query, 
            values={"league_id": league["id"]}
        )
        
        league_dict = dict(league)
        league_dict["sports"] = [dict(sport) for sport in league_sports]
        result.append(league_dict)
    
    return {"leagues": result}

@app.get("/api/leagues/{league_id}")
async def get_league_details(league_id: int, current_user: dict = Depends(get_current_user)):
    """Get detailed information about a specific league"""
    # Check if user is a member
    is_member = await is_league_member(league_id, current_user["id"])
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this league"
        )
    
    # Get league details
    league_query = """
    SELECT l.*, u.username as creator_name
    FROM leagues l
    JOIN users u ON l.created_by = u.id
    WHERE l.id = :league_id
    """
    league = await database.fetch_one(league_query, values={"league_id": league_id})
    if not league:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found"
        )
    
    league_dict = dict(league)
    
    # Get members
    members_query = """
    SELECT u.id, u.username, u.display_name, u.avatar_url, lm.is_admin, lm.joined_at
    FROM league_members lm
    JOIN users u ON lm.user_id = u.id
    WHERE lm.league_id = :league_id
    ORDER BY lm.is_admin DESC, lm.joined_at ASC
    """
    members = await database.fetch_all(members_query, values={"league_id": league_id})
    league_dict["members"] = [dict(member) for member in members]
    
    # Get sports
    sports_query = """
    SELECT s.id, s.name, s.current_season, s.current_week
    FROM sports s
    JOIN league_sports ls ON s.id = ls.sport_id
    WHERE ls.league_id = :league_id AND ls.active = true
    """
    sports = await database.fetch_all(sports_query, values={"league_id": league_id})
    league_dict["sports"] = [dict(sport) for sport in sports]
    
    # Check if user is admin
    league_dict["is_admin"] = await is_league_admin(league_id, current_user["id"])
    
    return league_dict

@app.put("/api/leagues/{league_id}/sports")
async def update_league_sports(
    league_id: int, 
    sport_update: LeagueSportUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update sports for a league (admin only)"""
    # Check if user is admin
    is_admin = await is_league_admin(league_id, current_user["id"])
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can update sports"
        )
    
    async with database.transaction():
        # Get current sports
        current_sports_query = """
        SELECT sport_id FROM league_sports
        WHERE league_id = :league_id
        """
        current_sports = await database.fetch_all(
            current_sports_query, 
            values={"league_id": league_id}
        )
        current_sport_ids = [sport["sport_id"] for sport in current_sports]
        
        # Add new sports
        for sport_id in sport_update.sports:
            if sport_id not in current_sport_ids:
                await database.execute(
                    league_sports.insert().values(
                        league_id=league_id,
                        sport_id=sport_id,
                        active=True
                    )
                )
            else:
                # Reactivate sport if it was inactive
                await database.execute(
                    """
                    UPDATE league_sports
                    SET active = true
                    WHERE league_id = :league_id AND sport_id = :sport_id
                    """,
                    values={"league_id": league_id, "sport_id": sport_id}
                )
        
        # Deactivate removed sports
        for sport_id in current_sport_ids:
            if sport_id not in sport_update.sports:
                await database.execute(
                    """
                    UPDATE league_sports
                    SET active = false
                    WHERE league_id = :league_id AND sport_id = :sport_id
                    """,
                    values={"league_id": league_id, "sport_id": sport_id}
                )
    
    return {"message": "League sports updated successfully"}

@app.get("/api/sports")
async def get_sports():
    """Get list of all sports"""
    query = sports.select()
    all_sports = await database.fetch_all(query)
    return {"sports": [dict(sport) for sport in all_sports]}

@app.post("/api/games/sync")
async def sync_games_from_espn(game_sync: GameSync, current_user: dict = Depends(get_current_user)):
    """Sync games for a sport from ESPN API"""
    # Get sport details
    sport = await database.fetch_one(
        "SELECT * FROM sports WHERE id = :id",
        values={"id": game_sync.sport_id}
    )
    if not sport:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sport not found"
        )
    
    # ESPN API endpoint (this is a simplified version, actual implementation would need proper API URL)
    espn_url = f"https://site.api.espn.com/apis/site/v2/sports/{sport['espn_id']}/scoreboard"
    params = {
        "dates": game_sync.season,  # This is simplified, would need actual date format
        "week": game_sync.week
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(espn_url, params=params)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error fetching from ESPN API: {response.text}"
                )
            
            data = response.json()
            events = data.get("events", [])
            
            games_synced = 0
            games_updated = 0
            
            for event in events:
                espn_game_id = event.get("id")
                if not espn_game_id:
                    continue
                
                competition = event.get("competitions", [])[0] if event.get("competitions") else None
                if not competition:
                    continue
                
                # Extract game data
                home_team = competition.get("competitors", [])[0].get("team", {}).get("name", "")
                away_team = competition.get("competitors", [])[1].get("team", {}).get("name", "")
                
                # Check for odds/spread
                odds = competition.get("odds", [])[0] if competition.get("odds") else {}
                spread = odds.get("spread", 0)
                favorite = odds.get("favorite", "")
                
                game_time_str = event.get("date", "")
                game_time = datetime.fromisoformat(game_time_str.replace("Z", "+00:00")) if game_time_str else None
                
                venue = competition.get("venue", {}).get("fullName", "")
                status = event.get("status", {}).get("type", {}).get("name", "scheduled")
                
                home_score = competition.get("competitors", [])[0].get("score", 0)
                away_score = competition.get("competitors", [])[1].get("score", 0)
                
                # Check if game exists
                existing_game = await database.fetch_one(
                    "SELECT * FROM games WHERE espn_game_id = :espn_game_id",
                    values={"espn_game_id": espn_game_id}
                )
                
                if existing_game:
                    # Update existing game
                    await database.execute(
                        """
                        UPDATE games
                        SET home_team = :home_team,
                            away_team = :away_team,
                            home_team_score = :home_score,
                            away_team_score = :away_score,
                            spread = :spread,
                            favorite = :favorite,
                            game_time = :game_time,
                            venue = :venue,
                            season = :season,
                            week = :week,
                            status = :status,
                            last_updated = :now
                        WHERE espn_game_id = :espn_game_id
                        """,
                        values={
                            "home_team": home_team,
                            "away_team": away_team,
                            "home_score": home_score,
                            "away_score": away_score,
                            "spread": spread,
                            "favorite": favorite,
                            "game_time": game_time,
                            "venue": venue,
                            "season": game_sync.season,
                            "week": game_sync.week,
                            "status": status,
                            "now": datetime.utcnow(),
                            "espn_game_id": espn_game_id
                        }
                    )
                    games_updated += 1
                    
                    # Check if game details changed and there are picks for this game
                    if (existing_game["game_time"] != game_time or 
                        existing_game["venue"] != venue or
                        existing_game["spread"] != spread):
                        
                        # Get users who picked this game
                        users_with_picks = await database.fetch_all(
                            """
                            SELECT DISTINCT user_id FROM picks
                            WHERE game_id = :game_id
                            """,
                            values={"game_id": existing_game["id"]}
                        )
                        
                        # Schedule notifications for these users
                        for user in users_with_picks:
                            await database.execute(
                                """
                                INSERT INTO email_notifications 
                                (user_id, notification_type, scheduled_for)
                                VALUES (:user_id, 'GAME_UPDATED', :now)
                                """,
                                values={
                                    "user_id": user["user_id"],
                                    "now": datetime.utcnow()
                                }
                            )
                else:
                    # Insert new game
                    await database.execute(
                        """
                        INSERT INTO games (
                            sport_id, espn_game_id, home_team, away_team,
                            home_team_score, away_team_score, spread, favorite,
                            game_time, venue, season, week, status, last_updated
                        ) VALUES (
                            :sport_id, :espn_game_id, :home_team, :away_team,
                            :home_score, :away_score, :spread, :favorite,
                            :game_time, :venue, :season, :week, :status, :now
                        )
                        """,
                        values={
                            "sport_id": game_sync.sport_id,
                            "espn_game_id": espn_game_id,
                            "home_team": home_team,
                            "away_team": away_team,
                            "home_score": home_score,
                            "away_score": away_score,
                            "spread": spread,
                            "favorite": favorite,
                            "game_time": game_time,
                            "venue": venue,
                            "season": game_sync.season,
                            "week": game_sync.week,
                            "status": status,
                            "now": datetime.utcnow()
                        }
                    )
                    games_synced += 1
            
            # Update sport's current season and week if needed
            if sport["current_season"] != game_sync.season or sport["current_week"] != game_sync.week:
                await database.execute(
                    """
                    UPDATE sports
                    SET current_season = :season, current_week = :week
                    WHERE id = :id
                    """,
                    values={
                        "season": game_sync.season,
                        "week": game_sync.week,
                        "id": game_sync.sport_id
                    }
                )
            
            return {
                "message": "Games synced successfully",
                "games_synced": games_synced,
                "games_updated": games_updated
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing games: {str(e)}"
        )

@app.get("/api/games")
async def get_games(
    sport_id: int, 
    season: str, 
    week: int,
    current_user: dict = Depends(get_current_user)
):
    """Get games for a sport, season, and week"""
    query = """
    SELECT * FROM games
    WHERE sport_id = :sport_id
    AND season = :season
    AND week = :week
    ORDER BY game_time ASC
    """
    
    games_data = await database.fetch_all(
        query,
        values={
            "sport_id": sport_id,
            "season": season,
            "week": week
        }
    )
    
    return {"games": [dict(game) for game in games_data]}

@app.post("/api/picks")
async def submit_pick(pick: PickCreate, current_user: dict = Depends(get_current_user)):
    """Submit a pick for a game"""
    # Check if user is a member of the league
    is_member = await is_league_member(pick.league_id, current_user["id"])
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this league"
        )
    
    # Get game details
    game = await database.fetch_one(
        "SELECT * FROM games WHERE id = :id",
        values={"id": pick.game_id}
    )
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Check if game has already started
    if game["game_time"] <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot make picks for games that have already started"
        )
    
    # Check if pick already exists
    existing_pick = await database.fetch_one(
        """
        SELECT * FROM picks
        WHERE user_id = :user_id AND game_id = :game_id AND league_id = :league_id
        """,
        values={
            "user_id": current_user["id"],
            "game_id": pick.game_id,
            "league_id": pick.league_id
        }
    )
    
    if existing_pick:
        # Update existing pick
        await database.execute(
            """
            UPDATE picks
            SET picked_team = :picked_team, updated_at = :now
            WHERE id = :id
            """,
            values={
                "picked_team": pick.picked_team,
                "now": datetime.utcnow(),
                "id": existing_pick["id"]
            }
        )
        return {"message": "Pick updated successfully"}
    else:
        # Create new pick
        await database.execute(
            picks.insert().values(
                user_id=current_user["id"],
                game_id=pick.game_id,
                league_id=pick.league_id,
                picked_team=pick.picked_team
            )
        )
        return {"message": "Pick submitted successfully"}

@app.get("/api/picks")
async def get_user_picks(
    league_id: int,
    sport_id: int,
    season: str,
    week: int,
    current_user: dict = Depends(get_current_user)
):
    """Get user's picks for a specific league, sport, season, and week"""
    # Check if user is a member of the league
    is_member = await is_league_member(league_id, current_user["id"])
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this league"
        )
    
    query = """
    SELECT p.id, p.game_id, p.picked_team, p.created_at, p.updated_at,
           g.home_team, g.away_team, g.home_team_score, g.away_team_score,
           g.spread, g.favorite, g.game_time, g.venue, g.status
    FROM picks p
    JOIN games g ON p.game_id = g.id
    WHERE p.user_id = :user_id
    AND p.league_id = :league_id
    AND g.sport_id = :sport_id
    AND g.season = :season
    AND g.week = :week
    ORDER BY g.game_time ASC
    """
    
    picks_data = await database.fetch_all(
        query,
        values={
            "user_id": current_user["id"],
            "league_id": league_id,
            "sport_id": sport_id,
            "season": season,
            "week": week
        }
    )
    
    return {"picks": [dict(pick) for pick in picks_data]}

@app.post("/api/standings/calculate")
async def calculate_standings(
    standings_req: StandingsCalculate,
    current_user: dict = Depends(get_current_user)
):
    """Calculate standings for a league, sport, season, and week"""
    # Check if user is a league admin
    is_admin = await is_league_admin(standings_req.league_id, current_user["id"])
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can calculate standings"
        )
    
    # Get league details
    league = await database.fetch_one(
        "SELECT * FROM leagues WHERE id = :id",
        values={"id": standings_req.league_id}
    )
    if not league:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found"
        )
    
    # Get all completed games for the specified criteria
    games_query = """
    SELECT * FROM games
    WHERE sport_id = :sport_id
    AND season = :season
    AND week = :week
    AND status = 'STATUS_FINAL'
    """
    
    games_data = await database.fetch_all(
        games_query,
        values={
            "sport_id": standings_req.sport_id,
            "season": standings_req.season,
            "week": standings_req.week
        }
    )
    
    if not games_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed games found for the specified criteria"
        )
    
    # Get all league members
    members_query = """
    SELECT user_id FROM league_members
    WHERE league_id = :league_id
    """
    
    members = await database.fetch_all(
        members_query,
        values={"league_id": standings_req.league_id}
    )
    
    async with database.transaction():
        for member in members:
            user_id = member["user_id"]
            wins = 0
            losses = 0
            ties = 0
            points = 0
            
            for game in games_data:
                # Get user's pick for this game
                pick = await database.fetch_one(
                    """
                    SELECT * FROM picks
                    WHERE user_id = :user_id
                    AND game_id = :game_id
                    AND league_id = :league_id
                    """,
                    values={
                        "user_id": user_id,
                        "game_id": game["id"],
                        "league_id": standings_req.league_id
                    }
                )
                
                if not pick:
                    continue  # No pick found, skip
                
                # Determine winner
                home_score = game["home_team_score"]
                away_score = game["away_team_score"]
                winning_team = None
                
                if home_score > away_score:
                    winning_team = game["home_team"]
                elif away_score > home_score:
                    winning_team = game["away_team"]
                
                # Calculate result
                if winning_team is None:  # Tie game
                    ties += 1
                elif pick["picked_team"] == winning_team:  # Correct pick
                    wins += 1
                    
                    # Calculate additional points if tiebreaker is enabled
                    if league["tiebreaker_enabled"] and game["spread"] and game["favorite"]:
                        picked_is_favorite = pick["picked_team"] == game["favorite"]
                        spread = game["spread"]
                        
                        if picked_is_favorite:
                            # Picked favorite and covered spread
                            score_diff = abs(home_score - away_score)
                            if score_diff > spread:
                                # Add bonus points for covering the spread
                                points += 0.5
                        else:
                            # Picked underdog that won outright
                            points += 1
                else:  # Wrong pick
                    losses += 1
            
            # Calculate basic points (1 per win)
            points += wins
            
            # Update or create standings entry
            existing_standings = await database.fetch_one(
                """
                SELECT * FROM league_standings
                WHERE league_id = :league_id
                AND user_id = :user_id
                AND sport_id = :sport_id
                AND season = :season
                AND week = :week
                """,
                values={
                    "league_id": standings_req.league_id,
                    "user_id": user_id,
                    "sport_id": standings_req.sport_id,
                    "season": standings_req.season,
                    "week": standings_req.week
                }
            )
            
            if existing_standings:
                await database.execute(
                    """
                    UPDATE league_standings
                    SET wins = :wins, losses = :losses, ties = :ties, points = :points
                    WHERE id = :id
                    """,
                    values={
                        "wins": wins,
                        "losses": losses,
                        "ties": ties,
                        "points": points,
                        "id": existing_standings["id"]
                    }
                )
            else:
                await database.execute(
                    league_standings.insert().values(
                        league_id=standings_req.league_id,
                        user_id=user_id,
                        sport_id=standings_req.sport_id,
                        season=standings_req.season,
                        week=standings_req.week,
                        wins=wins,
                        losses=losses,
                        ties=ties,
                        points=points
                    )
                )
    
    return {"message": "Standings calculated successfully"}

@app.get("/api/standings")
async def get_standings(
    league_id: int,
    sport_id: int,
    season: str,
    week: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get standings for a league, sport, season, and optionally, week"""
    # Check if user is a member of the league
    is_member = await is_league_member(league_id, current_user["id"])
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this league"
        )
    
    # Build query based on whether week is specified
    base_query = """
    SELECT ls.user_id, u.username, u.display_name, 
           SUM(ls.wins) as total_wins,
           SUM(ls.losses) as total_losses, 
           SUM(ls.ties) as total_ties,
           SUM(ls.points) as total_points
    FROM league_standings ls
    JOIN users u ON ls.user_id = u.id
    WHERE ls.league_id = :league_id
    AND ls.sport_id = :sport_id
    AND ls.season = :season
    """
    
    if week is not None:
        base_query += " AND ls.week = :week"
    
    base_query += " GROUP BY ls.user_id, u.username, u.display_name ORDER BY total_points DESC, total_wins DESC"
    
    values = {
        "league_id": league_id,
        "sport_id": sport_id,
        "season": season
    }
    
    if week is not None:
        values["week"] = week
    
    standings_data = await database.fetch_all(base_query, values=values)
    
    return {"standings": [dict(standing) for standing in standings_data]}

# Additional scheduled task to update sport seasons/weeks
@app.get("/api/update_schedule")
async def update_sports_schedule():
    """Periodically check ESPN API for updated seasons/weeks"""
    sports_list = await database.fetch_all("SELECT * FROM sports")
    
    for sport in sports_list:
        try:
            # Fetch current season and week info from ESPN API
            espn_url = f"http://site.api.espn.com/apis/site/v2/sports/{sport['api_endpoint']}/scoreboard"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(espn_url)
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract season and week info
                    # This is simplified - actual implementation would need to handle
                    # API response structure correctly
                    season = data.get("season", {}).get("year", sport["current_season"])
                    week = data.get("week", {}).get("number", sport["current_week"])
                    
                    # Update if changed
                    if season != sport["current_season"] or week != sport["current_week"]:
                        await database.execute(
                            """
                            UPDATE sports
                            SET current_season = :season, current_week = :week
                            WHERE id = :id
                            """,
                            values={
                                "season": season,
                                "week": week,
                                "id": sport["id"]
                            }
                        )
        except Exception as e:
            print(f"Error updating sport {sport['name']}: {str(e)}")
ESPN_SPORTS_API = "https://site.api.espn.com/apis/site/v2/scoreboard/activeSports?v=1&editionKey=espn-en&lang=en&region=us"
@app.post("/api/load_sports/")
async def load_sports():
    try:
        # Fetch sports data from ESPN API
        response = requests.get(ESPN_SPORTS_API)
        response.raise_for_status()
        sports_data = response.json()

        inserted_count = 0
        for sport in sports_data.get("activeLeagues", []):
            sport_name = sport.get("league")
            if sport_name != "topEvents":
                espn_id = sport.get("sportId")
                link = sport.get("link").get("href")
                display_name = sport.get("displayName")
                current_season = None  # Modify if API provides this
                current_week = None  # Modify if API provides this
                
                if not sport_name or not espn_id:
                    continue
    
                # Check if sport already exists
                query = sports.select().where(sports.c.espn_id == espn_id)
                existing_sport = await database.fetch_one(query)
                if existing_sport:
                    continue
    
                # Insert new sport
                query = sports.insert().values(
                    name=sport_name,
                    current_season=current_season,
                    current_week=current_week,
                    link=link,
                    display_name=display_name,
                    espn_id=espn_id
                )
                await database.execute(query)
                inserted_count += 1
        
        return {"message": f"Inserted {inserted_count} sports successfully."}

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"ESPN API request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Add to scheduler
# scheduler.add_job(lambda: asyncio.run(update_sports_schedule()), 'interval', hours=12)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, timeout_keep_alive=120)
