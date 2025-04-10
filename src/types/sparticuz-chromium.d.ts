declare module '@sparticuz/chromium' {
  const args: string[];
  function executablePath(): Promise<string>;
  
  export { args, executablePath };
  export default { args, executablePath };
} 