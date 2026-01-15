# GameVerse Backend - API Quick Reference

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication

### Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otpCode": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 86399,
    "user": {
      "id": 1,
      "phoneNumber": "+1234567890",
      "gameCoins": 1000.0,
      "hasProfile": false
    }
  }
}
```

## Rooms

### Get All Rooms
```http
GET /rooms
Authorization: Bearer {token}
```

### Get Room Details
```http
GET /rooms/{roomId}
Authorization: Bearer {token}
```

### Join Room
```http
POST /rooms/{roomId}/join
Authorization: Bearer {token}
```

### Leave Room
```http
POST /rooms/{roomId}/leave
Authorization: Bearer {token}
```

### Send Message
```http
POST /rooms/{roomId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Hello everyone!"
}
```

### Get Messages
```http
GET /rooms/{roomId}/messages?limit=20
Authorization: Bearer {token}
```

## Profile

### Get Profile
```http
GET /profile
Authorization: Bearer {token}
```

### Create/Update Profile
```http
POST /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "avatarId": "avatar_1",
  "displayName": "PlayerOne",
  "bio": "Love gaming!",
  "interestTags": ["action", "strategy"]
}
```

## Game Sessions

### Get Available Sessions
```http
GET /game-sessions
Authorization: Bearer {token}
```

### Create Game Session
```http
POST /game-sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "gameType": "LUDO",
  "maxPlayers": 4,
  "entryFee": 10.0,
  "isPrivate": false
}
```

### Join Game Session
```http
POST /game-sessions/{sessionId}/join
Authorization: Bearer {token}
```

## GameCoins

### Get Balance
```http
GET /gamecoins/balance
Authorization: Bearer {token}
```

### Get Transactions
```http
GET /gamecoins/transactions?page=0&size=20
Authorization: Bearer {token}
```

## Matchmaking

### Join Queue
```http
POST /matchmaking/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "gameType": "LUDO",
  "preferredPlayers": 4
}
```

### Get Status
```http
GET /matchmaking/status
Authorization: Bearer {token}
```

### Leave Queue
```http
POST /matchmaking/leave
Authorization: Bearer {token}
```

## WebSocket

### Connection
```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect(
  { Authorization: `Bearer ${token}` },
  (frame) => {
    console.log('Connected:', frame);
    
    // Subscribe to game updates
    stompClient.subscribe('/topic/game/SESSION_ID', (message) => {
      console.log('Game update:', JSON.parse(message.body));
    });
    
    // Subscribe to room chat
    stompClient.subscribe('/topic/room/ROOM_ID', (message) => {
      console.log('Chat message:', JSON.parse(message.body));
    });
    
    // Subscribe to private notifications
    stompClient.subscribe('/queue/user/USER_ID', (message) => {
      console.log('Notification:', JSON.parse(message.body));
    });
  }
);
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required to access this resource",
  "path": "/api/v1/rooms",
  "status": 401,
  "timestamp": "2026-01-14T05:41:43.554203400"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "timestamp": "2026-01-14T05:41:43.554203400"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "path": "/api/v1/profile",
  "status": 404,
  "timestamp": "2026-01-14T05:41:43.554203400"
}
```

## Available Rooms

1. **casual-gaming** - Casual Gaming
2. **competitive** - Competitive Arena
3. **social-hub** - Social Hub

## Game Types

- CAR_RACING
- CHESS
- UNO
- RUMMY
- LUDO
- TRUTH_DARE
- MEME_BATTLE
- BUBBLE_BLAST
- FIGHTING
- MATH_MASTER

## Development Notes

- **Default OTP**: 1234 (for development only)
- **Initial GameCoins**: 1000
- **JWT Expiration**: 24 hours
- **OTP Expiration**: 5 minutes
