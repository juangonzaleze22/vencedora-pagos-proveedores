import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ProviderOrder, OrderDetail } from '../models/provider.model';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

export interface CreateOrderData {
  supplierId: number;
  amount: number;
  dispatchDate: Date;
  creditDays: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private apiService: ApiService) {}

  /**
   * Crea un nuevo pedido
   */
  create(data: CreateOrderData): Observable<ProviderOrder> {
    const payload = {
      supplierId: data.supplierId,
      amount: data.amount,
      dispatchDate: data.dispatchDate.toISOString().split('T')[0], // YYYY-MM-DD
      creditDays: data.creditDays
    };

    return this.apiService.post<ProviderOrder>('/orders', payload).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapOrderFromAPI(response.data);
        }
        throw new Error(response.message || 'Error al crear pedido');
      })
    );
  }

  /**
   * Lista pedidos con paginación
   */
  list(page?: number, limit?: number): Observable<PaginatedResponse<ProviderOrder>> {
    const params: Record<string, any> = {};
    if (page) params['page'] = page;
    if (limit) params['limit'] = limit;

    return this.apiService.get<ProviderOrder[]>('/orders', params).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            ...response,
            data: response.data.map(order => this.mapOrderFromAPI(order))
          } as PaginatedResponse<ProviderOrder>;
        }
        throw new Error(response.message || 'Error al listar pedidos');
      })
    );
  }

  /**
   * Obtiene un pedido por ID (detalle completo con supplier y debt)
   */
  getById(id: number): Observable<OrderDetail> {
    return this.apiService.get<OrderDetail>(`/orders/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapOrderDetailFromAPI(response.data);
        }
        throw new Error(response.message || 'Pedido no encontrado');
      })
    );
  }

  /**
   * Obtiene pedidos por proveedor
   */
  getBySupplier(supplierId: number): Observable<ProviderOrder[]> {
    return this.apiService.get<ProviderOrder[]>(`/orders/supplier/${supplierId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(order => this.mapOrderFromAPI(order));
        }
        throw new Error(response.message || 'Error al obtener pedidos del proveedor');
      })
    );
  }

  /**
   * Mapea un pedido desde la API
   */
  private mapOrderFromAPI(apiOrder: any): ProviderOrder {
    return {
      id: apiOrder.id,
      supplierId: apiOrder.supplierId,
      amount: apiOrder.amount,
      dispatchDate: new Date(apiOrder.dispatchDate),
      creditDays: apiOrder.creditDays,
      dueDate: new Date(apiOrder.dueDate),
      createdAt: apiOrder.createdAt ? new Date(apiOrder.createdAt) : undefined
    };
  }

  /**
   * Mapea un detalle de pedido desde la API (incluye supplier y debt)
   */
  private mapOrderDetailFromAPI(apiOrder: any): OrderDetail {
    return {
      id: apiOrder.id,
      supplierId: apiOrder.supplierId,
      supplier: apiOrder.supplier,
      amount: apiOrder.amount,
      dispatchDate: new Date(apiOrder.dispatchDate),
      creditDays: apiOrder.creditDays,
      dueDate: new Date(apiOrder.dueDate),
      debt: apiOrder.debt,
      createdBy: apiOrder.createdBy,
      createdAt: apiOrder.createdAt ? new Date(apiOrder.createdAt) : undefined,
      updatedAt: apiOrder.updatedAt ? new Date(apiOrder.updatedAt) : undefined
    };
  }
}

