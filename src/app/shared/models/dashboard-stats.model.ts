export interface DashboardStats {
  pagosPendientes: number;
  pagosProcesados: number;
  totalProveedores: number;
  totalDeuda: number;
  ultimosPagos: PaymentSummary[];
}

export interface PaymentSummary {
  id: string;
  proveedor: string;
  monto: number;
  fecha: Date;
  estado: string;
}

