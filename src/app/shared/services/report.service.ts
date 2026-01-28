import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Provider, Debt } from '../models/provider.model';
import { Payment, mapPaymentMethodFromAPI } from '../models/payment.model';

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
      params['startDate'] = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      params['endDate'] = endDate.toISOString().split('T')[0];
    }

    return this.apiService.get<SupplierDetailedReport>(`/reports/supplier/${supplierId}/detailed`, params).pipe(
      map(response => {
        if (response.success && response.data) {
          const data = response.data;
          return {
            supplier: {
              id: data.supplier.id,
              companyName: data.supplier.companyName,
              taxId: data.supplier.taxId,
              status: data.supplier.status,
              totalDebt: data.supplier.totalDebt,
              lastPaymentDate: data.supplier.lastPaymentDate ? new Date(data.supplier.lastPaymentDate) : undefined,
              createdAt: data.supplier.createdAt ? new Date(data.supplier.createdAt) : undefined,
              updatedAt: data.supplier.updatedAt ? new Date(data.supplier.updatedAt) : undefined
            },
            totalPaid: data.totalPaid,
            paymentCount: data.paymentCount,
            averagePayment: data.averagePayment,
            debts: data.debts.map(debt => ({
              ...debt,
              dueDate: new Date(debt.dueDate),
              createdAt: debt.createdAt ? new Date(debt.createdAt) : undefined,
              updatedAt: debt.updatedAt ? new Date(debt.updatedAt) : undefined
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
      params['startDate'] = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      params['endDate'] = endDate.toISOString().split('T')[0];
    }

    return this.apiService.get<Payment[]>(`/debts/${debtId}/payments`, params).pipe(
      map((response: any) => {
        if (response.success) {
          return {
            data: (response.data || []).map((payment: any) => {
              // Extraer solo la fecha (sin hora) para evitar problemas de zona horaria
              const paymentDateStr = payment.paymentDate;
              let paymentDate: Date;
              if (paymentDateStr) {
                // Si viene como ISO string, extraer solo la parte de la fecha
                const dateOnly = paymentDateStr.split('T')[0]; // "2026-01-14"
                paymentDate = new Date(dateOnly + 'T00:00:00');
              } else {
                paymentDate = new Date();
              }
              
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
   * Exporta reporte de un proveedor
   */
  exportReport(supplierId: number): Observable<any> {
    return this.apiService.get<any>(`/reports/export/${supplierId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Error al exportar reporte');
      })
    );
  }
}

