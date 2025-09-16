import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4321';

async function testPage(path, description) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const html = await response.text();
    
    // Check for Sanity content indicators
    const hasHeroImage = html.includes('hero') && !html.includes('hero-catering-800.jpg');
    const hasBlogPosts = html.includes('blog-card') || html.includes('post-card');
    const hasGalleryImages = html.includes('gallery') && !html.includes('No gallery items');
    const hasError = html.includes('Error') || html.includes('error');
    
    console.log(`\n📄 ${description} (${path})`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Hero/Images: ${hasHeroImage ? '✅' : '❌'}`);
    if (path.includes('blog')) {
      console.log(`   Blog Posts: ${hasBlogPosts ? '✅' : '❌'}`);
    }
    if (path === '/') {
      console.log(`   Gallery: ${hasGalleryImages ? '✅' : '❌'}`);
    }
    console.log(`   Errors: ${hasError ? '❌ Found errors' : '✅ No errors'}`);
    
    // Look for specific Sanity content
    if (path === '/') {
      const hasChefNamContent = html.includes('Chef Nam') || html.includes('Thai');
      console.log(`   Sanity Content: ${hasChefNamContent ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.log(`\n❌ ${description} (${path}): ${error.message}`);
  }
}

console.log('🔍 Testing pages for Sanity content...\n');

await testPage('/', 'Homepage');
await testPage('/blog', 'Blog Index');
await testPage('/venues', 'Venues Page');
await testPage('/about', 'About Page');

console.log('\n✨ Test complete');