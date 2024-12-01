const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const promClient = require('prom-client'); 
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics(); 

const requestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las solicitudes HTTP en segundos',
  buckets: [0.1, 0.2, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Número total de solicitudes HTTP realizadas',
  labelNames: ['method', 'status'] 
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

const inventarioSchema = new mongoose.Schema({
  pedidoId: String,
  productos: [
    {
      nombre: String,
      cantidad: Number,
    },
  ],
  idInventario: { type: String, unique: true },
  fecha: { type: Date, default: Date.now },
});

const Inventario = mongoose.model('Inventario', inventarioSchema);

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

app.post('/inventario', async (req, res) => {
  const { pedidoId, productos } = req.body;

  if (!pedidoId || !productos || productos.length === 0) {
    return res.status(400).send('Datos incompletos');
  }

  const idInventario = `INV-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const nuevoInventario = new Inventario({ pedidoId, productos, idInventario });
    const inventarioGuardado = await nuevoInventario.save();
    res.status(201).json(inventarioGuardado);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el inventario' });
  }
});

app.get('/inventario', async (req, res) => {
  try {
    const inventarios = await Inventario.find();
    res.status(200).json(inventarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los inventarios' });
  }
});

app.get('/inventario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const inventario = await Inventario.findById(id);
    if (!inventario) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    res.status(200).json(inventario);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Microservicio de inventario corriendo en el puerto ${PORT}`));
