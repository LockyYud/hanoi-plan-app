const fs = require('fs');
const FormData = require('form-data');

async function testShareVoucherUpload() {
    try {
        console.log('🔄 Testing ShareVoucher API upload...');
        
        // Create a test image file (1x1 pixel PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF,
            0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2,
            0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        // Save to temp file
        const tempPath = '/tmp/test-image.png';
        fs.writeFileSync(tempPath, testImageBuffer);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempPath), {
            filename: 'test-image.png',
            contentType: 'image/png'
        });
        
        const basicAuth = 'YWRtaW46MTIzNDU2'; // from .env.local
        
        const response = await fetch('https://sharevoucher.app/api/v1/internal/asset/image', {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'authorization': `Basic ${basicAuth}`,
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                ...formData.getHeaders()
            },
            body: formData
        });
        
        console.log('📊 Response:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('🎯 Result:', result);
        
        // Clean up
        fs.unlinkSync(tempPath);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testShareVoucherUpload();