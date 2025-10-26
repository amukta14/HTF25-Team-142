import axios from 'axios';

const sharedAPI = {
  // Fetch all shared capsules received by the logged-in user
  getAll: () => axios.get('/api/shared/received'),

  // Fetch a specific shared capsule by access code
  get: (accessCode) => axios.get(`/api/shared/${accessCode}`)
};

export default sharedAPI;
