import { getToken } from "@clerk/react";

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchApi(url: string, options: RequestInit = {}) {
  const token = await getToken();

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}
