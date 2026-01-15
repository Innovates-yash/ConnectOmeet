# GameVerse Backend

Spring Boot backend for the GameVerse Social Gaming Platform.

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- MySQL 8.0+

### Setup
1. **Database Setup**
   ```bash
   # Run the database setup from the database directory
   cd ../database
   mysql -u root -p < setup.sql
   ```

2. **Build and Run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

3. **Verify Setup**
   - API: http://localhost:8080/api/v1
   - Health: http://localhost:8080/api/v1/actuator/health
   - WebSocket: ws://localhost:8080/ws

## 📁 Project Structure

```
backend/
├── src/main/java/com/gameverse/
│   ├── GameVerseApplication.java          # Main application class
│   ├── config/                            # Configuration classes
│   │   ├── SecurityConfig.java            # Spring Security setup
│   │   └── WebSocketConfig.java           # WebSocket configuration
│   ├── controller/                        # REST API controllers
│   │   └── AuthController.java            # Authentication endpoints
│   ├── dto/                               # Data Transfer Objects
│   │   ├── request/                       # Request DTOs
│   │   └── response/                      # Response DTOs
│   ├── security/                          # Security components
│   │   ├── JwtAuthenticationEntryPoint.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenProvider.java
│   └── service/                           # Business logic services
│       ├── AuthService.java               # Authentication service
│       └── UserService.java               # User management service
├── src/main/resources/
│   └── application.yml                    # Application configuration
└── pom.xml                               # Maven dependencies
```

## 🔧 Configuration

### Database Configuration
The application uses your MySQL credentials:
- Host: localhost:3306
- Database: gameverse_db
- Username: root
- Password: gyash4841@

### JWT Configuration
- Secret: Configured in application.yml
- Expiration: 24 hours
- Refresh token: 7 days

### WebSocket Endpoints
- Main endpoint: `/ws` (with SockJS fallback)
- Direct endpoint: `/ws-direct` (native WebSocket)

## 🛡️ Security

### Authentication Flow
1. **Send OTP**: `POST /api/v1/auth/send-otp`
2. **Verify OTP**: `POST /api/v1/auth/verify-otp`
3. **Use JWT**: Include `Authorization: Bearer <token>` in headers

### Protected Endpoints
All endpoints except `/auth/**` and `/public/**` require JWT authentication.

## 🎮 API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to phone number
- `POST /api/v1/auth/verify-otp` - Verify OTP and get JWT tokens
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/validate-token` - Validate JWT token

### Future Endpoints (To be implemented)
- `/api/v1/user/**` - User profile management
- `/api/v1/game/**` - Game session management
- `/api/v1/room/**` - Room management
- `/api/v1/social/**` - Social features

## 🧪 Testing

### Run Tests
```bash
mvn test
```

### Property-Based Tests
The project includes property-based tests using jqwik for comprehensive validation.

## 🔄 WebSocket Communication

### Connection
```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);
```

### Destinations
- `/topic/game/{sessionId}` - Game state updates
- `/topic/room/{roomId}` - Room chat messages
- `/queue/user/{userId}` - Private notifications

## 📝 Development Notes

### Current Status
✅ **Task 2 Complete**: Spring Boot Backend Core Setup
- Project structure created
- Dependencies configured
- Security setup (JWT + CORS)
- WebSocket configuration
- Basic API structure

### Next Steps
- **Task 3**: Authentication System Implementation
- **Task 4**: User Profile Management System
- **Task 5**: Compatibility Algorithm Implementation

### Code Quality
- Clean architecture with separation of concerns
- Comprehensive error handling
- Input validation with Bean Validation
- Structured logging
- Property-based testing ready

## 🚀 Deployment

### Development
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Production
```bash
mvn clean package
java -jar target/gameverse-backend-1.0.0.jar --spring.profiles.active=prod
```

The backend foundation is now ready for implementing the authentication system and game features!