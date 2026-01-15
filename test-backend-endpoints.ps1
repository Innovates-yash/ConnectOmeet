# GameVerse Backend API Test Script
# Tests all major endpoints to verify backend functionality

$baseUrl = "http://localhost:8080/api/v1"
$testPhone = "+1234567890"
$testOtp = "1234"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GameVerse Backend API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Send OTP
Write-Host "Test 1: Send OTP" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/send-otp" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{`"phoneNumber`": `"$testPhone`"}" `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ PASS: OTP sent successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: OTP sending failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Verify OTP and Get Token
Write-Host "Test 2: Verify OTP and Get JWT Token" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/verify-otp" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{`"phoneNumber`": `"$testPhone`", `"otpCode`": `"$testOtp`"}" `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success -and $result.data.accessToken) {
        $global:token = $result.data.accessToken
        $global:userId = $result.data.user.id
        Write-Host "✅ PASS: Authentication successful" -ForegroundColor Green
        Write-Host "   User ID: $($result.data.user.id)" -ForegroundColor Gray
        Write-Host "   Game Coins: $($result.data.user.gameCoins)" -ForegroundColor Gray
        Write-Host "   Token: $($result.data.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: Authentication failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Rooms
Write-Host "Test 3: Get Available Rooms" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/rooms" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $rooms = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved $($rooms.Count) rooms" -ForegroundColor Green
    foreach ($room in $rooms) {
        Write-Host "   - $($room.name) ($($room.id)): $($room.currentCount)/$($room.maxCapacity) players" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Room Details
Write-Host "Test 4: Get Room Details" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/rooms/casual-gaming" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $roomDetails = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved room details" -ForegroundColor Green
    Write-Host "   Room: $($roomDetails.room.name)" -ForegroundColor Gray
    Write-Host "   Participants: $($roomDetails.participants.Count)" -ForegroundColor Gray
    Write-Host "   Recent Messages: $($roomDetails.recentMessages.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Join Room
Write-Host "Test 5: Join Room" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/rooms/casual-gaming/join" `
        -Method POST `
        -Headers $headers `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ PASS: Successfully joined room" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Failed to join room" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get User Profile
Write-Host "Test 6: Get User Profile" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/profile" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $profile = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved user profile" -ForegroundColor Green
    Write-Host "   Display Name: $($profile.displayName)" -ForegroundColor Gray
    Write-Host "   Games Played: $($profile.totalGamesPlayed)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "⚠️  WARN: Profile not found (expected for new user)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: Get Game Sessions
Write-Host "Test 7: Get Available Game Sessions" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/game-sessions" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $sessions = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved game sessions" -ForegroundColor Green
    Write-Host "   Active Sessions: $($sessions.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Get GameCoin Balance
Write-Host "Test 8: Get GameCoin Balance" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/gamecoins/balance" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $balance = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved GameCoin balance" -ForegroundColor Green
    Write-Host "   Balance: $($balance.balance) coins" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Get Matchmaking Status
Write-Host "Test 9: Get Matchmaking Status" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/matchmaking/status" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    
    $status = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Retrieved matchmaking status" -ForegroundColor Green
    Write-Host "   Status: $($status.status)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "⚠️  WARN: Not in matchmaking queue (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 10: Leave Room
Write-Host "Test 10: Leave Room" -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $global:token" }
    $response = Invoke-WebRequest -Uri "$baseUrl/rooms/casual-gaming/leave" `
        -Method POST `
        -Headers $headers `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ PASS: Successfully left room" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Failed to leave room" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
