import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'yojbqnd7',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

console.log('Testing Sanity connection...');

try {
  const result = await client.create({
    _type: 'formSubmission',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    phone: '123-456-7890',
    hasEvent: false,
    message: 'This is a test submission',
    source: 'test',
    status: 'new',
    submittedAt: new Date().toISOString()
  });
  
  console.log('Success! Created document:', result._id);
} catch (error) {
  console.error('Error:', error.message);
}