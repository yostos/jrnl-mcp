#!/usr/bin/env node
/**
 * Script to find console.* usage in TypeScript/JavaScript files
 * and suggest proper MCP logging alternatives
 */

const fs = require('fs');
const path = require('path');

function findFilesRecursively(dir, extensions = ['.ts', '.js']) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function findConsoleUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];
  
  lines.forEach((line, index) => {
    // Match console.* calls, but not commented ones
    const consoleMatch = line.match(/(?<!\/\/.*)(console\.[a-zA-Z]+\()/);
    if (consoleMatch) {
      matches.push({
        line: index + 1,
        content: line.trim(),
        type: consoleMatch[1]
      });
    }
  });
  
  return matches;
}

function suggestReplacement(consoleType) {
  const replacements = {
    'console.log(': 'await logger.info(',
    'console.info(': 'await logger.info(',
    'console.warn(': 'await logger.warning(',
    'console.error(': 'await logger.error(',
    'console.debug(': 'await logger.debug(',
  };
  
  return replacements[consoleType] || 'await logger.info(';
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log('No src directory found');
    return;
  }
  
  const files = findFilesRecursively(srcDir);
  let totalIssues = 0;
  
  console.log('🔍 Checking for console.* usage in MCP server...\n');
  
  files.forEach(file => {
    const matches = findConsoleUsage(file);
    
    if (matches.length > 0) {
      console.log(`📄 ${path.relative(process.cwd(), file)}`);
      totalIssues += matches.length;
      
      matches.forEach(match => {
        console.log(`  ❌ Line ${match.line}: ${match.content}`);
        console.log(`     Suggestion: ${match.content.replace(match.type, suggestReplacement(match.type))}`);
        console.log('');
      });
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ No console.* usage found! Your MCP server is safe for stdio transport.');
  } else {
    console.log(`❌ Found ${totalIssues} console usage(s) that could break MCP stdio transport.`);
    console.log('\n📝 To fix these issues:');
    console.log('1. Add the MCPLogger to your file:');
    console.log('   import { MCPLogger } from "./utils/logger.js";');
    console.log('2. Initialize the logger:');
    console.log('   const logger = new MCPLogger(server);');
    console.log('3. Replace console.* calls with logger methods');
    console.log('4. Enable logging capability in your server configuration');
    console.log('\n📖 See docs/MCP_LOGGING_GUIDE.md for complete usage instructions.');
  }
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}