const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5050;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}/`);
});
