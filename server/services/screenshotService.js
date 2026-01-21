import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure screenshots directory exists
const SCREENSHOTS_DIR = path.join(__dirname, '../../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Capture screenshot of a Salesforce record page
 * @param {string} recordUrl - Full Salesforce record URL
 * @param {string} accessToken - Salesforce access token
 * @param {string} instanceUrl - Salesforce instance URL
 * @param {string} recordId - Record ID for file naming
 * @param {string} objectApiName - Object API name for file naming
 * @param {string} upgradeState - 'before' or 'after' upgrade
 * @returns {Promise<Object>} Screenshot metadata
 */
export async function captureRecordScreenshot(recordUrl, accessToken, instanceUrl, recordId, objectApiName, upgradeState = 'before') {
  let browser = null;
  let page = null;

  try {
    console.log('Starting Playwright browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create new context
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    page = await context.newPage();

    // For Salesforce Lightning, we need to authenticate properly
    // Set up authentication headers and cookies
    const instanceHost = new URL(instanceUrl).hostname;
    const recordHost = new URL(recordUrl).hostname;
    
    // Set Authorization header for API calls
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    // Set session cookie (Salesforce uses 'sid' cookie for Lightning UI)
    // Also set cookies for both instance and record domains
    const cookies = [
      {
        name: 'sid',
        value: accessToken,
        domain: instanceHost,
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      }
    ];

    // If record is on a different domain (e.g., sandbox), add cookie for that domain too
    if (recordHost !== instanceHost) {
      cookies.push({
        name: 'sid',
        value: accessToken,
        domain: recordHost,
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      });
    }

    await context.addCookies(cookies);
    
    console.log('Authentication cookies set for domains:', instanceHost, recordHost !== instanceHost ? `and ${recordHost}` : '');

    // Navigate to record page with authentication
    console.log('Navigating to record:', recordUrl);
    
    // Use domcontentloaded first, then wait for specific elements
    // This is more reliable than networkidle for Lightning pages
    await page.goto(recordUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 120000 // Increased to 2 minutes for slow Lightning pages
    });

    // Check if we were redirected to login
    const currentUrl = page.url();
    console.log('Current page URL after navigation:', currentUrl);
    
    if (currentUrl.includes('login.salesforce.com') || currentUrl.includes('/login') || currentUrl.includes('secur/login')) {
      // Take a screenshot for debugging
      const debugScreenshot = path.join(SCREENSHOTS_DIR, `debug-login-redirect-${Date.now()}.png`);
      await page.screenshot({ path: debugScreenshot });
      console.error('Debug screenshot saved to:', debugScreenshot);
      throw new Error('Authentication failed: Redirected to login page. The access token may be expired or invalid. For Lightning UI, you may need to use a different authentication method.');
    }

    // Wait for Lightning page to initialize (look for Lightning-specific elements)
    console.log('Waiting for Lightning page to load...');
    try {
      // Wait for either the record header or any Lightning component
      await Promise.race([
        page.waitForSelector('h1.slds-page-header__title, .slds-page-header, [data-aura-class*="recordHeader"]', { timeout: 60000 }),
        page.waitForTimeout(10000) // Fallback: wait 10 seconds if selector doesn't appear
      ]);
    } catch (waitError) {
      console.warn('Warning: Could not find expected Lightning elements, proceeding anyway...');
    }

    // Wait for dynamic content to load - increased wait time for better page loading
    console.log('Waiting for page content to fully load...');
    await page.waitForTimeout(10000); // Increased to 10 seconds

    // Wait for any loading spinners to disappear
    try {
      await page.waitForFunction(() => {
        const spinners = document.querySelectorAll('[class*="spinner"], [class*="loading"], .slds-spinner');
        return Array.from(spinners).every(spinner => {
          const style = window.getComputedStyle(spinner);
          return style.display === 'none' || style.visibility === 'hidden';
        });
      }, { timeout: 30000 }).catch(() => {
        console.warn('Some loading indicators may still be visible, proceeding...');
      });
    } catch (e) {
      console.warn('Could not wait for spinners, proceeding...');
    }

    // Additional wait to ensure all API calls complete
    await page.waitForTimeout(5000);

    // Scroll to load all content
    await autoScroll(page);

    // Final wait after scrolling
    await page.waitForTimeout(3000);

    // Capture full page screenshot with new naming: objectApiName.recordId.before/after.png
    const screenshotFilename = `${objectApiName}.${recordId}.${upgradeState}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);

    console.log('Capturing full page screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });

    // Get page title and record name
    const pageTitle = await page.title();
    const recordName = await extractRecordName(page);

    return {
      screenshotPath: screenshotPath,
      screenshotFilename: screenshotFilename,
      recordUrl: recordUrl,
      recordId: recordId,
      objectApiName: objectApiName,
      upgradeState: upgradeState,
      recordName: recordName,
      pageTitle: pageTitle,
      capturedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Auto-scroll page to load all content
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Capture related lists information from the page
 */
async function captureRelatedLists(page) {
  try {
    const relatedLists = await page.evaluate(() => {
      const lists = [];
      
      // Find all related list containers
      const relatedListSections = document.querySelectorAll('[data-aura-class*="RelatedList"], .relatedListContainer, [id*="RelatedList"]');
      
      relatedListSections.forEach((section, index) => {
        try {
          // Get related list label
          const labelElement = section.querySelector('h2, .slds-text-heading_small, [class*="title"]');
          const label = labelElement ? labelElement.textContent.trim() : `Related List ${index + 1}`;
          
          // Get record count if available
          const countElement = section.querySelector('[class*="count"], .slds-badge');
          const count = countElement ? countElement.textContent.trim() : null;
          
          // Get record IDs from data attributes or links
          const recordLinks = section.querySelectorAll('a[href*="/lightning/r/"], a[href*="/"][data-recordid]');
          const recordIds = Array.from(recordLinks).map(link => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/([a-zA-Z0-9]{15,18})\//);
            return match ? match[1] : null;
          }).filter(id => id !== null);
          
          // Get bounding box for screenshot area
          const rect = section.getBoundingClientRect();
          
          if (label && rect.width > 0 && rect.height > 0) {
            lists.push({
              label: label,
              count: count,
              recordIds: [...new Set(recordIds)], // Remove duplicates
              position: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              }
            });
          }
        } catch (err) {
          console.error('Error extracting related list:', err);
        }
      });
      
      return lists;
    });

    return relatedLists;
  } catch (error) {
    console.error('Error capturing related lists:', error);
    return [];
  }
}

/**
 * Extract record name from page
 */
async function extractRecordName(page) {
  try {
    const recordName = await page.evaluate(() => {
      // Try multiple selectors for record name
      const selectors = [
        'h1.slds-page-header__title',
        '.slds-text-heading_large',
        '[data-aura-class*="recordTitle"]',
        'h1'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }
      
      return document.title || 'Unknown Record';
    });

    return recordName;
  } catch (error) {
    console.error('Error extracting record name:', error);
    return 'Unknown Record';
  }
}

/**
 * Capture screenshot of specific related list section
 */
export async function captureRelatedListScreenshot(page, relatedList, outputPath) {
  try {
    const { position } = relatedList;
    
    await page.screenshot({
      path: outputPath,
      clip: {
        x: position.x,
        y: position.y,
        width: Math.min(position.width, 1920),
        height: Math.min(position.height, 5000)
      }
    });

    return true;
  } catch (error) {
    console.error('Error capturing related list screenshot:', error);
    return false;
  }
}
