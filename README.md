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
- 🔐 **Phone-based Authentication** - Secure OTP login with country code selector
- 👥 **Social Gaming** - Friend system, chat, and social rooms
- 🏆 **Matchmaking** - Skill-based and quick match options
- 💰 **Virtual Currency** - GameCoins system with transactions
- 🎯 **Compatibility System** - Find compatible gaming partners
- 📊 **User Profiles** - Customizable profiles with 24 avatar options
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

### Backend
- **Spring Boot 3.2.1** - Java framework
- **Java 25** - Programming language
- **Spring Security** - Authentication & authorization
- **Spring WebSocket** - Real-time communication
- **Spring Data JPA** - Database ORM
- **MySQL 8.0** - Database
- **JWT** - Token-based auth
- **Maven** - Build tool

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Java** 17+ (Java 25 recommended)
- **Maven** 3.8+
- **MySQL** 8.0+

### Quick Start

1. **Setup Database**
```bash
mysql -u root -p
CREATE DATABASE gameverse_db;
USE gameverse_db;
SOURCE database/schema.sql;
```

2. **Configure Backend**
Update `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/gameverse_db
    username: your_username
    password: your_password
```

3. **Start Backend**
```bash
cd backend
mvn spring-boot:run
```
Backend runs on: **http://localhost:8080**

4. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: **http://localhost:3000**

### Windows Quick Start
```bash
start-all.cmd          # Start both servers
start-backend.cmd      # Backend only
start-frontend.cmd     # Frontend only
check-status.cmd       # Check if running
```

## 🔑 Authentication

### OTP Login Flow
1. Select country code (India +91 default)
2. Enter phone number
3. Receive OTP (Dev mode: use "1234")
4. Verify and login
5. Complete profile setup (first time users)

**Dev Mode**: Any phone number works with OTP "1234"

## 🎨 Design System

### Cyberpunk Theme
- **Primary**: Cyan (#00ffff)
- **Secondary**: Magenta (#ff00ff)
- **Accent**: Yellow (#ffff00)
- **Background**: Dark (#0a0a0a)

Features neon glow effects, glass morphism, and animated gradients.

## 📊 Key API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify & login

### Profile
- `GET /api/v1/profile/me` - Get profile
- `POST /api/v1/profile/create` - Create profile
- `GET /api/v1/profile/avatars` - Get available avatars

### Matchmaking
- `POST /api/v1/matchmaking/join` - Join queue
- `GET /api/v1/matchmaking/status` - Queue status

### GameCoins
- `GET /api/v1/gamecoins/balance` - Get balance
- `GET /api/v1/gamecoins/transactions` - Transaction history

## 📁 Project Structure

```
ConnectOMeet/
├── frontend/              # React app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store
│   │   ├── services/     # API services
│   │   └── utils/        # Utilities
│   └── package.json
│
├── backend/              # Spring Boot app
│   ├── src/main/java/com/gameverse/
│   │   ├── controller/  # REST controllers
│   │   ├── service/     # Business logic
│   │   ├── repository/  # Data access
│   │   └── entity/      # JPA entities
│   └── pom.xml
│
└── database/            # SQL scripts
    ├── schema.sql
    └── migrations/
```

## 🔐 Security Features

- JWT token-based authentication
- Phone number verification via OTP
- Secure password-less login
- Token refresh mechanism
- Protected API endpoints

## 📝 Documentation

See the `docs/` folder for:
- API documentation
- Database schema
- Setup guides
- Architecture diagrams

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Author

**Yash Gupta**

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2026
