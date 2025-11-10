#!/usr/bin/env node
/**
 * Fix Media table placeId - convert LocationNote IDs to Place IDs
 * 
 * This script fixes a bug where images were saved with placeId = locationNote.id
 * instead of placeId = locationNote.placeId
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMediaPlaceIds() {
    console.log('🔍 Starting media placeId fix...\n');

    try {
        // Find all media records
        const allMedia = await prisma.media.findMany({
            where: {
                isActive: true,
                type: 'image'
            }
        });

        console.log(`📊 Found ${allMedia.length} active image media records\n`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        let notFoundCount = 0;

        for (const media of allMedia) {
            // Check if this placeId is actually a Place
            const place = await prisma.place.findUnique({
                where: { id: media.placeId }
            });

            if (place) {
                // This is already correct
                alreadyCorrectCount++;
                continue;
            }

            // Check if this is a LocationNote ID
            const locationNote = await prisma.locationNote.findUnique({
                where: { id: media.placeId },
                include: { place: true }
            });

            if (locationNote) {
                // Fix it!
                console.log(`🔧 Fixing media ${media.id}:`);
                console.log(`   Old placeId: ${media.placeId} (LocationNote ID)`);
                console.log(`   New placeId: ${locationNote.placeId} (Place ID)`);

                await prisma.media.update({
                    where: { id: media.id },
                    data: { placeId: locationNote.placeId }
                });

                fixedCount++;
                console.log(`   ✅ Fixed!\n`);
            } else {
                // Neither Place nor LocationNote - might be deleted
                console.warn(`⚠️  Media ${media.id} has invalid placeId: ${media.placeId}`);
                notFoundCount++;
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ⚠️  Not found: ${notFoundCount}`);
        console.log(`   📊 Total: ${allMedia.length}`);

        console.log('\n✅ Migration completed!');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
fixMediaPlaceIds()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

