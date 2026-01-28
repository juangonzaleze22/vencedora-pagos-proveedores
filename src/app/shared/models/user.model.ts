export interface User {
  id: number;
  email: string;
  name: string;
  role: {
    id: number;
    nombre: string; // ADMINISTRADOR, SUPERVISOR, CAJERO
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

