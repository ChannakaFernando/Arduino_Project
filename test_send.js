const fetch = require('node-fetch');

async function sendTestData() {
    const data = { 
        temperature: 25 + Math.random() * 5, 
        humidity: 60 + Math.random() * 5 
    };

    try {
        const res = await fetch('http://localhost:3000/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log(await res.text()); // Should print: "Data received successfully"
    } catch (err) {
        console.error('Error:', err);
    }
}

sendTestData();
