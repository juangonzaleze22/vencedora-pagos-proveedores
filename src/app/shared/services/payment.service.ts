import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Payment, PaymentVerification, mapPaymentMethodFromAPI, mapPaymentMethodToAPI } from '../models/payment.model';
import { CashierPaymentsParams, CashierPaymentsResponse, CashierPaymentKPIs } from '../models/cashier.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { parseLocalDate, parseLocalDateOptional, formatLocalDate } from '../utils/date.utils';

export interface CreatePaymentData {
  debtId: number;
  supplierId: number;
  amount: number;
  paymentMethod: Payment['paymentMethod'];
  senderName: string;
  senderEmail: string;
  confirmationNumber: string;
  paymentDate: Date;
  receipt?: File; // File para nuevo archivo (compatibilidad)
  receiptFiles?: File[]; // Array de Files para múltiples archivos
  existingReceiptFiles?: string[]; // URLs de imágenes existentes a conservar (modo edición)
  removeReceipt?: boolean; // true para eliminar la imagen existente
  isBolivares?: boolean; // Switch BS/USD
  exchangeRate?: number; // Tasa del dólar
  amountInBolivares?: number; // Monto en bolívares
  createdBy?: number; // ID del usuario que registra el pago
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private apiService: ApiService) {}

  /**
   * Crea un nuevo pago (con FormData para archivos)
   */
  create(data: CreatePaymentData): Observable<Payment> {
    const formData = new FormData();
    
    // Asegurar que paymentDate sea un objeto Date válido
    let paymentDate: Date;
    if (data.paymentDate instanceof Date) {
      paymentDate = data.paymentDate;
    } else if (typeof data.paymentDate === 'string') {
      paymentDate = new Date(data.paymentDate);
    } else {
      paymentDate = new Date(data.paymentDate);
    }
    
    // Mapear método de pago a formato API
    const paymentMethodAPI = mapPaymentMethodToAPI(data.paymentMethod);
    
    // Construir FormData según el formato esperado por el backend
    formData.append('debtId', data.debtId.toString());
    formData.append('supplierId', data.supplierId.toString());
    formData.append('amount', data.amount.toString());
    formData.append('paymentMethod', paymentMethodAPI);
    formData.append('senderName', data.senderName);
    formData.append('senderEmail', data.senderEmail);
    formData.append('confirmationNumber', data.confirmationNumber);
    formData.append('paymentDate', paymentDate.toISOString());
    
    // ID del usuario que registra el pago
    if (data.createdBy !== undefined && data.createdBy !== null) {
      formData.append('createdBy', data.createdBy.toString());
    }
    
    // Campos de bolívares - siempre enviar isBolivares
    formData.append('isBolivares', (data.isBolivares ?? false).toString());
    
    // Si está en bolívares, agregar tasa y monto en bolívares
    if (data.isBolivares) {
      if (data.exchangeRate !== undefined && data.exchangeRate !== null) {
        formData.append('exchangeRate', data.exchangeRate.toString());
      }
      if (data.amountInBolivares !== undefined && data.amountInBolivares !== null) {
        formData.append('amountInBolivares', data.amountInBolivares.toString());
      }
    }
    
    // Enviar múltiples archivos: cada uno con el mismo campo 'receipt'
    if (data.receiptFiles && data.receiptFiles.length > 0) {
      data.receiptFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append('receipt', file, file.name);
        }
      });
    } else if (data.receipt && data.receipt instanceof File) {
      formData.append('receipt', data.receipt, data.receipt.name);
    }

    return this.apiService.postFormData<Payment>('/payments', formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapPaymentFromAPI(response.data);
        }
        // Si hay errores de validación, lanzar un error con la estructura completa
        const error: any = new Error(response.message || 'Error al crear pago');
        error.response = response;
        throw error;
      }),
      catchError((error) => {
        // Si el error tiene la estructura de respuesta de la API, preservarla
        if (error.response) {
          return throwError(() => error);
        }
        // Si es un error HTTP, intentar extraer la respuesta
        if (error.error) {
          const apiError: any = new Error(error.error.message || error.message || 'Error al crear pago');
          apiError.response = error.error;
          return throwError(() => apiError);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Lista pagos con paginación
   */
  list(page?: number, limit?: number): Observable<PaginatedResponse<Payment>> {
    const params: Record<string, any> = {};
    if (page) params['page'] = page;
    if (limit) params['limit'] = limit;

    return this.apiService.get<Payment[]>('/payments', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            ...response,
            data: response.data.map(p => this.mapPaymentFromAPI(p))
          } as PaginatedResponse<Payment>;
        }
        throw new Error(response.message || 'Error al listar pagos');
      })
    );
  }

  /**
   * Obtiene un pago por ID
   */
  getById(id: number): Observable<Payment> {
    return this.apiService.get<Payment>(`/payments/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapPaymentFromAPI(response.data);
        }
        throw new Error(response.message || 'Pago no encontrado');
      })
    );
  }

  /**
   * Obtiene pagos por proveedor
   */
  getBySupplier(supplierId: number, page?: number, limit?: number): Observable<PaginatedResponse<Payment>> {
    const params: Record<string, any> = {};
    if (page) params['page'] = page;
    if (limit) params['limit'] = limit;

    return this.apiService.get<Payment[]>(`/payments/supplier/${supplierId}`, params).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            ...response,
            data: response.data.map(p => this.mapPaymentFromAPI(p))
          } as PaginatedResponse<Payment>;
        }
        throw new Error(response.message || 'Error al obtener pagos del proveedor');
      })
    );
  }

  /**
   * Busca pagos por número de confirmación (para autocomplete)
   * @param query Número de confirmación a buscar (mínimo 3 caracteres)
   * @param limit Límite de resultados (máximo 20, por defecto 10)
   * @returns Observable con array de pagos encontrados
   */
  searchByConfirmation(query: string, limit?: number): Observable<Payment[]> {
    // Validar que query tenga al menos 3 caracteres
    if (!query || query.length < 3) {
      return of([]);
    }

    // Validar y ajustar límite (máximo 20)
    const searchLimit = limit && limit <= 20 ? limit : (limit || 10);

    const params: Record<string, any> = {
      q: query,
      limit: searchLimit
    };

    return this.apiService.get<Payment[]>('/payments/search-by-confirmation', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(p => this.mapPaymentFromAPI(p));
        }
        return [];
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Verifica un pago Zelle por número de confirmación
   */
  verifyZelle(confirmationNumber: string): Observable<PaymentVerification> {
    return this.apiService.post<Payment>('/payments/verify-zelle', { confirmationNumber }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            encontrado: true,
            pago: this.mapPaymentFromAPI(response.data),
            mensaje: response.message || 'Pago verificado exitosamente'
          };
        }
        throw new Error(response.message || 'Error al verificar pago');
      }),
      map((verification: PaymentVerification) => verification),
      // Manejar error 404 como "no encontrado" en lugar de error
      catchError((error: any) => {
        if (error.status === 404 || error.message?.includes('No se encontraron registros')) {
          return of({
            encontrado: false,
            mensaje: `No se encontraron registros para la confirmación #${confirmationNumber}`
          } as PaymentVerification);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza un pago existente (con FormData para archivos)
   */
  update(id: number, data: CreatePaymentData): Observable<Payment> {
    const formData = new FormData();
    
    // Asegurar que paymentDate sea un objeto Date válido
    let paymentDate: Date;
    if (data.paymentDate instanceof Date) {
      paymentDate = data.paymentDate;
    } else if (typeof data.paymentDate === 'string') {
      paymentDate = new Date(data.paymentDate);
    } else {
      paymentDate = new Date(data.paymentDate);
    }
    
    // Mapear método de pago a formato API
    const paymentMethodAPI = mapPaymentMethodToAPI(data.paymentMethod);
    
    // Construir FormData según el formato esperado por el backend
    formData.append('debtId', data.debtId.toString());
    formData.append('supplierId', data.supplierId.toString());
    formData.append('amount', data.amount.toString());
    formData.append('paymentMethod', paymentMethodAPI);
    formData.append('senderName', data.senderName);
    formData.append('senderEmail', data.senderEmail);
    formData.append('confirmationNumber', data.confirmationNumber);
    formData.append('paymentDate', paymentDate.toISOString());
    
    formData.append('isBolivares', (data.isBolivares ?? false).toString());
    
    if (data.isBolivares) {
      if (data.exchangeRate !== undefined && data.exchangeRate !== null) {
        formData.append('exchangeRate', data.exchangeRate.toString());
      }
      if (data.amountInBolivares !== undefined && data.amountInBolivares !== null) {
        formData.append('amountInBolivares', data.amountInBolivares.toString());
      }
    }
    
    if (data.removeReceipt === true) {
      formData.append('removeReceipt', 'true');
    }
    
    // Enviar URLs de imágenes existentes que el usuario conservó
    if (data.existingReceiptFiles && data.existingReceiptFiles.length > 0) {
      data.existingReceiptFiles.forEach((url) => {
        formData.append('existingReceiptFiles', url);
      });
    }
    
    // Enviar múltiples archivos nuevos: cada uno con el mismo campo 'receipt'
    if (data.receiptFiles && data.receiptFiles.length > 0) {
      data.receiptFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append('receipt', file, file.name);
        }
      });
    } else if (data.receipt && data.receipt instanceof File) {
      formData.append('receipt', data.receipt, data.receipt.name);
    }

    return this.apiService.putFormData<Payment>(`/payments/${id}`, formData).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapPaymentFromAPI(response.data);
        }
        // Si hay errores de validación, lanzar un error con la estructura completa
        const error: any = new Error(response.message || 'Error al actualizar pago');
        error.response = response;
        throw error;
      }),
      catchError((error) => {
        // Si el error tiene la estructura de respuesta de la API, preservarla
        if (error.response) {
          return throwError(() => error);
        }
        // Si es un error HTTP, intentar extraer la respuesta
        if (error.error) {
          const apiError: any = new Error(error.error.message || error.message || 'Error al actualizar pago');
          apiError.response = error.error;
          return throwError(() => apiError);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Descarga el comprobante de un pago
   */
  getReceipt(id: number): Observable<Blob> {
    return this.apiService.getFile(`/payments/${id}/receipt`);
  }

  /**
   * Comparte un pago generando un enlace de WhatsApp
   * @param id ID del pago a compartir
   * @returns Observable con el pago actualizado y la URL de WhatsApp
   */
  share(id: number): Observable<{ payment: Payment; whatsappUrl: string }> {
    return this.apiService.post<{ payment: any; whatsappUrl: string }>(`/payments/${id}/share`, {}).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            payment: this.mapPaymentFromAPI(response.data.payment),
            whatsappUrl: response.data.whatsappUrl
          };
        }
        throw new Error(response.message || 'Error al compartir pago');
      }),
      catchError((error: any) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un pago (soft delete)
   * @param id ID del pago a eliminar
   * @param reason Motivo opcional de eliminación
   * @returns Observable<void>
   */
  delete(id: number, reason?: string): Observable<void> {
    const body = reason ? { reason } : undefined;
    
    return this.apiService.delete(`/payments/${id}`, body).pipe(
      map(response => {
        if (response.success) {
          return;
        }
        throw new Error(response.message || 'Error al eliminar pago');
      }),
      catchError((error: any) => {
        // Preservar el error original pero mejorarlo si es necesario
        let enhancedError = error;
        
        // Si el error tiene estructura de respuesta de API, preservarla
        if (error?.error) {
          enhancedError = error;
        } else if (error?.response) {
          enhancedError = error;
        }
        
        return throwError(() => enhancedError);
      })
    );
  }

  /**
   * Obtiene pagos procesados por un cajero específico.
   * El backend devuelve { data: Payment[], pagination } (estructura plana).
   * Los KPIs se calculan en el frontend a partir de todos los pagos recibidos.
   * @param cashierId ID del cajero
   * @param params Filtros opcionales (paginación, fechas, método de pago, etc.)
   */
  getPaymentsByCashier(
    cashierId: number,
    params?: CashierPaymentsParams
  ): Observable<CashierPaymentsResponse> {
    const queryParams: Record<string, any> = {};

    if (params?.page) queryParams['page'] = params.page;
    if (params?.limit) queryParams['limit'] = params.limit;
    if (params?.startDate) queryParams['startDate'] = params.startDate;
    if (params?.endDate) queryParams['endDate'] = params.endDate;
    if (params?.paymentMethod) queryParams['paymentMethod'] = params.paymentMethod;
    if (params?.includeDeleted !== undefined) queryParams['includeDeleted'] = params.includeDeleted;

    return this.apiService.get<any>(`/payments/cashier/${cashierId}`, queryParams).pipe(
      map((response: any) => {
        if (response.success) {
          // El backend devuelve: { success, data: Payment[], pagination }
          const rawPayments: any[] = response.data || [];
          const payments = rawPayments.map((p: any) => this.mapPaymentFromAPI(p));
          const pagination = response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

          // Extraer info del cajero del primer pago (si existe createdByUser)
          const firstWithUser = rawPayments.find((p: any) => p.createdByUser);
          const cashier = firstWithUser?.createdByUser
            ? {
                id: firstWithUser.createdByUser.id,
                nombre: firstWithUser.createdByUser.nombre,
                email: firstWithUser.createdByUser.email,
                rol: 'CAJERO'
              }
            : { id: cashierId, nombre: '', email: '', rol: 'CAJERO' };

          // Calcular KPIs a partir de los pagos recibidos
          const kpis = this.calculateKPIs(payments);

          return { cashier, kpis, payments, pagination };
        }
        throw new Error(response.message || 'Error al obtener pagos del cajero');
      }),
      catchError((error: any) => {
        if (error.error?.message) {
          return throwError(() => new Error(error.error.message));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Calcula KPIs a partir de un array de pagos ya mapeados.
   */
  private calculateKPIs(payments: Payment[]): CashierPaymentKPIs {
    const activePayments = payments.filter(p => !p.deleted);

    const totalPayments = activePayments.length;
    const totalAmount = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAmountInBolivares = activePayments
      .filter(p => p.isBolivares && p.amountInBolivares)
      .reduce((sum, p) => sum + (p.amountInBolivares || 0), 0);
    const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const byPaymentMethod = {
      ZELLE: { count: 0, totalAmount: 0 },
      TRANSFER: { count: 0, totalAmount: 0 },
      CASH: { count: 0, totalAmount: 0 }
    };

    for (const p of activePayments) {
      const key = p.paymentMethod === 'Zelle' ? 'ZELLE'
        : p.paymentMethod === 'Transferencia' ? 'TRANSFER'
        : 'CASH';
      byPaymentMethod[key].count++;
      byPaymentMethod[key].totalAmount += p.amount || 0;
    }

    const byStatus = {
      verified: payments.filter(p => p.verified && !p.deleted).length,
      unverified: payments.filter(p => !p.verified && !p.deleted).length,
      shared: payments.filter(p => p.shared && !p.deleted).length,
      deleted: payments.filter(p => p.deleted).length
    };

    // Rango de fechas
    const dates = activePayments
      .map(p => p.paymentDate)
      .filter(d => d instanceof Date && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const dateRange = {
      firstPayment: dates.length > 0 ? dates[0] : null,
      lastPayment: dates.length > 0 ? dates[dates.length - 1] : null
    };

    // Proveedores distintos
    const supplierIds = new Set(activePayments.map(p => p.supplierId).filter(Boolean));

    return {
      totalPayments,
      totalAmount,
      totalAmountInBolivares,
      averagePaymentAmount,
      byPaymentMethod,
      byStatus,
      dateRange,
      suppliersServed: supplierIds.size
    };
  }

  /**
   * Mapea un pago desde la API
   */
  private mapPaymentFromAPI(apiPayment: any): Payment {
    return {
      id: apiPayment.id,
      debtId: apiPayment.debtId,
      supplierId: apiPayment.supplierId,
      supplier: apiPayment.supplier,
      debt: apiPayment.debt ? {
        id: apiPayment.debt.id,
        orderId: apiPayment.debt.orderId,
        status: apiPayment.debt.status,
        remainingAmount: apiPayment.debt.remainingAmount,
        initialAmount: apiPayment.debt.initialAmount,
        dueDate: parseLocalDateOptional(apiPayment.debt.dueDate),
        debtNumber: apiPayment.debt.debtNumber
      } : undefined,
      amount: apiPayment.amount,
      paymentMethod: mapPaymentMethodFromAPI(apiPayment.paymentMethod),
      senderName: apiPayment.senderName,
      senderEmail: apiPayment.senderEmail,
      confirmationNumber: apiPayment.confirmationNumber,
      paymentDate: parseLocalDate(apiPayment.paymentDate),
      receiptFiles: apiPayment.receiptFiles ?? (apiPayment.receiptFile ? [apiPayment.receiptFile] : []),
      verified: apiPayment.verified,
      shared: apiPayment.shared || false,
      sharedAt: apiPayment.sharedAt ? new Date(apiPayment.sharedAt) : undefined,
      createdBy: apiPayment.createdBy,
      createdByUser: apiPayment.createdByUser,
      createdAt: apiPayment.createdAt ? new Date(apiPayment.createdAt) : undefined,
      updatedAt: apiPayment.updatedAt ? new Date(apiPayment.updatedAt) : undefined,
      // Campos de eliminación
      // El backend envía deletedAt cuando está eliminado, no un campo deleted
      deleted: !!apiPayment.deletedAt,
      deletedAt: apiPayment.deletedAt ? new Date(apiPayment.deletedAt) : undefined,
      deletedBy: apiPayment.deletedBy,
      deletedByUser: apiPayment.deletedByUser,
      // El backend puede enviar deletionReason o deleteReason
      deleteReason: apiPayment.deletionReason || apiPayment.deleteReason,
      // Campos de bolívares
      // Si viene el flag o si hay datos de bolívares, asumimos que es pago en bolívares
      isBolivares: apiPayment.isBolivares || !!(apiPayment.exchangeRate || apiPayment.amountInBolivares),
      exchangeRate: apiPayment.exchangeRate,
      amountInBolivares: apiPayment.amountInBolivares
    };
  }
}

