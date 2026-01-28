export interface Payment {
  id: number;
  debtId: number;
  supplierId: number;
  supplier?: {
    id: number;
    companyName: string;
    taxId?: string;
  };
  debt?: {
    id: number;
    orderId?: number;
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
    remainingAmount?: number;
    initialAmount?: number;
    dueDate?: Date;
    debtNumber?: number;
  };
  amount: number;
  paymentMethod: 'Zelle' | 'Transferencia' | 'Efectivo';
  senderName: string;
  senderEmail?: string;
  confirmationNumber?: string;
  paymentDate: Date;
  receiptFile?: string;
  verified: boolean;
  shared?: boolean;
  sharedAt?: Date;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Campos de eliminación (soft delete)
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: number;
  deletedByUser?: {
    id: number;
    nombre: string;
    email: string;
  };
  deleteReason?: string;
  // Campos de bolívares
  isBolivares?: boolean;
  exchangeRate?: number; // Tasa del dólar en BS
  amountInBolivares?: number; // Monto en bolívares
}

export interface PaymentVerification {
  encontrado: boolean;
  pago?: Payment;
  mensaje?: string;
}

// Tipos para mapeo desde API
export type PaymentMethodAPI = 'ZELLE' | 'TRANSFER' | 'CASH';

export function mapPaymentMethodFromAPI(method: PaymentMethodAPI): Payment['paymentMethod'] {
  const mapping: Record<PaymentMethodAPI, Payment['paymentMethod']> = {
    ZELLE: 'Zelle',
    TRANSFER: 'Transferencia',
    CASH: 'Efectivo'
  };
  return mapping[method] || 'Efectivo';
}

export function mapPaymentMethodToAPI(method: Payment['paymentMethod']): PaymentMethodAPI {
  const mapping: Record<Payment['paymentMethod'], PaymentMethodAPI> = {
    Zelle: 'ZELLE',
    Transferencia: 'TRANSFER',
    Efectivo: 'CASH'
  };
  return mapping[method] || 'CASH';
}
