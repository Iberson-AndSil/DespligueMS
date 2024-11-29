const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal para verificar que el servicio está activo
app.get('/', (req, res) => {
    res.send('Service 1 is running and sending messages every 2 seconds.');
});

// Función para enviar mensajes a Servicio 2 cada 2 segundos
const sendMessageToService2 = () => {
    axios.post('http://service2:3001/send', {
        message: 'Hello from Service 1!'
    })
    .then(response => {
        console.log(`Message sent to Service 2: ${response.data}`);
    })
    .catch(error => {
        console.error('Error sending message to Service 2:', error.message);
    });
};

// Inicia el envío recurrente
setInterval(sendMessageToService2, 2000);

app.listen(PORT, () => {
    console.log(`Service 1 running on port ${PORT}`);
});
