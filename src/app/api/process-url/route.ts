import * as cheerio from 'cheerio';
import { chromium } from 'playwright-core';
import chromiumExecutable from '@sparticuz/chromium';
import { NextResponse } from 'next/server';

// Maximum time to wait for page load (in milliseconds)
const PAGE_TIMEOUT = 10000; // 10 seconds
const NAVIGATION_TIMEOUT = 15000; // 15 seconds

export async function POST(request: Request) {
  const { url, action } = await request.json();

  if (!url) {
    return NextResponse.json({ 
      success: false, 
      error: 'URL is required' 
    });
  }

  if (action === 'cheerio') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PAGE_TIMEOUT);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const content = $('.article__content').text();
      
      return NextResponse.json({ 
        success: true, 
        data: content.trim()
      });
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  }

  if (action === 'puppeteer') {
    let browser = null;
    try {
      // Optimize browser launch with minimal settings
      browser = await chromium.launch({
        args: [
          ...chromiumExecutable.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-extensions'
        ],
        executablePath: await chromiumExecutable.executablePath(),
        headless: true
      });

      const page = await browser.newPage();
      
      // Set viewport to reasonable size to limit screenshot size
      await page.setViewport({ width: 1280, height: 720 });
      
      // Set timeouts
      page.setDefaultTimeout(PAGE_TIMEOUT);
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

      // Navigate with timeout
      await Promise.race([
        page.goto(url, {
          waitUntil: 'domcontentloaded', // Use faster load strategy
          timeout: NAVIGATION_TIMEOUT
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation timeout')), NAVIGATION_TIMEOUT)
        )
      ]);

      // Take a screenshot with size limits
      const screenshot = await page.screenshot({
        type: 'jpeg', // Use JPEG for smaller file size
        quality: 80, // Reduce quality for smaller size
        fullPage: false // Only capture viewport
      });

      // Check if screenshot size is within limits (4.5MB)
      const maxSize = 4.5 * 1024 * 1024; // 4.5MB in bytes
      if (screenshot.length > maxSize) {
        throw new Error('Screenshot size exceeds Vercel payload limit');
      }

      return NextResponse.json({
        success: true,
        data: screenshot.toString('base64'),
        contentType: 'image/jpeg'
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      // Always close the browser
      if (browser) {
        await browser.close().catch(() => {}); // Ignore close errors
      }
    }
  }

  return NextResponse.json({
    success: false,
    error: 'Invalid action specified'
  });
} 