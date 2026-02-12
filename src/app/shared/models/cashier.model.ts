import { Payment } from './payment.model';

export interface CashierInfo {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface PaymentMethodBreakdown {
  count: number;
  totalAmount: number;
}

export interface CashierPaymentKPIs {
  totalPayments: number;
  totalAmount: number;
  totalAmountInBolivares: number;
  averagePaymentAmount: number;
  byPaymentMethod: {
    ZELLE: PaymentMethodBreakdown;
    TRANSFER: PaymentMethodBreakdown;
    CASH: PaymentMethodBreakdown;
  };
  byStatus: {
    verified: number;
    unverified: number;
    shared: number;
    deleted: number;
  };
  dateRange: {
    firstPayment: Date | string | null;
    lastPayment: Date | string | null;
  };
  suppliersServed: number;
}

export interface CashierPaymentsResponse {
  cashier: CashierInfo;
  kpis: CashierPaymentKPIs;
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CashierPaymentsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'ZELLE' | 'TRANSFER' | 'CASH';
  includeDeleted?: boolean;
}
