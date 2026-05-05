console.log('Testing server imports...');

try {
  // Just test the imports
  const serverModule = await import('./server.js');
  console.log('✅ Server imports successfully');
} catch (error) {
  console.error('❌ Server import failed:', error.message);
}
