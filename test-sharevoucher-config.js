#!/usr/bin/env node

/**
 * Script to test ShareVoucher API configuration
 * Run with: node test-sharevoucher-config.js
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            env[key] = value;
        }
    });
    
    return env;
}

function testConfiguration() {
    console.log('🔍 Testing ShareVoucher API Configuration\n');
    
    // Load environment variables
    const envLocal = parseEnvFile('.env.local');
    
    const useInternal = envLocal.NEXT_PUBLIC_SHAREVOUCHER_USE_INTERNAL === 'true';
    const basicAuth = envLocal.NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH;
    const bearerToken = envLocal.NEXT_PUBLIC_SHAREVOUCHER_AUTH_TOKEN;
    
    console.log('📋 Configuration Summary:');
    console.log(`   Use Internal Endpoint: ${useInternal ? '✅ Yes' : '❌ No'}`);
    console.log(`   Basic Auth Token: ${basicAuth ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Bearer Token: ${bearerToken ? '✅ Configured' : '❌ Missing'}`);
    
    // Check configuration validity
    let isValid = false;
    let endpoint = '';
    let authMethod = '';
    
    if (useInternal && basicAuth) {
        isValid = true;
        endpoint = 'https://sharevoucher.app/api/v1/internal/asset/image';
        authMethod = `Basic ${basicAuth}`;
        
        // Verify basic auth token format
        try {
            const decoded = Buffer.from(basicAuth, 'base64').toString();
            if (decoded.includes(':')) {
                console.log(`   Decoded Basic Auth: ${decoded} ✅`);
            } else {
                console.log(`   Invalid Basic Auth format ❌`);
                isValid = false;
            }
        } catch (e) {
            console.log(`   Invalid Basic Auth encoding ❌`);
            isValid = false;
        }
        
    } else if (!useInternal && bearerToken) {
        isValid = true;
        endpoint = 'https://sharevoucher.app/api/v1/asset/image';
        authMethod = `Bearer ${bearerToken}`;
    }
    
    console.log('\n🚀 Ready to Upload:');
    console.log(`   Status: ${isValid ? '✅ Configuration Valid' : '❌ Configuration Invalid'}`);
    
    if (isValid) {
        console.log(`   Endpoint: ${endpoint}`);
        console.log(`   Auth Header: authorization: ${authMethod}`);
        console.log('\n🎯 You can now test image upload in your application!');
        
        console.log('\n📝 Test Steps:');
        console.log('   1. Run: npm run dev');
        console.log('   2. Test proxy: http://localhost:3000/test-proxy-upload.html');
        console.log('   3. Open application: http://localhost:3000');
        console.log('   4. Try uploading an image in location note or place form');
        console.log('   5. Check console for upload progress logs');
        
    } else {
        console.log('\n❌ Please fix configuration issues:');
        if (useInternal && !basicAuth) {
            console.log('   - Add NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH to .env.local');
        }
        if (!useInternal && !bearerToken) {
            console.log('   - Add NEXT_PUBLIC_SHAREVOUCHER_AUTH_TOKEN to .env.local');
        }
    }
    
    console.log('\n📚 For more help, see: SHAREVOUCHER_SETUP.md');
}

// Run the test
testConfiguration();
