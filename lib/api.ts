// lib/api.ts
const BASE_URL = 'http://10.234.76.195:9034/api/v1'; // Replace with your local IP and correct port

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
console.log(response)
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    console.log(data)
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Something went wrong');
  }
}
