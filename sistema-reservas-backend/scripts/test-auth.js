async function test() {
    // Test 1: Login
    console.log('=== Test 1: Login ===');
    const loginRes = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'yessica.tovar', password: 'Admin2026!' }),
    });
    const tokens = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Has access_token:', !!tokens.access_token);
    console.log('Has refresh_token:', !!tokens.refresh_token);

    // Test 2: Profile with token
    console.log('\n=== Test 2: Profile (with JWT) ===');
    const profileRes = await fetch('http://localhost:4000/auth/profile', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    console.log('Status:', profileRes.status);
    console.log('Profile:', JSON.stringify(profile, null, 2));

    // Test 3: Profile without token (should 401)
    console.log('\n=== Test 3: Profile (no token) ===');
    const noAuthRes = await fetch('http://localhost:4000/auth/profile');
    console.log('Status:', noAuthRes.status);

    // Test 4: Wrong password
    console.log('\n=== Test 4: Wrong password ===');
    const wrongRes = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'yessica.tovar', password: 'wrong' }),
    });
    console.log('Status:', wrongRes.status);

    // Test 5: Refresh token
    console.log('\n=== Test 5: Refresh Token ===');
    const refreshRes = await fetch('http://localhost:4000/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    const newTokens = await refreshRes.json();
    console.log('Status:', refreshRes.status);
    console.log('Has new access_token:', !!newTokens.access_token);
    console.log('Has new refresh_token:', !!newTokens.refresh_token);

    // Test 6: Protected endpoint with JWT (reservations)
    console.log('\n=== Test 6: Reservations with JWT ===');
    const reservRes = await fetch('http://localhost:4000/reservations?page=1&page_size=5', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    console.log('Status:', reservRes.status);

    console.log('\n=== ALL TESTS DONE ===');
}

test().catch(e => console.error(e));
