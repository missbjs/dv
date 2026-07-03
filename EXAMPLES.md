# dv-cli Usage Examples

## Complete Example: Testing a Web Application

This example shows a complete workflow for testing a web application with dv-cli.

### Step 1: Start Chrome

```bash
# Start Chrome with profile-1 in headed mode
dv start --profile profile-1 --headed
```

Expected output:
```
Starting Chrome on port 9230...
Profile: profile-1
Headed: yes
Chrome started successfully on port 9230
DevTools URL: http://localhost:9230
```

### Step 2: Navigate to the Application

```bash
# Navigate to your application
dv navigate --profile profile-1 --url http://localhost:5178/visual/components/奇门遁甲宫.html
```

Expected output:
```
Navigating to http://localhost:5178/visual/components/奇门遁甲宫.html...
Navigation complete
```

### Step 3: List All Pages

```bash
# List all open pages
dv pages --profile profile-1
```

Expected output:
```
Found 1 page(s):

* 1. 奇门遁甲宫
  ID:  ABC123DEF456...
  URL: http://localhost:5178/visual/components/奇门遁甲宫.html
```

### Step 4: Evaluate Scripts

```bash
# Get page title
dv eval --profile profile-1 --script "document.title"

# Count elements
dv eval --profile profile-1 --script "document.querySelectorAll('sy-奇门遁甲宫').length"

# Execute script file
dv eval --profile profile-1 --file test-script.js --json
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
dv click --profile profile-1 --selector "#submit-btn"

# Fill a form
dv fill --profile profile-1 --selector "#username" --value "test@example.com"
dv fill --profile profile-1 --selector "#password" --value "password123"

# Type text (appends)
dv type --profile profile-1 --selector "#search" --text "奇门遁甲"

# Press Enter
dv key --profile profile-1 --key Enter
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
dv console --profile profile-1 --type error

# Check for warnings
dv console --profile profile-1 --type warn

# Filter logs by pattern
dv console --profile profile-1 --type log --filter "API"
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
dv screenshot --profile profile-1 --output screenshot.png
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
dv resize --profile profile-1 --width 375 --height 667
```

Expected output:
```
Resizing viewport to 375x667...
Viewport resized
```

### Step 9: Monitor Console in Real-Time

```bash
# Monitor errors and warnings
dv monitor --profile profile-1 --types error,warn
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

### Step 10: Page Management

```bash
# Open a new page
dv new --profile profile-1 --url http://localhost:5178/another-page.html

# List all pages
dv pages --profile profile-1

# Select a different page
dv select --profile profile-1 --index 2

# Or select by URL
dv select --profile profile-1 --url "another-page"

# Close the current page
dv close --profile profile-1
```

Expected output:
```
Creating new page: http://localhost:5178/another-page.html...
New page created
ID: XYZ789ABC123...
URL: http://localhost:5178/another-page.html

Found 2 page(s):

  1. 奇门遁甲宫
  ID:  ABC123DEF456...
  URL: http://localhost:5178/visual/components/奇门遁甲宫.html

* 2. Another Page
  ID:  XYZ789ABC123...
  URL: http://localhost:5178/another-page.html

Selected page: Another Page
URL: http://localhost:5178/another-page.html
ID: XYZ789ABC123...

Closing page XYZ789ABC123...
Page closed
```

## Parallel Testing Example

You can run multiple Chrome instances with different profiles for parallel testing:

```bash
# Terminal 1: Start profile 1
dv start --profile profile-1 --headed

# Terminal 2: Start profile 2
dv start --profile profile-2 --headed

# Terminal 3: Start profile 3
dv start --profile profile-3 --headed
```

Each profile runs on a different port:
- profile-1 → port 9230
- profile-2 → port 9231
- profile-3 → port 9232

## Automated Testing Script

Create a bash script for automated testing:

```bash
#!/bin/bash
# test.sh

echo "Starting automated test..."

# Start Chrome
dv start --profile profile-1

# Wait for Chrome to start
sleep 2

# Navigate
dv navigate --profile profile-1 --url http://localhost:5178

# Check for errors
ERRORS=$(dv console --profile profile-1 --type error --json)

if [ "$ERRORS" != "[]" ]; then
  echo "Console errors found!"
  echo "$ERRORS"
  exit 1
fi

# Take screenshot
dv screenshot --profile profile-1 --output test-result.png

# Evaluate test
RESULT=$(dv eval --profile profile-1 --script "window.testResult" --json)

if [ "$RESULT" == "true" ]; then
  echo "Test passed!"
  exit 0
else
  echo "Test failed!"
  exit 1
fi
```

## Tips

1. **Always use profiles**: Profiles allow you to maintain separate Chrome instances and user data
2. **Check console errors first**: Always check for console errors before debugging other issues
3. **Use --json for scripting**: When writing scripts, use --json to get machine-readable output
4. **Monitor in real-time**: Use `dv monitor` to catch errors as they happen
5. **Resize for mobile**: Use `dv resize` to test responsive designs
6. **Take screenshots**: Screenshots help document issues and verify UI behavior
