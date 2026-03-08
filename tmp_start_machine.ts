
const response = await fetch('http://localhost:3000/machines/1/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        programId: 8
    })
});
const data = await response.json();
console.log(JSON.stringify(data));
