import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstalacionesService {
  private readonly apiUrl = `${environment.apiUrl}/api/instalaciones`;

  constructor(private http: HttpClient) {}

  getInstalaciones(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) params = params.set('sede', sede);
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // Agregamos este para el cargarInstalacion() del TS
  getInstalacionesByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }

// core/services/instalaciones.service.ts

subirImagenCloudinary(file: File): Observable<any> {
  const url = `https://api.cloudinary.com/v1_1/dwvcefm84/image/upload`;
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('folder', 'instalaciones'); // <--- Asegúrate que diga instalaciones

  return this.http.post(url, formData);
}



  registrarInstalaciones(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarInstalaciones(clave: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${clave}`, data);
  }

  eliminarInstalaciones(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }

  getImagenInstalacion(ruta: string): string {
    if (!ruta) return 'assets/images/no-image.png';
    return ruta.startsWith('http') ? ruta : `${environment.apiUrl}/${ruta}`;
  }

// Nuevo método para pedirle a Laravel que borre una imagen específica de la nube
borrarImagenCloudy(url: string): Observable<any> {
  // Enviamos la URL completa al backend para que él extraiga el ID y la borre
  return this.http.post(`${this.apiUrl}/destruir-imagen`, { url });
}
}