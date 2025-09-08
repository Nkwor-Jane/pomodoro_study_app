# 📚 StudyTogether Pomodoro

A Pomodoro video app for students that combines time management, focus, and peer accountability.  

## 🔧 App Concept

**StudyTogether Pomodoro**  
**Goal:** Help students stay focused by studying together using Pomodoro timers, live video, and structured breaks.

## 🎯 Core Features

### 1. User Authentication

- Sign up/log in (Google or email/password)  
- Optional: School email verification  

### 2. Dashboard

- Join a Pomodoro room  
- See ongoing rooms or create your own  
- Timer settings (Default: 25 min focus, 5 min break)  

### 3. Pomodoro Room (Core Study Session)

- Live video/audio chat (optional toggle per user)  
- Synchronized Pomodoro timer  
- Visual indicator of who’s in the room  
- **Focus Period:** Everyone works quietly  
- **Break Period:** Chat/review phase; users can discuss or write what they learned  

### 4. Revision Logs

- At the end of each session, prompt users: *“What did you study?”*  
- Save logs for reflection  

### 5. Notifications

- Timer start/end  
- *“Time to revise”* or *“Session ended”* alerts  

### 6. Progress Tracking

- Total Pomodoro sessions completed  
- Stats: Daily/weekly streaks  

## 💻 Tech Stack (Recommended)

### 🔹 Frontend (React)

- React + TypeScript  
- State management: Zustand  
- Styling: TailwindCSS  

### 🔹 Backend (FastAPI)

- WebSocket for real-time timer sync  
- REST API for user, room, and session management  

### 🔹 Video Streaming

- WebRTC for peer-to-peer video
  
### 🔹 Database

- PostgreSQL (Room, user, logs, sessions)  
- ORM: SQLAlchemy or Tortoise ORM  

## 🧠 Flow Example

1. User logs in → Joins **“Math Revision Room”**  
2. Everyone sees a 25-min timer counting down  
3. Timer ends → 5-min break with video/audio on  
4. Prompt: *“What did you just study?”*  
5. User writes: *“Finished Algebra exercises 1-5”*  
6. Logs saved, next Pomodoro starts  

## 📖 Usage

### 🔧 Backend Setup (FastAPI)

1. **Clone the repo:**

   ```bash
   git clone https://github.com/Nkwor-Jane/pomodoro_study_app.git
   cd pomodoro_study_app

2. **Navigate to ckend directory**

    ```bash
    cd backend


3. **Create a virtual environment:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows

4. **Install dependencies:**

   ```bash
   pip install -r requirements.txt

5. **Create .env file:**

   ```bash
    SUPABASE_DATABASE_PASSWORD=********
    DATABASE_URL=postgresql://postgres**********************

6. **Run the server:**

    ```bash
    uvicorn main:app --reload
    
7. **API Endpoint:**

    ```bash
    POST http://localhost:8000/

## 🤝 Contributing

Contributions and suggestions are welcome