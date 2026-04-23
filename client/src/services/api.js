import axios from "axios";
import { DOMAIN } from "../constants";

const api = axios.create({
  baseURL: `${DOMAIN}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
