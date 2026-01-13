import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainerService {

  private readonly apiUrl = `${environment.apiUrl}/api/personal`;

  constructor(private http: HttpClient) {}

  // =====================================
  //               Personal
  // =====================================

  registrarPersonal(data: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getPersonalByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }

  getPersonal(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) {
      params = params.set('sede', sede);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  eliminarPersonal(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }

  actualizarPersonal(clave: string, formData: FormData): Observable<any> {
    // Correcto: usamos POST con ?_method=PUT para archivos en Laravel
    return this.http.post<any>(`${this.apiUrl}/${clave}?_method=PUT`, formData);
  }

  getPersonalPorSede(sede: string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params: { sede } });
  }

  // --- CORRECCIÓN PARA CLOUDINARY ---
  getImagenPersonal(ruta: string): string {
    if (!ruta) return 'assets/no-image.png';

    // Si la ruta ya es una URL completa (Cloudinary), no le añadimos el apiUrl
    if (ruta.startsWith('http')) {
      return ruta;
    }

    // Solo si es una ruta local antigua
    return `${environment.apiUrl}/${ruta}`;
  }
}