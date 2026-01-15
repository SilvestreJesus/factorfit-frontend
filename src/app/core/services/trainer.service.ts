import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainerService {

  // Usamos la variable base para mayor limpieza
  private readonly apiUrl = `${environment.apiUrl}/api/personal`;

  constructor(private http: HttpClient) {}

  // Obtener todos con filtro de sede
  getPersonal(sede: string = ''): Observable<any[]> {
    let params = new HttpParams();
    if (sede) {
      params = params.set('sede', sede);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // Obtener uno solo
  getPersonalByClave(clave: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave}`);
  }



  // Eliminar
  eliminarPersonal(clave: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${clave}`);
  }



// Personal.service.ts

subirImagenCloudinary(file: File): Observable<any> {
  const url = `https://api.cloudinary.com/v1_1/dwvcefm84/image/upload`;
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Tu preset configurado
  formData.append('folder', 'Personal'); // Carpeta específica para Personal

  return this.http.post(url, formData);
}

// Cambiamos FormData por 'any' porque ahora enviaremos JSON con la URL ya lista
registrarPersonal(data: any): Observable<any> {
  return this.http.post<any>(this.apiUrl, data);
}

actualizarPersonal(clave: string, data: any): Observable<any> {
  // Al ser JSON, podemos usar PUT directamente sin el truco de ?_method=PUT
  return this.http.put<any>(`${this.apiUrl}/${clave}`, data);
}

getImagenPersonal(ruta: string): string {
  if (!ruta) return 'assets/images/no-image.png';
  if (ruta.startsWith('http')) return ruta;
  return `${environment.apiUrl}/${ruta}`;
}
// Nuevo método para pedirle a Laravel que borre una imagen específica de la nube
borrarImagenCloudy(url: string): Observable<any> {
  // Enviamos la URL completa al backend para que él extraiga el ID y la borre
  return this.http.post(`${this.apiUrl}/destruir-imagen`, { url });
}
}