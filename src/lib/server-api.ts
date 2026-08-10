import { createServerFn } from "@tanstack/react-start";

export const fetchEmployeesFromServer = createServerFn({ method: "GET" }).handler(async () => {
  // Try both import.meta.env (for Vite) and process.env (for raw node). Fallback to dummy key.
  const API_KEY = import.meta.env?.['VITE_EMPLOYEE_API_KEY'] || process.env['VITE_EMPLOYEE_API_KEY'] || "dummy-key";
  const BASE_URL = "http://196.218.137.110:5000";
  
  const res = await fetch(`${BASE_URL}/api/public/employees?page_size=100`, {
    headers: { "x-api-key": API_KEY },
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  return res.json();
});
