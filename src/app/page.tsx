'use client';

import { useState } from 'react';
import { processUrl, takeScreenshot } from './actions';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<{ success: boolean; data?: string; error?: string; message?: string; contentType?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'cheerio' | 'puppeteer' | null>(null);
  const [progress, setProgress] = useState(0);

  const handleCheerioFetch = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveAction('cheerio');
    setResult(null);
    setProgress(0);
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await processUrl(url);
      clearInterval(interval);
      setProgress(100);
      setResult(response);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    } finally {
      setIsLoading(false);
      setActiveAction(null);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handlePuppeteerScreenshot = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActiveAction('puppeteer');
    setResult(null);
    setProgress(0);
    
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const response = await takeScreenshot(url);
      clearInterval(interval);
      setProgress(100);
      setResult(response);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    } finally {
      setIsLoading(false);
      setActiveAction(null);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>URL Fetcher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleCheerioFetch}
                disabled={isLoading}
                variant="default"
              >
                {isLoading && activeAction === 'cheerio' ? (
                  'Processing...'
                ) : (
                  'Cheerio Fetch'
                )}
              </Button>
              <Button
                onClick={handlePuppeteerScreenshot}
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading && activeAction === 'puppeteer' ? (
                  'Processing...'
                ) : (
                  'Puppeteer Screenshot'
                )}
              </Button>
            </div>
            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? 'border-border' : 'border-destructive'}>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <>
                  {result.message && (
                    <p className="mb-4 text-muted-foreground">{result.message}</p>
                  )}
                  {result.contentType?.includes('image') ? (
                    <div className="relative w-full aspect-video">
                      <img 
                        src={`data:${result.contentType};base64,${result.data}`}
                        alt="Screenshot result"
                        className="rounded-md w-full h-auto object-contain"
                      />
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words bg-muted p-4 rounded-md text-sm">
                      {result.data}
                    </pre>
                  )}
                </>
              ) : (
                <p className="text-destructive">Error: {result.error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
