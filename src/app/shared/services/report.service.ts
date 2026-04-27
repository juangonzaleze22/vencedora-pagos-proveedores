import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Provider, Debt } from '../models/provider.model';
import { Payment, mapPaymentMethodFromAPI } from '../models/payment.model';
import { parseLocalDate, parseLocalDateOptional, formatLocalDate } from '../utils/date.utils';

export interface DashboardStats {
  pendingPayments: number;
  processedPayments: number;
  totalSuppliers: number;
  totalDebt: number;
}

export interface SupplierDetailedReport {
  supplier: Provider;
  totalPaid: number;
  paymentCount: number;
  averagePayment: number;
  debts: Debt[];
  totalCreditAvailable?: number;
}

export interface DebtPaymentsResponse {
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: {
    totalPaid: number;
    paymentCount: number;
    averagePayment: number;
  };
}

/**
 * Prioriza el excedente explícitamente aplicado sobre `surplusAmountAtCreation` (que a veces viene
 * desalineado del restante). Además acota al máximo reducción posible (inicial − restante) para que
 * el banner no contradiga las cifras de la deuda en pantalla.
 */
function normalizeDebtSurplusDisplay(debt: any): number {
  const asFinite = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;

  const raw =
    asFinite(debt.surplusAmountApplied) ??
    asFinite(debt.surplusApplied) ??
    asFinite(debt.appliedSurplus) ??
    asFinite(debt.surplusAmountAtCreation) ??
    0;

  const initial = asFinite(debt.initialAmount) ?? Number(debt.initialAmount);
  const remaining = asFinite(debt.remainingAmount) ?? Number(debt.remainingAmount);
  if (!Number.isFinite(initial) || !Number.isFinite(remaining)) {
    return Math.max(0, raw);
  }
  const maxReduction = Math.max(0, initial - remaining);
  return Math.min(Math.max(0, raw), maxReduction);
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene estadísticas del dashboard
   */
  getDashboard(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>('/reports/dashboard').pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener estadísticas');
      })
    );
  }

  /**
   * Obtiene reporte detallado de un proveedor (sin pagos)
   * Los pagos ahora se obtienen mediante getDebtPayments
   */
  getSupplierDetailed(
    supplierId: number,
    startDate?: Date,
    endDate?: Date
  ): Observable<SupplierDetailedReport> {
    const params: Record<string, any> = {};
    
    if (startDate) {
      params['startDate'] = formatLocalDate(startDate);
    }
    
    if (endDate) {
      params['endDate'] = formatLocalDate(endDate);
    }

    return this.apiService.get<SupplierDetailedReport>(`/reports/supplier/${supplierId}/detailed`, params).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data as any;
          const s = data.supplier || {};
          const credit = data.totalCreditAvailable ?? s.totalCreditAvailable ?? 0;
          return {
            supplier: {
              ...s,
              totalCreditAvailable: credit,
              lastPaymentDate: parseLocalDateOptional(s.lastPaymentDate),
              createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined
            } as Provider,
            totalCreditAvailable: credit,
            totalPaid: data.totalPaid,
            paymentCount: data.paymentCount,
            averagePayment: data.averagePayment,
            debts: (data.debts || []).map((debt: any) => ({
              ...debt,
              dueDate: parseLocalDate(debt.dueDate),
              createdAt: debt.createdAt ? new Date(debt.createdAt) : undefined,
              updatedAt: debt.updatedAt ? new Date(debt.updatedAt) : undefined,
              surplusAmountApplied: normalizeDebtSurplusDisplay(debt)
            }))
          };
        }
        throw new Error(response.message || 'Error al obtener reporte');
      })
    );
  }

  /**
   * Obtiene el historial de pagos de una deuda específica
   */
  getDebtPayments(
    debtId: number,
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Observable<DebtPaymentsResponse> {
    const params: Record<string, any> = {
      page,
      limit,
      includeDeleted: true // Incluir pagos eliminados en el historial
    };
    
    if (startDate) {
      params['startDate'] = formatLocalDate(startDate);
    }
    
    if (endDate) {
      params['endDate'] = formatLocalDate(endDate);
    }

    return this.apiService.get<Payment[]>(`/debts/${debtId}/payments`, params).pipe(
      map((response: any) => {
        if (response.success) {
          return {
            data: (response.data || []).map((payment: any) => {
              const paymentDate = payment.paymentDate ? parseLocalDate(payment.paymentDate) : new Date();
              
              // Determinar si el pago está eliminado: si deletedAt existe, está eliminado
              const isDeleted = !!payment.deletedAt;
              
              // Determinar si es pago en bolívares: si viene el flag o si hay datos de bolívares
              const isBolivares = payment.isBolivares || !!(payment.exchangeRate || payment.amountInBolivares);
              
              const mappedPayment = {
                ...payment,
                paymentMethod: mapPaymentMethodFromAPI(payment.paymentMethod),
                paymentDate: paymentDate,
                createdAt: payment.createdAt ? new Date(payment.createdAt) : undefined,
                updatedAt: payment.updatedAt ? new Date(payment.updatedAt) : undefined,
                // Campos de eliminación
                // El backend envía deletedAt cuando está eliminado, no un campo deleted
                deleted: isDeleted,
                deletedAt: payment.deletedAt ? new Date(payment.deletedAt) : undefined,
                deletedBy: payment.deletedBy,
                deletedByUser: payment.deletedByUser,
                // El backend puede enviar deletionReason o deleteReason
                deleteReason: payment.deletionReason || payment.deleteReason,
                // Campos de bolívares
                isBolivares: isBolivares,
                exchangeRate: payment.exchangeRate,
                amountInBolivares: payment.amountInBolivares
              };
              
              return mappedPayment;
            }),
            pagination: response.pagination || {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0
            },
            statistics: response.statistics || {
              totalPaid: 0,
              paymentCount: 0,
              averagePayment: 0
            }
          };
        }
        throw new Error(response.message || 'Error al obtener pagos de la deuda');
      })
    );
  }

  /**
   * Exporta reporte de un proveedor como PDF (blob)
   */
  exportReport(
    supplierId: number,
    startDate?: Date,
    endDate?: Date
  ): Observable<Blob> {
    const params: Record<string, any> = {};

    if (startDate) {
      params['startDate'] = startDate.toISOString().split('T')[0];
    }

    if (endDate) {
      params['endDate'] = endDate.toISOString().split('T')[0];
    }

    return this.apiService.getFile(`/reports/export/${supplierId}`, params);
  }
}

