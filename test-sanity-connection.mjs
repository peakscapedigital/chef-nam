import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'yojbqnd7',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skM6lGZRUGdMrX7gF2ouLCf1gNUJpv6IDiPOAjTJmjuqkzqcVp57cKfE74svy07jsZfMaEM1JX0d4WNXOvaBVH96k5UbcnlEg5TfOfOEmFMFAx2vQtbGCEKvyqzCFrPpkrs5SK4mEdlR57PWcsZTwheUK2snuB7SVE8USgo6x99h787Nq97O'
})

console.log('Testing Sanity connection...')

// Test basic connection
try {
  const testQuery = `*[_type == "post"][0...1]`
  const posts = await client.fetch(testQuery)
  console.log('✅ Posts query successful:', posts.length, 'posts found')
  
  const homepageQuery = `*[_type == "homepage"][0]`
  const homepage = await client.fetch(homepageQuery)
  console.log('✅ Homepage query successful:', homepage ? 'Homepage found' : 'No homepage data')
  
  const galleryQuery = `*[_type == "gallery"][0...1]`
  const gallery = await client.fetch(galleryQuery)
  console.log('✅ Gallery query successful:', gallery.length, 'gallery items found')
  
  // Check document types
  const typesQuery = `array::unique(*[]._type)`
  const types = await client.fetch(typesQuery)
  console.log('\n📋 Available document types:', types)
  
  // Count documents
  const countQuery = `{
    "posts": count(*[_type == "post"]),
    "homepage": count(*[_type == "homepage"]),
    "gallery": count(*[_type == "gallery"]),
    "venues": count(*[_type == "venue"])
  }`
  const counts = await client.fetch(countQuery)
  console.log('\n📊 Document counts:', counts)
  
} catch (error) {
  console.error('❌ Sanity connection error:', error.message)
  console.error('Full error:', error)
}