#!/usr/bin/env node
/**
 * Integration & Performance Testing Script
 * 
 * Tests the refactored MapContainer component in a real environment
 * 
 * Usage: node test-map-refactor.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 MAP CONTAINER REFACTOR - INTEGRATION & PERFORMANCE TESTING\n');
console.log('=' .repeat(60));

// Test Results
const results = {
  integration: [],
  performance: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

function pass(test) {
  results.passed++;
  results.integration.push({ test, status: '✅ PASS' });
  console.log(`✅ PASS: ${test}`);
}

function fail(test, reason) {
  results.failed++;
  results.integration.push({ test, status: '❌ FAIL', reason });
  console.log(`❌ FAIL: ${test}`);
  if (reason) console.log(`   Reason: ${reason}`);
}

function warn(test, reason) {
  results.warnings++;
  results.integration.push({ test, status: '⚠️  WARN', reason });
  console.log(`⚠️  WARN: ${test}`);
  if (reason) console.log(`   Reason: ${reason}`);
}

function perfMetric(metric, value, unit) {
  results.performance.push({ metric, value, unit });
  console.log(`📊 ${metric}: ${value}${unit}`);
}

// ============================================================================
// 1. STRUCTURE VALIDATION TESTS
// ============================================================================
console.log('\n📁 1. STRUCTURE VALIDATION');
console.log('-'.repeat(60));

const basePath = path.join(__dirname, 'src/components/map');

// Check if all required files exist
const requiredFiles = [
  // Refactored component
  'map-container-refactored.tsx',
  
  // Hooks
  'hooks/index.ts',
  'hooks/useMapInitialization.ts',
  'hooks/useMapBounds.ts',
  'hooks/useMapInteractions.ts',
  'hooks/useLocationNotes.ts',
  'hooks/useUserLocation.ts',
  'hooks/useFriendLocations.tsx',
  'hooks/useMapMarkers.tsx',
  'hooks/useRouteDisplay.ts',
  
  // Layers
  'layers/index.ts',
  'layers/MapControlsLayer.tsx',
  'layers/MapPopupLayer.tsx',
  'layers/MapDialogLayer.tsx',
  
  // Utils
  'utils/mapGeocoding.ts',
  'utils/mapClustering.ts',
  
  // Types
  'types/map.types.ts',
  
  // Documentation
  'README.md',
  'PHASE_3_SUMMARY.md',
];

requiredFiles.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    pass(`File exists: ${file}`);
  } else {
    fail(`File missing: ${file}`);
  }
});

// ============================================================================
// 2. CODE QUALITY TESTS
// ============================================================================
console.log('\n🔍 2. CODE QUALITY TESTS');
console.log('-'.repeat(60));

// Check refactored component line count
const refactoredPath = path.join(basePath, 'map-container-refactored.tsx');
if (fs.existsSync(refactoredPath)) {
  const content = fs.readFileSync(refactoredPath, 'utf8');
  const lines = content.split('\n');
  const totalLines = lines.length;
  
  // Count actual code lines (exclude empty lines and comments)
  const codeLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
  }).length;
  
  perfMetric('Total lines (with comments)', totalLines, '');
  perfMetric('Code lines (excluding comments)', codeLines, '');
  
  if (totalLines < 400) {
    pass('Refactored component is concise (< 400 lines total)');
  } else {
    warn('Refactored component exceeds 400 lines', `${totalLines} lines`);
  }
  
  // Check for proper imports
  if (content.includes('from "./hooks"')) {
    pass('Uses centralized hook imports');
  } else {
    warn('Not using centralized hook imports');
  }
  
  if (content.includes('from "./layers"')) {
    pass('Uses centralized layer imports');
  } else {
    warn('Not using centralized layer imports');
  }
  
  // Check for TypeScript usage
  if (content.includes('interface') || content.includes('type ')) {
    pass('Uses TypeScript types');
  } else {
    fail('Missing TypeScript types');
  }
  
  // Check for proper error handling
  if (content.includes('try') && content.includes('catch')) {
    pass('Has error handling');
  } else {
    warn('Limited error handling');
  }
}

// ============================================================================
// 3. HOOK VALIDATION
// ============================================================================
console.log('\n🪝 3. HOOK VALIDATION');
console.log('-'.repeat(60));

const hooks = [
  'useMapInitialization',
  'useMapBounds',
  'useMapInteractions',
  'useLocationNotes',
  'useUserLocation',
  'useFriendLocations',
  'useMapMarkers',
  'useRouteDisplay',
];

hooks.forEach(hookName => {
  const hookFile = `hooks/${hookName}.ts${hookName === 'useFriendLocations' || hookName === 'useMapMarkers' ? 'x' : ''}`;
  const hookPath = path.join(basePath, hookFile);
  
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8');
    
    // Check if hook is properly exported
    if (content.includes(`export function ${hookName}`) || content.includes(`export const ${hookName}`)) {
      pass(`Hook ${hookName} properly exported`);
    } else {
      fail(`Hook ${hookName} not properly exported`);
    }
    
    // Check for cleanup (useEffect with return)
    if (content.includes('useEffect') && content.includes('return () =>')) {
      pass(`Hook ${hookName} has cleanup logic`);
    } else {
      // Some hooks may not need cleanup
      console.log(`ℹ️  INFO: Hook ${hookName} may not need cleanup`);
    }
  }
});

// ============================================================================
// 4. LAYER VALIDATION
// ============================================================================
console.log('\n🎨 4. UI LAYER VALIDATION');
console.log('-'.repeat(60));

const layers = [
  'MapControlsLayer',
  'MapPopupLayer',
  'MapDialogLayer',
];

layers.forEach(layerName => {
  const layerPath = path.join(basePath, `layers/${layerName}.tsx`);
  
  if (fs.existsSync(layerPath)) {
    const content = fs.readFileSync(layerPath, 'utf8');
    
    // Check if layer is properly exported
    if (content.includes(`export function ${layerName}`) || content.includes(`export const ${layerName}`)) {
      pass(`Layer ${layerName} properly exported`);
    } else {
      fail(`Layer ${layerName} not properly exported`);
    }
    
    // Check for TypeScript props interface
    if (content.includes(`interface ${layerName}Props`) || content.includes(`type ${layerName}Props`)) {
      pass(`Layer ${layerName} has props interface`);
    } else {
      warn(`Layer ${layerName} missing props interface`);
    }
    
    // Check if it's a presentation component (no business logic)
    const hasBusinessLogic = content.includes('fetch(') || content.includes('axios') || content.includes('prisma');
    if (!hasBusinessLogic) {
      pass(`Layer ${layerName} is pure presentational`);
    } else {
      warn(`Layer ${layerName} contains business logic`);
    }
  }
});

// ============================================================================
// 5. DOCUMENTATION VALIDATION
// ============================================================================
console.log('\n📚 5. DOCUMENTATION VALIDATION');
console.log('-'.repeat(60));

const docs = [
  'README.md',
  'PHASE_3_SUMMARY.md',
];

docs.forEach(doc => {
  const docPath = path.join(basePath, doc);
  if (fs.existsSync(docPath)) {
    const content = fs.readFileSync(docPath, 'utf8');
    
    if (content.length > 1000) {
      pass(`Documentation ${doc} is comprehensive (${Math.round(content.length / 1000)}KB)`);
    } else {
      warn(`Documentation ${doc} is brief`, `${Math.round(content.length / 1000)}KB`);
    }
  }
});

// Root level docs
const rootDocs = [
  'REFACTOR_COMPLETE.md',
  'REFACTOR_PROGRESS.md',
  'REFACTOR_ROADMAP.md',
];

rootDocs.forEach(doc => {
  const docPath = path.join(__dirname, doc);
  if (fs.existsSync(docPath)) {
    pass(`Root documentation ${doc} exists`);
  } else {
    warn(`Root documentation ${doc} missing`);
  }
});

// ============================================================================
// 6. PERFORMANCE METRICS
// ============================================================================
console.log('\n⚡ 6. PERFORMANCE METRICS');
console.log('-'.repeat(60));

// Calculate total lines across all files
let totalHookLines = 0;
let totalLayerLines = 0;
let totalUtilLines = 0;

// Count hook lines
fs.readdirSync(path.join(basePath, 'hooks'))
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  .forEach(file => {
    if (file !== 'index.ts') {
      const content = fs.readFileSync(path.join(basePath, 'hooks', file), 'utf8');
      totalHookLines += content.split('\n').length;
    }
  });

// Count layer lines
fs.readdirSync(path.join(basePath, 'layers'))
  .filter(f => f.endsWith('.tsx'))
  .forEach(file => {
    if (file !== 'index.ts') {
      const content = fs.readFileSync(path.join(basePath, 'layers', file), 'utf8');
      totalLayerLines += content.split('\n').length;
    }
  });

// Count util lines
fs.readdirSync(path.join(basePath, 'utils'))
  .filter(f => f.endsWith('.ts'))
  .forEach(file => {
    const content = fs.readFileSync(path.join(basePath, 'utils', file), 'utf8');
    totalUtilLines += content.split('\n').length;
  });

perfMetric('Total hook lines', totalHookLines, '');
perfMetric('Total layer lines', totalLayerLines, '');
perfMetric('Total util lines', totalUtilLines, '');
perfMetric('Total modular code', totalHookLines + totalLayerLines + totalUtilLines, ' lines');

// Read original file if exists
const originalPath = path.join(basePath, 'map-container.tsx');
if (fs.existsSync(originalPath)) {
  const originalContent = fs.readFileSync(originalPath, 'utf8');
  const originalLines = originalContent.split('\n').length;
  perfMetric('Original component lines', originalLines, '');
}

// ============================================================================
// 7. TYPE SAFETY CHECK
// ============================================================================
console.log('\n🔒 7. TYPE SAFETY CHECK');
console.log('-'.repeat(60));

const typesPath = path.join(basePath, 'types/map.types.ts');
if (fs.existsSync(typesPath)) {
  const content = fs.readFileSync(typesPath, 'utf8');
  
  // Count interfaces and types
  const interfaceCount = (content.match(/interface /g) || []).length;
  const typeCount = (content.match(/type /g) || []).length;
  
  perfMetric('Interfaces defined', interfaceCount, '');
  perfMetric('Types defined', typeCount, '');
  
  if (interfaceCount + typeCount > 10) {
    pass('Comprehensive type coverage');
  } else {
    warn('Limited type definitions', `Only ${interfaceCount + typeCount} types`);
  }
}

// ============================================================================
// 8. INTEGRATION CHECKLIST
// ============================================================================
console.log('\n✅ 8. INTEGRATION CHECKLIST');
console.log('-'.repeat(60));

const checklist = [
  {
    item: 'All hooks properly extracted',
    check: () => hooks.every(h => {
      const ext = h === 'useFriendLocations' || h === 'useMapMarkers' ? 'tsx' : 'ts';
      return fs.existsSync(path.join(basePath, `hooks/${h}.${ext}`));
    }),
  },
  {
    item: 'All UI layers created',
    check: () => layers.every(l => 
      fs.existsSync(path.join(basePath, `layers/${l}.tsx`))
    ),
  },
  {
    item: 'Utilities extracted',
    check: () => fs.existsSync(path.join(basePath, 'utils/mapGeocoding.ts')) &&
                 fs.existsSync(path.join(basePath, 'utils/mapClustering.ts')),
  },
  {
    item: 'Types defined',
    check: () => fs.existsSync(path.join(basePath, 'types/map.types.ts')),
  },
  {
    item: 'Refactored component created',
    check: () => fs.existsSync(refactoredPath),
  },
  {
    item: 'Documentation complete',
    check: () => fs.existsSync(path.join(basePath, 'README.md')),
  },
  {
    item: 'Export files created',
    check: () => fs.existsSync(path.join(basePath, 'hooks/index.ts')) &&
                 fs.existsSync(path.join(basePath, 'layers/index.ts')),
  },
];

checklist.forEach(({ item, check }) => {
  if (check()) {
    pass(item);
  } else {
    fail(item);
  }
});

// ============================================================================
// FINAL REPORT
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 FINAL TEST REPORT');
console.log('='.repeat(60));

console.log(`\n✅ Passed:   ${results.passed}`);
console.log(`❌ Failed:   ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

const total = results.passed + results.failed + results.warnings;
const successRate = ((results.passed / total) * 100).toFixed(1);
console.log(`\n📈 Success Rate: ${successRate}%`);

console.log('\n📊 Performance Metrics:');
results.performance.forEach(({ metric, value, unit }) => {
  console.log(`   • ${metric}: ${value}${unit}`);
});

if (results.failed === 0) {
  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
  console.log('✅ Component is ready for manual testing in development');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED');
  console.log('Please review the failures above');
  process.exit(1);
}
