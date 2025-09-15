#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
    console.log('🔍 Testing Supabase Database Connection...\n');
    
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.log('💡 Make sure .env.local exists with valid DATABASE_URL');
        process.exit(1);
    }
    
    console.log('📋 Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
    
    // Test Prisma connection
    const prisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'pretty',
    });
    
    try {
        console.log('🔌 Attempting to connect to database...');
        
        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');
        
        // Test query
        console.log('🧪 Testing database query...');
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Database query successful!', result);
        
        // Check if tables exist
        console.log('📊 Checking database schema...');
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `;
        
        if (tables.length === 0) {
            console.log('⚠️  No tables found. You need to run migrations:');
            console.log('   npx prisma db push');
        } else {
            console.log(`✅ Found ${tables.length} tables in database`);
            console.log('   Tables:', tables.map(t => t.table_name).join(', '));
        }
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('   Error:', error.message);
        
        if (error.code === 'P1001') {
            console.log('\n💡 Troubleshooting P1001 - Can\'t reach database server:');
            console.log('   1. Check your Supabase project is running (not paused)');
            console.log('   2. Verify the project reference URL is correct');
            console.log('   3. Check your internet connection');
            console.log('   4. Verify password is correctly URL encoded');
        } else if (error.code === 'P1000') {
            console.log('\n💡 Troubleshooting P1000 - Authentication failed:');
            console.log('   1. Double-check your database password');
            console.log('   2. Ensure special characters are URL encoded (!→%21, @→%40)');
            console.log('   3. Try resetting your database password in Supabase dashboard');
        }
        
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
    
    console.log('\n🎉 All database tests passed! Your Supabase connection is working.');
}

testDatabaseConnection().catch(console.error);


