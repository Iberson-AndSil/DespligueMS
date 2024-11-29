const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Service 2!');
});

app.post('/send', (req, res) => {
    const { message } = req.body;
    if (message) {
        res.send(`Service 2 received your message: "${message}"`);
    } else {
        res.status(400).send('No message provided.');
    }
});

app.listen(PORT, () => {
    console.log(`Service 2 running on port ${PORT}`);
});
