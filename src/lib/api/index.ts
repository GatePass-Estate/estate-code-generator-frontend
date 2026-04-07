import { Platform } from "react-native";
import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const Api = (service: "user" | "code" = "user") => {
  const access_token = useAuthStore.getState().access_token;

  let url =
    service === "user"
      ? process.env.EXPO_PUBLIC_USER_SERVICE_API_URL
      : process.env.EXPO_PUBLIC_CODE_SERVICE_API_URL;

  // Dev only: on web, rewrite LAN/host IP to localhost so the browser hits the local backend
  // (the env URL uses a LAN IP like 172.20.10.3 so physical mobile devices can reach the host machine)
  if (__DEV__ && Platform.OS === "web" && url && !url.includes("localhost")) {
    try {
      const u = new URL(url);
      url = `${u.protocol}//localhost:${u.port || (u.protocol === "https:" ? 443 : 80)}`;
    } catch {
      url = url.replace(/^(https?:\/\/)[\d.]+/, "$1localhost");
    }
  }

  return axios.create({
    baseURL: `${url}/api/v1`,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export default Api;
