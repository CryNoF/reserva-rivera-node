const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment-timezone');

const app = express();
let token = null;

// Configuración de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const obtenerToken = async () => {
  try {
    const response = await axios.post('https://riberatennisclub.cl:3000/auth/login', {
      correo: 'camilonavarreteportino@gmail.com',
      contraseña: '7889887',
    }, {
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    
    token = response.data.token;
    console.log('Token obtenido:', token);
    return token;
  } catch (error) {
    console.error('Error al obtener el token:', error);
    throw error;
  }
};

const verificarToken = async (token) => {
  try {
    const response = await axios.post('https://riberatennisclub.cl:3000/auth/verify-token', {
      token: token,
    }, {
      headers: {
        'Accept': '*/*',
        'Authorization': token,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al verificar el token:', error);
    throw error;
  }
};

const obtenerReservasDesdeAPI = async () => {
  try {
    const response = await axios.get('https://riberatennisclub.cl:3000/reservas', {
      headers: {
        'Accept': '*/*',
        'Authorization': token,
      },
    });
    
     const reservas = response.data.reservas;
    
    console.log('Reservas obtenidas:', reservas);
    return reservas;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
};

const obtenerUsuariosDesdeAPI = async () => {
  try {
    const response = await axios.get('https://riberatennisclub.cl:3000/usuarios', {
      headers: {
        'Authorization': token,
      },
    });
    console.log('Usuarios obtenidos:', response.data.usuarios);
    return response.data.usuarios;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

app.post('/auth/login', async (req, res) => {
  try {
    const tokenObtenido = await obtenerToken();
    res.json({ token: tokenObtenido });
  } catch (error) {
    res.status(500).json({ message: 'Error al hacer login' });
  }
});

app.post('/auth/verify-token', async (req, res) => {
  try {
    const result = await verificarToken(req.body.token);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

app.get('/reservas', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token' });
  }

  try {
    await verificarToken(token);
    const reservas = await obtenerReservasDesdeAPI();
    res.json(reservas);
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o error al obtener reservas' });
  }
});

app.get('/usuarios', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token' });
  }

  try {
    await verificarToken(token);
    const usuarios = await obtenerUsuariosDesdeAPI();
    res.json({ usuarios });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o error al obtener usuarios' });
  }
});


app.post('/reservas', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token' });
    }
  
    try {
      await verificarToken(token);
      const nuevaReserva = {
        ...req.body,
        fecha: moment(req.body.fecha).tz('America/Santiago').format('YYYY-MM-DD HH:mm:00'),
      };
  
      // Enviar la reserva al servidor principal
      const response = await axios.post('https://riberatennisclub.cl:3000/reservas', nuevaReserva, {
        headers: { 'Authorization': token }
      });
  
      // Si la petición fue exitosa, devolver la respuesta al cliente
      res.json(response.data);
    } catch (error) {
      console.error('Error al crear reserva:', error);
      if (error.response) {
        // Si el servidor principal respondió con un error, enviamos ese error al cliente
        res.status(error.response.status).json(error.response.data);
      } else {
        // Si hubo un error de red u otro tipo de error
        res.status(500).json({ message: 'Error al crear reserva' });
      }
    }
  });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
