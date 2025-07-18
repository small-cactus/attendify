#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🐛 Starting Clubs Page Animation Debug Test');
console.log('==========================================');

console.log('\n1. Starting the development server...');
const devServer = exec('npm run dev', { cwd: __dirname });

let serverReady = false;

devServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Local:') && !serverReady) {
    serverReady = true;
    console.log('\n✅ Development server is ready!');
    console.log('\n📋 Debug Instructions:');
    console.log('======================');
    console.log('1. Open your browser to: http://localhost:5173');
    console.log('2. Navigate to the Clubs page');
    console.log('3. Look for the Debug Panel in the top-right corner');
    console.log('4. Refresh the page and watch the timing logs');
    console.log('5. The logs will show:');
    console.log('   - [RENDER] - Component re-renders');
    console.log('   - [STATE] - State changes'); 
    console.log('   - [ANIMATION] - Animation events');
    console.log('   - [ERROR] - Any errors');
    console.log('\n🔍 What to look for:');
    console.log('=====================');
    console.log('- Multiple rapid renders after data loads');
    console.log('- Time gaps between shouldAnimate=true and actual animation');
    console.log('- Unexpected state changes causing re-renders');
    console.log('- Animation start/complete timing mismatches');
    console.log('\n⏹️  Press Ctrl+C to stop the debug session');
  }
});

devServer.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping debug session...');
  devServer.kill('SIGINT');
  process.exit(0);
});

// Keep the process alive
process.stdin.resume();