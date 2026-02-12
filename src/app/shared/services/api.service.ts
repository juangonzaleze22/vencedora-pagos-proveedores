import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio base para llamadas a API
 * 
 * Proporciona métodos genéricos para realizar peticiones HTTP
 * con manejo de errores consistente y soporte para respuestas de la API.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment?.apiUrl || 'http://localhost:3000/api';
  }

  /**
   * Realiza una petición GET
   * @param endpoint Endpoint relativo a la base URL
   * @param params Parámetros de consulta
   * @returns Observable con la respuesta
   */
  get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición POST con JSON
   * @param endpoint Endpoint relativo a la base URL
   * @param body Cuerpo de la petición
   * @returns Observable con la respuesta
   */
  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición POST con FormData (para archivos)
   * @param endpoint Endpoint relativo a la base URL
   * @param formData FormData con los datos
   * @returns Observable con la respuesta
   */
  postFormData<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    // No incluir Content-Type, el navegador lo hace automáticamente con FormData
    // El interceptor se encargará de agregar el token de autorización
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición PUT
   * @param endpoint Endpoint relativo a la base URL
   * @param body Cuerpo de la petición
   * @returns Observable con la respuesta
   */
  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición PUT con FormData (para archivos)
   * @param endpoint Endpoint relativo a la base URL
   * @param formData FormData con los datos
   * @returns Observable con la respuesta
   */
  putFormData<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    // No incluir Content-Type, el navegador lo hace automáticamente con FormData
    // El interceptor se encargará de agregar el token de autorización
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición DELETE
   * @param endpoint Endpoint relativo a la base URL
   * @param body Cuerpo opcional de la petición (para casos como reason en eliminación)
   * @returns Observable con la respuesta
   */
  delete<T>(endpoint: string, body?: any): Observable<ApiResponse<T>> {
    // Si hay body, usar http.request para evitar problemas de tipado
    if (body) {
      return this.http.request<ApiResponse<T>>('DELETE', `${this.baseUrl}${endpoint}`, {
        body: body,
        headers: this.getHeaders()
      }).pipe(
        catchError(this.handleError)
      );
    }
    
    // Si no hay body, usar http.delete normalmente
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un archivo (blob)
   * @param endpoint Endpoint relativo a la base URL
   * @param params Parámetros de consulta opcionales
   * @returns Observable con el blob
   */
  getFile(endpoint: string, params?: Record<string, any>): Observable<Blob> {
    const httpParams = this.buildParams(params);
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Construye HttpParams desde un objeto
   */
  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          if (params[key] instanceof Date) {
            httpParams = httpParams.set(key, params[key].toISOString());
          } else {
            httpParams = httpParams.set(key, params[key].toString());
          }
        }
      });
    }
    return httpParams;
  }

  /**
   * Obtiene los headers por defecto con token
   */
  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.getToken();
    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Obtiene el token del localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Maneja errores de las peticiones HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      const apiError = error.error as ApiResponse<any>;
      if (apiError?.message) {
        errorMessage = apiError.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
}
