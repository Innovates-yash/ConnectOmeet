# How to Check Browser Console Logs

## Step-by-Step Guide:

### 1. Open Browser DevTools

**Method 1 (Keyboard):**
- Press **F12** key

**Method 2 (Right-click):**
- Right-click anywhere on the page
- Select **"Inspect"** or **"Inspect Element"**

**Method 3 (Menu):**
- Click the three dots (⋮) in top-right corner
- Go to: **More tools** → **Developer tools**

### 2. Go to Console Tab

- You'll see several tabs at the top: Elements, Console, Sources, Network, etc.
- Click on **"Console"** tab
- This is where all the logs appear

### 3. Clear Old Logs (Optional)

- Click the 🚫 (clear) icon in the console
- Or right-click in console → **"Clear console"**

### 4. Test the OTP Feature

1. Make sure you're on: **http://localhost:3000/auth**
2. Enter phone number: **+918979458786**
3. Click **"Send OTP"** button
4. **Watch the Console** - you should see messages appear

### 5. What to Look For

You should see logs like this:

✅ **If Working:**
```
Sending OTP to: +918979458786
OTP Response: {success: true, message: "OTP sent successfully..."}
```

❌ **If Error:**
```
OTP Error: Error: ...
Error response: {...}
```

### 6. Take a Screenshot

- If you see errors, take a screenshot of the console
- Or copy the error text

---

## Quick Visual Guide:

```
┌─────────────────────────────────────────┐
│  Browser Window                    ⋮ ✕  │
├─────────────────────────────────────────┤
│                                         │
│  [Your GameVerse Page]                  │
│                                         │
├─────────────────────────────────────────┤ ← Press F12 to open this
│ Elements │ Console │ Network │ ...     │
├─────────────────────────────────────────┤
│ > Sending OTP to: +918979458786        │ ← Logs appear here
│ > OTP Response: {...}                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## What I Need From You:

After you click "Send OTP", please tell me:

1. **Do you see any red error messages?**
2. **Do you see the "Sending OTP to:" log?**
3. **Do you see the "OTP Response:" log?**
4. **Or do you see "OTP Error:" log?**

Copy and paste the exact text you see in the console!

---

## Alternative: Use Test Page

If the console is confusing, just go to:
**http://localhost:3000/test-api.html**

Click "Test Send OTP" button - the result will show on the page itself (no console needed).

---

**Once you tell me what you see in the console, I can fix the exact issue!** 🔍
