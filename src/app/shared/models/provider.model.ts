import { Payment } from './payment.model';
import { parseLocalDateOptional } from '../utils/date.utils';

export interface Provider {
  id: number;
  companyName: string;
  taxId?: string;
  phone?: string;
  email?: string;
  status: 'PENDING' | 'COMPLETED';
  totalDebt: number;
  lastPaymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProviderOrder {
  id: number;
  supplierId: number;
  amount: number;
  dispatchDate: Date;
  creditDays: number;
  dueDate: Date;
  createdAt?: Date;
}

export interface OrderDetail extends ProviderOrder {
  supplier?: Provider;
  debt?: {
    id: number;
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
    remainingAmount: number;
  };
  createdBy?: number;
  updatedAt?: Date;
}

export interface Debt {
  id: number;
  orderId: number;
  supplierId: number;
  supplier?: Provider;
  initialAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  payments?: Payment[];
  debtNumber?: number;
}

// Helper para mapear desde API
export function mapProviderFromAPI(apiProvider: any): Provider {
  return {
    id: apiProvider.id,
    companyName: apiProvider.companyName,
    taxId: apiProvider.taxId,
    phone: apiProvider.phone || apiProvider.phoneNumber, // Mantener compatibilidad temporal
    email: apiProvider.email,
    status: apiProvider.status,
    totalDebt: apiProvider.totalDebt,
    lastPaymentDate: parseLocalDateOptional(apiProvider.lastPaymentDate),
    createdAt: apiProvider.createdAt ? new Date(apiProvider.createdAt) : undefined,
    updatedAt: apiProvider.updatedAt ? new Date(apiProvider.updatedAt) : undefined
  };
}

// Helper para mapear a API
export function mapProviderToAPI(provider: Partial<Provider>): any {
  return {
    companyName: provider.companyName,
    taxId: provider.taxId,
    phone: provider.phone,
    email: provider.email,
    status: provider.status,
    ...(provider.totalDebt !== undefined && { initialDebtAmount: provider.totalDebt }),
    ...(provider.lastPaymentDate && { debtDate: provider.lastPaymentDate.toISOString().split('T')[0] })
  };
}
