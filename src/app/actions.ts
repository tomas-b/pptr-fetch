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

    browser = await chromium.launch({
      args: chromiumExecutable.args,
      executablePath: await chromiumExecutable.executablePath(),
      headless: true
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Navigate to the URL
    await page.goto(url, {
      waitUntil: 'networkidle'
    });

    // Take a screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true
    });

    return {
      success: true,
      data: screenshot.toString('base64'),
      contentType: 'image/png'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    };
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}