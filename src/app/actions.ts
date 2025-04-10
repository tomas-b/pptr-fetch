'use server'
import * as cheerio from 'cheerio';
import { chromium } from 'playwright-core';
import chromiumExecutable from '@sparticuz/chromium';

export async function processUrl(url: string) {
  try {
    if (!url) {
      throw new Error('URL is required');
    }
    
    const response = await fetch(url);
    const html = await response.text();
    
    // Use cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Extract just the article content
    const content = $('.article__content').text();
    
    return { 
      success: true, 
      data: content.trim()
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    };
  }
}

export async function takeScreenshot(url: string) {
  let browser = null;
  
  try {
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Launching browser...');
    // Launch the browser with serverless-compatible configuration
    browser = await chromium.launch({
      args: [
        ...chromiumExecutable.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
      ],
      executablePath: await chromiumExecutable.executablePath(),
      headless: true
    });

    console.log('Creating new page...');
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport to a reasonable size
    await page.setViewport({
      width: 1280,
      height: 720
    });
    
    console.log('Navigating to URL:', url);
    // Navigate to the URL with a timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 15000 // 15 second timeout
    });

    console.log('Taking screenshot...');
    // Take a screenshot with quality and size optimizations
    const screenshot = await page.screenshot({
      type: 'jpeg', // Use JPEG instead of PNG for smaller file size
      quality: 80,  // Reduce quality for smaller file size
      fullPage: false // Only capture viewport
    });

    console.log('Processing screenshot...');
    const base64Image = screenshot.toString('base64');

    return {
      success: true,
      data: base64Image,
      contentType: 'image/jpeg'
    };

  } catch (error) {
    console.error('Screenshot error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during screenshot capture'
    };
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}