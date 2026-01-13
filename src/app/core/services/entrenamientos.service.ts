import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {

  // Centralizamos la URL para evitar errores de escritura
  private readonly apiUrl = `${environment.apiUrl}/api/entrenamientos`;

  constructor(private http: HttpClient) {}

  // Obtener todos con filtro opcional de sede
  getEntrenamientos(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) {
      params = params.set('sede', sede);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // Obtener un entrenamiento específico por su clave (ETRE001...)
  getEntrenamientosByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }

  // Registrar nuevo entrenamiento con imagen
  registrarEntrenamientos(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  // Actualizar usando el "spoofing" de método PUT para Laravel
  actualizarEntrenamientos(clave: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${clave}?_method=PUT`, formData);
  }

  // Eliminar entrenamiento
  eliminarEntrenamientos(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }

  /**
   * Método útil para el renderizado de imágenes en el HTML
   */
  getImagenEntrenamiento(ruta: string): string {
    if (!ruta) return 'assets/images/no-image.png';
    // Si es URL de Cloudinary (empieza con http), se devuelve tal cual
    return ruta.startsWith('http') ? ruta : `${environment.apiUrl}/${ruta}`;
  }
}