#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Neon PostgreSQL Setup Helper\n');

// Check if DATABASE_URL looks like Neon
function isNeonURL(url) {
    return url && (
        url.includes('.neon.tech') || 
        url.includes('neon.') ||
        url.includes('sslmode=require')
    );
}

// Validate Neon connection string format
function validateNeonURL(url) {
    const issues = [];
    
    if (!url.startsWith('postgresql://')) {
        issues.push('❌ Must start with postgresql://');
    }
    
    if (!url.includes('@')) {
        issues.push('❌ Missing credentials (username:password@)');
    }
    
    if (!url.includes('.neon.tech')) {
        issues.push('❌ Must be a Neon endpoint (.neon.tech)');
    }
    
    if (!url.includes('sslmode=require')) {
        issues.push('❌ Missing sslmode=require parameter');
    }
    
    return issues;
}

async function main() {
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Check if .env.local exists
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local not found!');
        console.log('💡 Create .env.local file first');
        return;
    }
    
    const currentURL = process.env.DATABASE_URL;
    
    if (!currentURL) {
        console.log('❌ DATABASE_URL not found in .env.local');
        console.log('💡 Add DATABASE_URL to your .env.local file');
        return;
    }
    
    console.log('📋 Current DATABASE_URL:');
    console.log('   ', currentURL.replace(/:[^:]*@/, ':***@'));
    console.log('');
    
    // Check if it's already Neon
    if (isNeonURL(currentURL)) {
        console.log('✅ Looks like Neon URL!');
        
        // Validate format
        const issues = validateNeonURL(currentURL);
        if (issues.length > 0) {
            console.log('⚠️  URL Format Issues:');
            issues.forEach(issue => console.log('   ', issue));
            console.log('');
            console.log('💡 Expected format:');
            console.log('   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require');
        } else {
            console.log('✅ URL format looks correct!');
        }
    } else {
        console.log('❌ This doesn\'t look like a Neon URL');
        console.log('');
        console.log('🔧 Next steps:');
        console.log('1. Go to https://neon.tech');
        console.log('2. Create account & project');
        console.log('3. Get connection string from dashboard');
        console.log('4. Replace DATABASE_URL in .env.local');
        console.log('');
        console.log('💡 Expected Neon URL format:');
        console.log('   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require');
    }
    
    console.log('');
    console.log('🧪 Next: Run "npm run db:test" to test connection');
}

main().catch(console.error);


