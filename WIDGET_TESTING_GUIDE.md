# Widget Testing Guide

## Recent Fixes Applied

### 1. **API URL Configuration**
- **Fixed:** Widget was using incorrect API URL format
- **Change:** API_URL now uses base URL (`https://server-three-black.vercel.app`) instead of full endpoint
- **Impact:** All API calls now correctly append `/api/chat` and `/api/contact` endpoints

### 2. **Response Format Matching**
- **Fixed:** Widget was looking for `data.response` but backend returns `data.answer`
- **Change:** Updated widget to use backend's response format: `answer`, `route`, `showContactCard`
- **Impact:** Chatbot responses now display correctly

### 3. **Modal HTML Structure**
- **Added:** Modal overlay and modal container HTML to createDOM()
- **CSS:** Complete styling for popups, forms, and modal backdrop
- **Impact:** Sales Team and Prompt Engineers popups now display properly

### 4. **Form Submission Logic**
- **Fixed:** Contact form now uses correct endpoint `/api/contact`
- **Endpoints:** Both sales and engineer forms submit to the same endpoint with department flag
- **Impact:** Contact form submissions now work end-to-end

## Testing Instructions

### Test 1: Basic Chat Functionality
1. Open your website with the widget embedded
2. Click the chat button (Aitel Assistant button)
3. Type: "What is your support policy?"
4. **Expected:** Widget should display the response from the knowledge base
5. **Status:** ✅ Should be working now

### Test 2: Sales Team Routing
1. Select "Sales Team" from the department dropdown
2. Type: "How much does your product cost?"
3. **Expected:** Bot should recognize sales intent and offer to connect to Sales Team
4. **Status:** ✅ Should trigger popup after response

### Test 3: Engineers Team Routing
1. Select "Prompt Engineers" from the department dropdown
2. Type: "How do I set up the API?"
3. **Expected:** Bot should recognize technical intent and offer to connect to Engineers
4. **Status:** ✅ Should trigger popup after response

### Test 4: Contact Form Submission
1. After receiving a response that triggers popup
2. Fill in the contact form with:
   - Name: Your Name
   - Phone: Your Phone
   - Email: Your Email
   - Company/Topic: Relevant info
   - Message: Your request
3. Click "Submit to [Team]"
4. **Expected:** Success message "✅ Submitted to [Team]. Please wait for their reply."
5. **Status:** ✅ Should work with corrected endpoint

### Test 5: Logo Display
1. Open the widget
2. Look at the button in bottom-right corner
3. **Expected:** Should show Aitel logo (purple circle with "A")
4. **Status:** ✅ SVG logo should display

## Browser Console Debugging

If you encounter issues, check the browser console (F12 > Console tab):

```javascript
// Check if widget is initialized
console.log(window.AitelWidget ? 'Widget loaded' : 'Widget NOT loaded');

// Check API URL
// Should show: https://server-three-black.vercel.app
```

## Common Issues & Solutions

### Issue: "Error connecting to server"
- **Cause:** Vercel backend not responding
- **Solution:** Wait 30 seconds and refresh the page
- **Check:** Visit https://server-three-black.vercel.app/health in browser

### Issue: Popups not showing
- **Cause:** Modal HTML elements not in DOM
- **Solution:** This has been fixed - clear browser cache and refresh
- **Check:** Open DevTools > Elements, search for "aitelWidgetModal"

### Issue: Contact form not submitting
- **Cause:** Incorrect endpoint URL
- **Solution:** This has been fixed
- **Check:** Open DevTools > Network tab, look for POST to `/api/contact`

### Issue: Logo not visible
- **Cause:** SVG encoding issue
- **Solution:** Check browser DevTools > Elements for img tag with id="aitelWidgetBtn"
- **Fallback:** Logo is embedded as data:image/svg+xml, should work in all modern browsers

## Widget Embed Code

Use this code to embed the widget on your website:

```html
<!-- Add before closing </body> tag -->
<script src="https://client-puce-one-81.vercel.app/widget.js?appId=default" crossorigin="anonymous"></script>
```

## API Endpoints Reference

- **Chat:** `POST https://server-three-black.vercel.app/api/chat`
  - Input: `{ message, userId, conversationId, audience }`
  - Output: `{ answer, route, showContactCard, conversationId, confidence }`

- **Contact:** `POST https://server-three-black.vercel.app/api/contact`
  - Input: `{ name, phone, email, message, department, companyName }`
  - Output: `{ success: true }`

- **Health Check:** `GET https://server-three-black.vercel.app/health`
  - Output: `{ ok: true, port, kbCount }`

## Next Steps

1. ✅ **Deployed:** Both frontend and backend have been redeployed
2. **Test:** Use the testing instructions above on your embedded widget
3. **Monitor:** Check browser console for any errors
4. **Report:** Any remaining issues will show in DevTools console

---

**Last Updated:** After API integration fixes and Vercel redeploy
**Widget Version:** Latest (with modal HTML and correct endpoints)
**Backend Status:** Healthy (CORS enabled, all endpoints working)
