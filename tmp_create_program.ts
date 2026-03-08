
const response = await fetch('http://localhost:3000/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Verification Program',
        type: 'WASHER',
        durationMin: 1,
        price: 0.01
    })
});
const data = await response.json();
console.log(JSON.stringify(data));
