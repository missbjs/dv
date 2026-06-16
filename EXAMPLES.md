# dv-cli Usage Examples

## Complete Example: Testing a Web Application

This example shows a complete workflow for testing a web application with dv-cli.

### Step 1: Start Chrome

```bash
# Start Chrome with profile-qmdj-1 in headed mode
dv start --profile profile-qmdj-1 --headed
```

Expected output:
```
Starting Chrome on port 9222...
Profile: profile-qmdj-1
Headed: yes
Chrome started successfully on port 9222
DevTools URL: http://localhost:9222
```

### Step 2: Navigate to the Application

```bash
# Navigate to your application
dv navigate --url http://localhost:5178/visual/components/奇门遁甲宫.html
```

Expected output:
```
Navigating to http://localhost:5178/visual/components/奇门遁甲宫.html...
Navigation complete
```

### Step 3: List All Pages

```bash
# List all open pages
dv pages
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
dv eval --script "document.title"

# Count elements
dv eval --script "document.querySelectorAll('sy-奇门遁甲宫').length"

# Execute script file
dv eval --file test-script.js --json
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
dv click --selector "#submit-btn"

# Fill a form
dv fill --selector "#username" --value "test@example.com"
dv fill --selector "#password" --value "password123"

# Type text (appends)
dv type --selector "#search" --text "奇门遁甲"

# Press Enter
dv key --key Enter
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
dv console --type error

# Check for warnings
dv console --type warn

# Filter logs by pattern
dv console --type log --filter "API"
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
dv screenshot --output screenshot.png
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
dv resize --width 375 --height 667
```

Expected output:
```
Resizing viewport to 375x667...
Viewport resized
```

### Step 9: Monitor Console in Real-Time

```bash
# Monitor errors and warnings
dv monitor --types error,warn
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
dv new --url http://localhost:5178/another-page.html

# List all pages
dv pages

# Select a different page
dv select --index 2

# Or select by URL
dv select --url "another-page"

# Close the current page
dv close
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
dv start --profile profile-qmdj-1 --headed

# Terminal 2: Start profile 2
dv start --profile profile-qmdj-2 --headed

# Terminal 3: Start profile 3
dv start --profile profile-qmdj-3 --headed
```

Each profile runs on a different port:
- profile-qmdj-1 → port 9222
- profile-qmdj-2 → port 9223
- profile-qmdj-3 → port 9224

## Automated Testing Script

Create a bash script for automated testing:

```bash
#!/bin/bash
# test.sh

echo "Starting automated test..."

# Start Chrome
dv start --profile profile-qmdj-1

# Wait for Chrome to start
sleep 2

# Navigate
dv navigate --url http://localhost:5178

# Check for errors
ERRORS=$(dv console --type error --json)

if [ "$ERRORS" != "[]" ]; then
  echo "Console errors found!"
  echo "$ERRORS"
  exit 1
fi

# Take screenshot
dv screenshot --output test-result.png

# Evaluate test
RESULT=$(dv eval --script "window.testResult" --json)

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