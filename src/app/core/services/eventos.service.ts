import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  // Usamos la variable base para mayor limpieza
  private readonly apiUrl = `${environment.apiUrl}/api/eventos`;

  constructor(private http: HttpClient) {}

  // Obtener todos con filtro de sede
  getEventos(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) {
      params = params.set('sede', sede);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // Obtener uno solo
  getEventosByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }

  // Registrar (FormData incluye la imagen)
  registrarEventos(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  // Actualizar (FormData + Simulación de PUT para Laravel)
  actualizarEventos(clave: string, formData: FormData): Observable<any> {
    // Es vital el ?_method=PUT para que Laravel detecte los archivos en el Request
    return this.http.post<any>(`${this.apiUrl}/${clave}?_method=PUT`, formData);
  }

  // Eliminar
  eliminarEventos(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }

  // Gestor de imágenes inteligente
  getImagenEvento(ruta: string): string {
    if (!ruta) return 'assets/images/no-image.png';

    // Si es Cloudinary (empieza con http)
    if (ruta.startsWith('http')) {
      return ruta;
    }

    // Si es una imagen local vieja (fallback)
    return `${environment.apiUrl}/${ruta}`;
  }
}