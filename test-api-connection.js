#!/usr/bin/env node

/**
 * Test script to verify ShareVoucher API connection
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
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

async function testAPIConnection() {
    console.log('🧪 Testing ShareVoucher API Connection\n');
    
    const envLocal = parseEnvFile('.env.local');
    const basicAuth = envLocal.NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH;
    
    if (!basicAuth) {
        console.error('❌ No Basic Auth token found in .env.local');
        return;
    }
    
    console.log('🔑 Using Basic Auth:', basicAuth.substring(0, 10) + '...');
    
    // Test simple API endpoint first
    const apiUrl = 'https://sharevoucher.app/api/v1/internal/asset/image';
    
    try {
        console.log('📡 Testing API endpoint:', apiUrl);
        
        // Test with a simple HEAD request first
        const headResponse = await new Promise((resolve, reject) => {
            const url = new URL(apiUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'HEAD',
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'User-Agent': 'HanoiPlanApp/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                console.log('📊 HEAD Response status:', res.statusCode);
                console.log('📋 Response headers:', res.headers);
                resolve(res);
            });
            
            req.on('error', (error) => {
                console.error('❌ HEAD Request error:', error.message);
                reject(error);
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
        
        if (headResponse.statusCode === 405) {
            console.log('✅ API endpoint exists (Method Not Allowed for HEAD is expected)');
        } else if (headResponse.statusCode === 401) {
            console.log('⚠️  API endpoint exists but authentication failed');
            console.log('🔍 Check if Basic Auth token is correct');
        } else if (headResponse.statusCode < 400) {
            console.log('✅ API endpoint accessible');
        } else {
            console.log('⚠️  Unexpected status code:', headResponse.statusCode);
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('🔍 DNS resolution failed - check if sharevoucher.app is accessible');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🔍 Connection refused - API might be down');
        } else if (error.message === 'Request timeout') {
            console.log('🔍 Request timeout - network issues or slow API');
        }
    }
    
    // Test CORS from browser perspective
    console.log('\n🌐 CORS Test from Browser:');
    console.log('The "Failed to fetch" error in browser usually indicates:');
    console.log('1. 🚫 CORS policy blocking cross-origin requests');
    console.log('2. 🔒 HTTPS/HTTP mixed content issues');
    console.log('3. 🌐 Network connectivity issues');
    console.log('4. 🔑 Authentication problems');
    
    console.log('\n💡 Potential Solutions:');
    console.log('1. 🔧 Add CORS headers to ShareVoucher API');
    console.log('2. 🏃 Use a proxy server to bypass CORS');
    console.log('3. 📡 Create backend endpoint to proxy API calls');
    console.log('4. 🔒 Check if API requires specific headers/authentication');
}

testAPIConnection().catch(console.error);
