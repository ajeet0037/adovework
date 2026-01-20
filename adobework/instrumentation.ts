/**
 * Instrumentation file for Next.js
 * Runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side only initialization
    console.log('🚀 AdobeWork server starting...');
    
    // Check Python backend health if configured
    if (process.env.PYTHON_BACKEND_URL) {
      try {
        const { checkPythonBackendHealth } = await import('@/lib/api/pythonBackend');
        const isHealthy = await checkPythonBackendHealth();
        
        if (isHealthy) {
          console.log('✅ Python backend is healthy');
        } else {
          console.warn('⚠️  Python backend is not responding - server-side conversions will fail');
        }
      } catch (error) {
        console.warn('⚠️  Could not check Python backend health:', error);
      }
    } else {
      console.log('ℹ️  Python backend not configured - using client-side processing only');
    }
    
    console.log('✅ AdobeWork server ready');
  }
}
