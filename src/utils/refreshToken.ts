import axios from 'axios';
import dotenv from "dotenv";

export const refreshToken = async () => {
  const API_CLIENT_ID: string = process.env.OSU_CLIENT_ID!;
  const API_CLIENT_SECRET: string = process.env.OSU_CLIENT_SECRET!;
  if (!API_CLIENT_ID || !API_CLIENT_SECRET) {
    throw new Error('API client ID or secret not found');
  }

  const response = await axios.post('https://osu.ppy.sh/oauth/token', {
    client_id: API_CLIENT_ID,
    client_secret: API_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'public',
  });

  if (response.status !== 200) {
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const { access_token, token_type, expires_in } = response.data;

  if (!access_token || token_type !== 'Bearer' || !expires_in) {
    throw new Error('Invalid token response');
  }

  process.env.OSU_API_TOKEN = access_token;
  console.log('Token refreshed successfully');
};