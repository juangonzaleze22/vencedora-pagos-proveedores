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

/** Crédito por excedente de un pago (saldo a favor del proveedor). */
export interface SupplierCredit {
  id: number;
  paymentId: number;
  originDebtId: number;
  supplierId: number;
  amount: number;
  remaining: number;
  status: string;
  description?: string;
  payment?: {
    id: number;
    senderName?: string;
    paymentDate?: Date;
    amount: number;
  };
  originDebt?: { id: number; title?: string };
  createdAt?: Date;
}

export interface SupplierDetailedReport {
  supplier: Provider;
  totalPaid: number;
  paymentCount: number;
  averagePayment: number;
  debts: Debt[];
  totalCreditAvailable?: number;
  credits?: SupplierCredit[];
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

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene el monto efectivo/restante de la deuda priorizando el nuevo campo del backend.
   */
  private getDebtEffectiveAmount(debt: any): number {
    const effectiveFromApi = Number(
      debt?.effectiveAmmount ??
      debt?.effectiveAmount ??
      debt?.remainingAmount ??
      0
    );
    return Number.isFinite(effectiveFromApi) ? effectiveFromApi : 0;
  }

  /**
   * Normaliza el restante de una deuda considerando excedente aplicado al crearla.
   * Evita doble descuento cuando el backend ya lo aplicó.
   */
  private getAdjustedRemainingAmount(debt: any, surplusAmountApplied: number): number {
    const rawRemaining = this.getDebtEffectiveAmount(debt);
    const initialAmount = Number(debt?.initialAmount ?? 0);
    const payments = Array.isArray(debt?.payments) ? debt.payments : [];

    if (surplusAmountApplied <= 0 || initialAmount <= 0) {
      return rawRemaining;
    }

    const activePaid = payments.reduce((sum: number, p: any) => {
      if (p?.deleted || p?.deletedAt) return sum;
      return sum + Number(p?.amount ?? 0);
    }, 0);

    const expectedWithoutSurplus = Math.max(initialAmount - activePaid, 0);
    const expectedWithSurplus = Math.max(initialAmount - activePaid - surplusAmountApplied, 0);

    const distanceWithout = Math.abs(rawRemaining - expectedWithoutSurplus);
    const distanceWith = Math.abs(rawRemaining - expectedWithSurplus);

    // Si el restante reportado se parece más al cálculo sin excedente, aplicar descuento en frontend.
    if (distanceWithout < distanceWith) {
      return expectedWithSurplus;
    }

    // Si ya parece venir con excedente aplicado, respetar backend.
    return rawRemaining;
  }

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
          const creditsRaw = Array.isArray(data.credits) ? data.credits : [];
          const credits: SupplierCredit[] = creditsRaw.map((c: any) => ({
            id: c.id,
            paymentId: c.paymentId,
            originDebtId: c.originDebtId,
            supplierId: c.supplierId,
            amount: Number(c.amount ?? 0),
            remaining: Number(c.remaining ?? c.amount ?? 0),
            status: c.status || 'AVAILABLE',
            description: c.description,
            payment: c.payment
              ? {
                  id: c.payment.id,
                  senderName: c.payment.senderName,
                  amount: Number(c.payment.amount ?? 0),
                  paymentDate: parseLocalDateOptional(c.payment.paymentDate)
                }
              : undefined,
            originDebt: c.originDebt
              ? {
                  id: c.originDebt.id,
                  title: c.originDebt.title
                }
              : undefined,
            createdAt: c.createdAt ? new Date(c.createdAt) : undefined
          }));

          return {
            supplier: {
              ...s,
              totalCreditAvailable: credit,
              lastPaymentDate: parseLocalDateOptional(s.lastPaymentDate),
              createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined
            } as Provider,
            totalCreditAvailable: credit,
            credits,
            totalPaid: data.totalPaid,
            paymentCount: data.paymentCount,
            averagePayment: data.averagePayment,
            debts: (data.debts || []).map((debt: any) => {
              const surplusAmountApplied = Number(
                debt.surplusAmountAtCreation ??
                debt.surplusAmountApplied ??
                debt.surplusApplied ??
                debt.appliedSurplus ??
                0
              );

              return {
                ...debt,
                remainingAmount: this.getAdjustedRemainingAmount(debt, surplusAmountApplied),
                effectiveAmmount: this.getDebtEffectiveAmount(debt),
                dueDate: parseLocalDate(debt.dueDate),
                createdAt: debt.createdAt ? new Date(debt.createdAt) : undefined,
                updatedAt: debt.updatedAt ? new Date(debt.updatedAt) : undefined,
                surplusAmountApplied
              };
            })
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

