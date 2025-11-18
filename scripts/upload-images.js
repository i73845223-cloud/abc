require('dotenv').config();
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadFresh() {
  console.log('🚀 Starting fresh image upload...\n');

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

  const publicContents = fs.readdirSync(publicPath);
  console.log('📦 Contents of public folder:', publicContents);

  const bannersPath = path.join(publicPath, 'banners');
  if (fs.existsSync(bannersPath)) {
    const bannerFiles = fs.readdirSync(bannersPath);
    console.log('🎯 Banner files found:', bannerFiles);
  } else {
    console.log('❌ banners folder not found in public!');
  }

  const allUrls = {};

  async function uploadFile(filePath, blobPath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      console.log(`📤 Uploading: ${blobPath}`);
      
      const { url } = await put(blobPath, fileBuffer, {
        access: 'public',
        allowOverwrite: true,
      });
      
      const relativePath = path.relative(publicPath, filePath).replace(/\\/g, '/');
      allUrls[relativePath] = url;
      console.log(`✅ Uploaded: ${relativePath} -> ${url}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error(`❌ Failed: ${blobPath}`, error.message);
      return false;
    }
  }

  if (fs.existsSync(bannersPath)) {
    console.log('\n🎯 UPLOADING BANNERS...');
    const bannerFiles = fs.readdirSync(bannersPath);
    
    for (const file of bannerFiles) {
      if (/(\.webp|\.jpg|\.jpeg|\.png)$/i.test(file)) {
        const filePath = path.join(bannersPath, file);
        await uploadFile(filePath, `banners/${file}`);
      }
    }
  }

  console.log('\n📦 UPLOADING OTHER IMAGES...');
  for (const item of publicContents) {
    const fullPath = path.join(publicPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'banners') {
      const subItems = fs.readdirSync(fullPath);
      for (const subItem of subItems) {
        if (/(\.webp|\.jpg|\.jpeg|\.png)$/i.test(subItem)) {
          const filePath = path.join(fullPath, subItem);
          await uploadFile(filePath, `${item}/${subItem}`);
        }
      }
    }
  }

  const libDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const outputPath = path.join(libDir, 'image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(allUrls, null, 2));
  
  console.log('\n🎉 UPLOAD COMPLETED!');
  console.log(`📊 Total images: ${Object.keys(allUrls).length}`);
  console.log(`💾 Saved to: ${outputPath}`);
  
  const bannerUrls = Object.keys(allUrls).filter(key => key.includes('banners/'));
  console.log(`\n🎯 Banners uploaded: ${bannerUrls.length}`);
  bannerUrls.forEach(url => console.log(`   ${url}`));
}

uploadFresh().catch(console.error);