// Test spam detection with the new spam example

function hasSuspiciousMixedCase(text) {
  if (!text || text.length < 5) return false;

  // Count transitions between lowercase and uppercase (e.g., "aB" or "Ba")
  const transitions = text.match(/[a-z][A-Z]|[A-Z][a-z]/g);
  if (!transitions) return false;

  // If more than 30% of characters are case transitions, likely spam
  return transitions.length > text.length * 0.3;
}

function isLikelySpam(data) {
  // Honeypot check
  if (data.website && data.website.trim() !== '') {
    return { isSpam: true, reason: 'Honeypot field filled' };
  }

  // Check first name for suspicious mixed case
  if (hasSuspiciousMixedCase(data.firstName)) {
    return { isSpam: true, reason: `Suspicious mixed case in first name: ${data.firstName}` };
  }

  // Check last name for suspicious mixed case
  if (hasSuspiciousMixedCase(data.lastName)) {
    return { isSpam: true, reason: `Suspicious mixed case in last name: ${data.lastName}` };
  }

  // Check message for suspicious mixed case
  if (data.message && hasSuspiciousMixedCase(data.message)) {
    return { isSpam: true, reason: 'Suspicious mixed case in message' };
  }

  return { isSpam: false };
}

console.log('=== Testing NEW Spam Example ===\n');

// New spam from user
const newSpam = {
  firstName: 'iMWJsSecHGorxgKbDsRbm',
  lastName: 'lkiuCpvBOcjmWlEKhAr',
  email: 'cdwc33@gmail.com',
  phone: '9815485499',
  message: 'YWnzVrufyDSCLBrGqAXpIQJ',
  website: ''
};

console.log('Data:', newSpam);
console.log('\nAnalysis:');
console.log('First name:', newSpam.firstName);
const firstTransitions = newSpam.firstName.match(/[a-z][A-Z]|[A-Z][a-z]/g);
console.log('  Transitions:', firstTransitions);
console.log('  Transition count:', firstTransitions?.length || 0);
console.log('  Name length:', newSpam.firstName.length);
console.log('  Transition ratio:', ((firstTransitions?.length || 0) / newSpam.firstName.length * 100).toFixed(1) + '%');
console.log('  Threshold: 30%');
console.log('  Would block?', hasSuspiciousMixedCase(newSpam.firstName) ? 'YES ✓' : 'NO ✗');

console.log('\nLast name:', newSpam.lastName);
const lastTransitions = newSpam.lastName.match(/[a-z][A-Z]|[A-Z][a-z]/g);
console.log('  Transitions:', lastTransitions);
console.log('  Transition count:', lastTransitions?.length || 0);
console.log('  Name length:', newSpam.lastName.length);
console.log('  Transition ratio:', ((lastTransitions?.length || 0) / newSpam.lastName.length * 100).toFixed(1) + '%');
console.log('  Threshold: 30%');
console.log('  Would block?', hasSuspiciousMixedCase(newSpam.lastName) ? 'YES ✓' : 'NO ✗');

console.log('\nMessage:', newSpam.message);
const messageTransitions = newSpam.message.match(/[a-z][A-Z]|[A-Z][a-z]/g);
console.log('  Transitions:', messageTransitions);
console.log('  Transition count:', messageTransitions?.length || 0);
console.log('  Message length:', newSpam.message.length);
console.log('  Transition ratio:', ((messageTransitions?.length || 0) / newSpam.message.length * 100).toFixed(1) + '%');
console.log('  Threshold: 30%');
console.log('  Would block?', hasSuspiciousMixedCase(newSpam.message) ? 'YES ✓' : 'NO ✗');

console.log('\n=== FINAL RESULT ===');
const result = isLikelySpam(newSpam);
console.log('Is Spam?', result.isSpam ? 'YES ✓' : 'NO ✗');
console.log('Reason:', result.reason || 'N/A');

if (!result.isSpam) {
  console.log('\n⚠️  WARNING: This spam would NOT be caught! ⚠️');
} else {
  console.log('\n✅ This spam WOULD be caught and blocked!');
}
