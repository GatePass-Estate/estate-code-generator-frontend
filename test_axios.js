const axios = require('axios');
const api = axios.create({
  baseURL: 'https://api.example.com',
  paramsSerializer: { indexes: null },
});

const uri = api.getUri({
  url: '/test',
  params: {
    estate_id: '123',
    severity: ['high'],
    user_type: ['guest'],
    gender: ['male'],
  },
});

console.log(uri);
