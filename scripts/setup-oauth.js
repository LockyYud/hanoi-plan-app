#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🔐 Google OAuth Setup Helper\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function main() {
    console.log('📋 Steps completed so far:');
    console.log('   1. ✅ Create Google Cloud Project');
    console.log('   2. ✅ Enable APIs (Google+ API, People API)');
    console.log('   3. ✅ Setup OAuth Consent Screen');
    console.log('   4. ✅ Create OAuth 2.0 Credentials');
    console.log('');
    
    console.log('🔑 Now enter your OAuth credentials:\n');
    
    const clientId = await askQuestion('Google Client ID: ');
    const clientSecret = await askQuestion('Google Client Secret: ');
    
    if (!clientId || !clientSecret) {
        console.log('❌ Please provide both Client ID and Client Secret');
        rl.close();
        return;
    }
    
    // Validate format
    if (!clientId.includes('.apps.googleusercontent.com')) {
        console.log('⚠️  Warning: Client ID should end with .apps.googleusercontent.com');
    }
    
    if (!clientSecret.startsWith('GOCSPX-')) {
        console.log('⚠️  Warning: Client Secret should start with GOCSPX-');
    }
    
    // Read current .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local not found!');
        rl.close();
        return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace Google OAuth credentials
    envContent = envContent.replace(
        /GOOGLE_CLIENT_ID="[^"]*"/,
        `GOOGLE_CLIENT_ID="${clientId}"`
    );
    
    envContent = envContent.replace(
        /GOOGLE_CLIENT_SECRET="[^"]*"/,
        `GOOGLE_CLIENT_SECRET="${clientSecret}"`
    );
    
    // Write back to file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ OAuth credentials updated in .env.local');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart dev server: Ctrl+C then npm run dev');
    console.log('   2. Visit http://localhost:3000');
    console.log('   3. Test Google sign-in');
    console.log('\n🎉 Your app will now support Google authentication!');
    
    rl.close();
}

main().catch(console.error);


