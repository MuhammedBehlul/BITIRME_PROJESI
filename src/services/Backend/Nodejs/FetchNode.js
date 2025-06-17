import axios from 'axios';

// Node.js Backend URL
const NODEJS_API_URL = 'http://192.168.0.101:3000/api/recommend'; // Replace with your server IP and port.

export const fetchRecommendations = async (movie) => {
    try {
        // Make the request to Node.js backend
        const response = await axios.get(`${NODEJS_API_URL}?movie=${encodeURIComponent(movie)}`);
        return response.data;  // Assuming the response is a JSON with movie recommendations
    } catch (error) {
        console.error('Error fetching from NodeJS backend:', error);
        throw new Error('Failed to fetch recommendations from the backend.');
    }
};
