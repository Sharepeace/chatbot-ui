// pages/api/my_function.js
import axios from 'axios';

export default async function handler(req, res) {
  const { name } = req.query;
  const port = process.env.NODE_ENV === 'production' ? 3000 : 4000;
  try {
    const response = await axios.get(`http://127.0.0.1:${port}/api/my_function`, { params: { name: name || 'World' } });
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).send(error.message);
  }
}
