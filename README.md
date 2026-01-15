# GameVerse - Social Gaming Platform

A full-stack social gaming platform featuring 10 multiplayer games, real-time matchmaking, virtual currency system, and social features.

## 🎮 Features

### Games (10 Total)
- 🏎️ **Car Racing** - Fast-paced racing action (2-4 players)
- ♟️ **Chess** - Classic strategy game (2 players)
- 🃏 **UNO** - Popular card game (2-4 players)
- 🎴 **Rummy** - Strategic card game (2-6 players)
- 🎲 **Ludo** - Classic board game (2-4 players)
- 💭 **Truth or Dare** - Party game (3-8 players)
- 😂 **Meme Battle** - Creative meme competition (2-10 players)
- 🫧 **Bubble Blast** - Arcade puzzle game (1-4 players)
- 👊 **Fighting** - Combat game (2 players)
- 🧮 **Math Master** - Educational math game (2-6 players)

### Platform Features
- 🔐 **Phone-based Authentication** - Secure OTP login
- 👥 **Social Gaming** - Friend system, chat, and social rooms
- 🏆 **Matchmaking** - Skill-based and quick match options
- 💰 **Virtual Currency** - GameCoins system with transactions
- 🎯 **Compatibility System** - Find compatible gaming partners
- 📊 **User Profiles** - Customizable profiles with stats
- 💬 **Real-time Chat** - WebSocket-based messaging
- 🎮 **Private Lobbies** - Create and join private game rooms

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling with custom cyberpunk theme
- **Vite** - Build tool and dev server
- **Lucide React** - Icons
- **React Hook Form + Zod** - Form validation
- **React Hot Toast** - Notifications
- **Vitest** - Testing framework

### Backend
- **Spring Boot 3.2.1** - Java framework
- **Java 25** - Programming language
- **Spring Security** - Authentication & authorization
- **Spring WebSocket** - Real-time communication
- **Spring Data JPA** - Database ORM
- **MySQL 8.0** - Database
- **JWT** - Token-based auth
- **Maven** - Build tool

### Database
- **MySQL 8.0** - Primary database
- **Flyway** - Database migrations
- 13 tables with proper relationships

## 📁 Project Structure

```
ConnectOMeet/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store and slices
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── __tests__/       # Test files
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Spring Boot backend
│   ├── src/main/java/com/gameverse/
│   │   ├── controller/      # REST & WebSocket controllers
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Data access layer
│   │   ├── entity/          # JPA entities
│   │   ├── config/          # Configuration classes
│   │   └── dto/             # Data transfer objects
│   ├── src/main/resources/
│   │   └── application.yml  # Application configuration
│   └── pom.xml
│
├── database/                 # Database scripts
│   ├── schema.sql           # Complete schema
│   ├── migrations/          # Flyway migrations
│   └── seed_data.sql        # Sample data
│
└── .kiro/                    # Kiro specs and documentation
    └── specs/
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Java** 17+ (Java 25 recommended)
- **Maven** 3.8+
- **MySQL** 8.0+
- **Git**

### Database Setup

1. Install MySQL 8.0 and start the service

2. Create the database:
```sql
CREATE DATABASE gameverse_db;
```

3. Run the schema:
```bash
mysql -u root -p gameverse_db < database/schema.sql
```

4. (Optional) Load seed data:
```bash
mysql -u root -p gameverse_db < database/seed_data.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Update `src/main/resources/application.yml` with your MySQL credentials:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/gameverse_db
    username: your_username
    password: your_password
```

3. Build and run:
```bash
mvn clean install
mvn spring-boot:run
```

Backend will start on: **http://localhost:8080**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will start on: **http://localhost:3000**

## 🎯 Quick Start Scripts

### Windows
```bash
# Start everything
start-all.cmd

# Start backend only
start-backend.cmd

# Start frontend only
start-frontend.cmd

# Check status
check-status.cmd
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/logout` - Logout user

### User Profile
- `GET /api/v1/profile` - Get user profile
- `POST /api/v1/profile` - Create/update profile
- `PUT /api/v1/profile` - Update profile

### Matchmaking
- `POST /api/v1/matchmaking/join` - Join matchmaking queue
- `POST /api/v1/matchmaking/leave` - Leave queue
- `GET /api/v1/matchmaking/status` - Get queue status

### Game Sessions
- `POST /api/v1/game-sessions` - Create game session
- `GET /api/v1/game-sessions/{id}` - Get session details
- `POST /api/v1/game-sessions/{id}/join` - Join session
- `POST /api/v1/game-sessions/{id}/leave` - Leave session

### GameCoins
- `GET /api/v1/gamecoins/balance` - Get balance
- `POST /api/v1/gamecoins/transfer` - Transfer coins
- `GET /api/v1/gamecoins/transactions` - Get transaction history

### Social Features
- `GET /api/v1/rooms` - List public rooms
- `POST /api/v1/rooms` - Create room
- `GET /api/v1/friends` - Get friends list
- `POST /api/v1/friends/request` - Send friend request

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
```

### Backend Tests
```bash
cd backend
mvn test                   # Run all tests
mvn verify                 # Run tests with integration tests
```

## 🔐 Authentication Flow

1. User enters phone number
2. Backend sends OTP (dev mode: always "1234")
3. User enters OTP
4. Backend verifies and issues JWT token
5. Token stored in Redux and used for API calls

**Dev Mode**: Any phone number works with OTP "1234"

## 🎨 Design System

### Cyberpunk Theme
- **Primary Color**: Cyan (#00ffff)
- **Secondary Color**: Magenta (#ff00ff)
- **Accent Color**: Yellow (#ffff00)
- **Background**: Dark (#0a0a0a)

### Custom Components
- Neon glow effects
- Glass morphism cards
- Animated gradients
- Custom scrollbars
- Cyberpunk grid backgrounds

## 📊 Database Schema

13 tables including:
- `users` - User accounts
- `user_profiles` - Extended profile info
- `game_sessions` - Active game sessions
- `game_participants` - Session participants
- `game_coin_transactions` - Currency transactions
- `chat_messages` - Chat history
- `rooms` - Social rooms
- `friendships` - Friend relationships
- And more...

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/AWS)
```bash
cd backend
mvn clean package
# Deploy target/*.jar
```

## 📝 Documentation

- [Backend Verification Report](BACKEND-VERIFICATION-COMPLETE.md)
- [Backend Analysis](BACKEND-ANALYSIS-REPORT.md)
- [API Endpoints Reference](BACKEND-ENDPOINTS-QUICK-REFERENCE.md)
- [Frontend Status](FRONTEND-STATUS.md)
- [Endpoint Tests](backend-endpoint-tests.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Yash Gupta** - Initial work

## 🙏 Acknowledgments

- Built with Spring Boot and React
- Cyberpunk design inspired by modern gaming aesthetics
- Property-based testing methodology for robust code quality

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: [Your Email]

---

**Status**: ✅ Fully Operational
**Version**: 1.0.0
**Last Updated**: January 2026
