# ChatMail

A real-time chat application with Gmail integration, built with React and FastAPI.

## Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: FastAPI + PostgreSQL + Redis + MinIO
- **Authentication**: Google OAuth 2.0
- **Real-time**: WebSockets
- **Storage**: MinIO for media files
- **Containerization**: Docker + Docker Compose

## Project Structure

```
ChatMail/
├── frontend/          # React frontend application
├── backend-code/      # FastAPI backend application  
├── docker-compose.yml # Docker orchestration
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Cloud Console project with OAuth 2.0 credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ChatMail
   ```

2. **Configure Google OAuth**
   - Download your Google OAuth client secret JSON file from Google Cloud Console
   - Place it in `backend-code/` directory (it will be ignored by git)
   - Copy `backend-code/.env.example` to `backend-code/.env`
   - Update the Google credentials in `backend-code/.env` with your actual values

3. **Start all services**
   ```bash
   docker compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000/docs
   - MinIO Console: http://localhost:9003

## Features

- ✅ Google OAuth authentication
- ✅ Real-time messaging
- ✅ User invitation system
- ✅ Mobile-responsive design
- ✅ File upload support (via MinIO)
- ✅ Message status tracking
- ✅ Online presence indicators

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend-code
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

Check `backend-code/.env` for configuration options including:
- Database settings
- Redis configuration
- MinIO settings
- Google OAuth credentials
- JWT settings

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 8080 | React development server |
| Backend | 8000 | FastAPI application |
| PostgreSQL | 5433 | Database |
| Redis | 6380 | Cache and real-time data |
| MinIO | 9002 | Object storage |
| MinIO Console | 9003 | MinIO web interface |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]