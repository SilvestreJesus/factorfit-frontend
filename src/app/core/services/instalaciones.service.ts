import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstalacionesService {

  // Centralizamos la URL usando la constante del environment
  private readonly apiUrl = `${environment.apiUrl}/api/instalaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de instalaciones, filtrada opcionalmente por sede
   */
  getInstalaciones(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) {
      params = params.set('sede', sede);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  /**
   * Busca una instalación específica por su clave única (INST001...)
   */
  getInstalacionesByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }

  /**
   * Crea una nueva instalación subiendo imagen a Cloudinary mediante FormData
   */
  registrarInstalaciones(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  /**
   * Actualiza una instalación existente. 
   * IMPORTANTE: Se usa POST con ?_method=PUT para que Laravel procese el FormData con archivos.
   */
  actualizarInstalaciones(clave: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clave}?_method=PUT`, formData);
  }

  /**
   * Elimina el registro y la imagen vinculada en Cloudinary
   */
  eliminarInstalaciones(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }

  /**
   * Resuelve la URL de la imagen de forma segura
   */
  getImagenInstalacion(ruta: string): string {
    if (!ruta) return 'assets/images/no-image.png';
    
    // Si la ruta viene de Cloudinary (comienza con http), se retorna directa
    if (ruta.startsWith('http')) {
      return ruta;
    }
    
    // Fallback para rutas locales antiguas si existieran
    return `${environment.apiUrl}/${ruta}`;
  }
}