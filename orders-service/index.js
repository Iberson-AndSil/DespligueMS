const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios'); 
const promClient = require('prom-client');

const app = express();
app.use(bodyParser.json());

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics(); 

const requestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las solicitudes HTTP en segundos',
  buckets: [0.1, 0.2, 0.5, 1, 2, 5], 
  labelNames: ['method', 'status'], 
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Número total de solicitudes HTTP realizadas',
  labelNames: ['method', 'status'],
});

const mongoURI = "mongodb+srv://silvaiberson3:iberson123@cluster0.j8pegzx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
if (!mongoURI) {
  console.error('MONGO_URI no está definido');
  process.exit(1);
}


const pedidoSchema = new mongoose.Schema({
  usuario: String,
  productos: [
    {
      nombre: String,
      cantidad: Number,
    },
  ],
  fecha: { type: Date, default: Date.now },
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, status: res.statusCode });
    httpRequestsTotal.inc({ method: req.method, status: res.statusCode }); 
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.post('/pedido', async (req, res) => {
  const { usuario, productos } = req.body;
  if (!usuario || !productos || productos.length === 0) {
    return res.status(400).send('Faltan datos en el pedido');
  }

  try {
    const nuevoPedido = new Pedido({ usuario, productos });
    const pedidoGuardado = await nuevoPedido.save();
  
    let inventarioData = null;
    try {
      const inventarioResponse = await axios.post('http://localhost:8000/inventario', {
        pedidoId: pedidoGuardado._id,
        productos: productos,
      });
      inventarioData = inventarioResponse.data;
    } catch (inventarioError) {
      console.error('Error al consultar inventario:', inventarioError);
    }
  
    res.status(201).json({ pedido: pedidoGuardado, inventario: inventarioData });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el pedido' });
  }
  
});

app.get('/pedido', async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.status(200).json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Microservicio de pedidos corriendo en el puerto ${PORT}`));
