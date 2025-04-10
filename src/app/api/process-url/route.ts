import * as cheerio from 'cheerio';
import { chromium } from 'playwright-core';
import chromiumExecutable from '@sparticuz/chromium';
import { NextResponse } from 'next/server';

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
      const response = await fetch(url);
      const html = await response.text();
      
      // Use cheerio to parse HTML
      const $ = cheerio.load(html);
      
      // Extract just the article content
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

      return NextResponse.json({
        success: true,
        data: screenshot.toString('base64'),
        contentType: 'image/png'
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      // Always close the browser
      if (browser) {
        await browser.close();
      }
    }
  }

  return NextResponse.json({
    success: false,
    error: 'Invalid action specified'
  });
} 