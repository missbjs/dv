# dv-cli Usage Examples

## Complete Example: Testing a Web Application

This example shows a complete workflow for testing a web application with dv-cli.

### Step 1: Start Chrome

```bash
# Start Chrome with dv1
dv1 start
```

Expected output:
```
Starting Chrome on port 9230...
Profile: dv1
Chrome started successfully on port 9230
DevTools URL: http://localhost:9230
```

### Step 2: Navigate to the Application

```bash
# Navigate to your application
dv1 goto http://localhost:5178/visual/components/奇门遁甲宫.html
```

Expected output:
```
Navigating to http://localhost:5178/visual/components/奇门遁甲宫.html...
Navigation complete
```

### Step 3: List All Tabs

```bash
# List all open pages
dv1 tabs
```

Expected output:
```
Found 1 tab(s):

* 1. 奇门遁甲宫
  ID:  ABC123DEF456...
  URL: http://localhost:5178/visual/components/奇门遁甲宫.html
```

### Step 4: Evaluate Scripts

```bash
# Get page title
dv1 eval --script "document.title"

# Count elements
dv1 eval --script "document.querySelectorAll('sy-奇门遁甲宫').length"

# Execute script file
dv1 eval --file test-script.js --json
```

Expected output:
```
奇门遁甲宫
3
{
  "title": "奇门遁甲宫",
  "elementCount": 3,
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "userAgent": "Mozilla/5.0 ..."
}
```

### Step 5: Interact with Elements

```bash
# Click a button
dv1 click #submit-btn

# Fill a form
dv1 fill #username "test@example.com"
dv1 fill #password "password123"

# Type text (appends)
dv1 type #search "奇门遁甲"

# Press Enter
dv1 key --key Enter
```

Expected output:
```
Clicking #submit-btn...
Click successful

Filling #username with "test@example.com"...
Fill successful

Typing "奇门遁甲" into #search...
Type successful

Pressing key Enter...
Key press successful
```

### Step 6: Check Console Messages

```bash
# Check for errors
dv1 console --type error

# Check for warnings
dv1 console --type warn

# Filter logs by pattern
dv1 console --type log --filter "API"
```

Expected output:
```
[error] Failed to load resource: net::ERR_CONNECTION_REFUSED
  at http://localhost:5178/app.js:10:5

[warn] Deprecated API usage detected
  at http://localhost:5178/utils.js:25:12

[log] API request completed successfully
```

### Step 7: Take Screenshots

```bash
# Take a screenshot
dv1 screenshot screenshot.png
```

Expected output:
```
Taking screenshot...
Screenshot saved to screenshot.png
Size: 245678 bytes
```

### Step 8: Resize Viewport (Mobile Testing)

```bash
# Resize to mobile viewport
dv1 resize 375 667
```

Expected output:
```
Resizing viewport to 375x667...
Viewport resized
```

### Step 9: Monitor Console in Real-Time

```bash
# Monitor errors and warnings
dv1 monitor --types error,warn
```

Expected output:
```
Monitoring console messages (types: error, warn)...
Press Ctrl+C to stop

[error] Uncaught TypeError: Cannot read property 'x' of undefined
  at http://localhost:5178/app.js:45:20
[warn] Memory usage is high
  at http://localhost:5178/monitor.js:12:5
```

### Step 10: Tab Management

```bash
# Open a new tab
dv1 new http://localhost:5178/another-page.html

# List all tabs
dv1 tabs

# Select a different tab
dv1 select --index 2

# Or select by URL
dv1 select --index 2

# Close a tab
dv1 close <id>
```

Expected output:
```
Creating new tab: http://localhost:5178/another-page.html...
New tab created
ID: XYZ789ABC123...
URL: http://localhost:5178/another-page.html

Found 2 tab(s):

  1. 奇门遁甲宫
  ID:  ABC123DEF456...
  URL: http://localhost:5178/visual/components/奇门遁甲宫.html

  2. Another Page
  ID:  XYZ789ABC123...
  URL: http://localhost:5178/another-page.html

Selected tab: Another Page
URL: http://localhost:5178/another-page.html
ID: XYZ789ABC123...

Closing tab XYZ789ABC123...
Tab closed
```

## Parallel Testing Example

You can run multiple Chrome instances with different profiles for parallel testing:

```bash
# Terminal 1: Start dv1
dv1 start

# Terminal 2: Start dv2
dv2 start

# Terminal 3: Start dv3
dv3 start
```

Each profile runs on a different port:
- dv1 → port 9230
- dv2 → port 9231
- dv3 → port 9232

## Automated Testing Script

Create a bash script for automated testing:

```bash
#!/bin/bash
# test.sh

echo "Starting automated test..."

# Start Chrome
dv1 start

# Wait for Chrome to start
sleep 2

# Navigate
dv1 goto http://localhost:5178

# Check for errors
ERRORS=$(dv1 console --type error --json)

if [ "$ERRORS" != "[]" ]; then
  echo "Console errors found!"
  echo "$ERRORS"
  exit 1
fi

# Take screenshot
dv1 screenshot test-result.png

# Evaluate test
RESULT=$(dv1 eval --script "window.testResult" --json)

if [ "$RESULT" == "true" ]; then
  echo "Test passed!"
  exit 0
else
  echo "Test failed!"
  exit 1
fi
```

## Tips

1. **Use profile-specific commands**: `dv1`–`dv6` each manage a separate Chrome instance with its own user data
2. **Check console errors first**: Always check for console errors before debugging other issues
3. **Use --json for scripting**: When writing scripts, use --json to get machine-readable output
4. **Monitor in real-time**: Use `dv1 monitor` to catch errors as they happen
5. **Resize for mobile**: Use `dv1 resize` to test responsive designs
6. **Take screenshots**: Screenshots help document issues and verify UI behavior