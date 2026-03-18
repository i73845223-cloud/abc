require('dotenv').config();
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadFresh() {
  console.log('🚀 Starting fresh upload - ALL FILES WILL BE OVERWRITTEN...\n');

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('❌ BLOB_READ_WRITE_TOKEN not found in .env');
    process.exit(1);
  }

  const publicPath = path.join(process.cwd(), 'public');
  console.log('📁 Public path:', publicPath);

  if (!fs.existsSync(publicPath)) {
    console.log('❌ public directory not found!');
    process.exit(1);
  }

  const allUrls = {};

  async function uploadFile(filePath, blobPath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      console.log(`📤 Uploading: ${blobPath}`);
      
      const { url } = await put(blobPath, fileBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      
      const relativePath = path.relative(publicPath, filePath).replace(/\\/g, '/');
      allUrls[relativePath] = url;
      console.log(`✅ Uploaded & Overwritten: ${relativePath} -> ${url}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed: ${blobPath}`, error.message);
      return false;
    }
  }

  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  const allFiles = getAllFiles(publicPath);
  console.log(`\n📦 Found ${allFiles.length} total files to upload...`);

  let successCount = 0;
  let failCount = 0;
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(publicPath, filePath);
    const success = await uploadFile(filePath, relativePath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  const libDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const outputPath = path.join(libDir, 'image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(allUrls, null, 2));
  
  console.log('\n🎉 UPLOAD COMPLETED!');
  console.log(`📊 Total files processed: ${allFiles.length}`);
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`💾 URLs saved to: ${outputPath}`);
  
  const extensions = {};
  Object.keys(allUrls).forEach(key => {
    const ext = path.extname(key).toLowerCase();
    extensions[ext] = (extensions[ext] || 0) + 1;
  });
  
  console.log('\n📁 Files by extension:');
  Object.entries(extensions)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`   ${ext || 'no extension'}: ${count}`);
    });
}

uploadFresh().catch(console.error);