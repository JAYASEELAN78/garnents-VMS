
async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'dineshs.24mca@kongu.edu',
                password: '123456'
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Login successful:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('Login failed:');
            console.error('Status:', response.status);
            console.error('Data:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
