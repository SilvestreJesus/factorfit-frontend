import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  private eventosUrl = `${environment.apiUrl}/api/eventos`;

  constructor(private http: HttpClient) {}


// =====================================
//               Eventos
// =====================================

getEventos(sede: string = '') {
  let params: any = {};
  if (sede !== '') params.sede = sede;
  return this.http.get<any[]>(`${environment.apiUrl}/api/eventos`, { params });
}

getEventosByClave(clave: string) {
  return this.http.get<any>(`${environment.apiUrl}/api/eventos/${clave}`);
}

registrarEventos(formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/eventos`, formData);
}

actualizarEventos(clave: string, formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/eventos/${clave}?_method=PUT`, formData);
}

eliminarEventos(clave: string) {
  return this.http.delete<any>(`${environment.apiUrl}/api/eventos/${clave}`);
}

getImagenEvento(ruta: string) {
  if (!ruta) return 'assets/no-image.png';
  return `${environment.apiUrl}/${ruta}`;
}

}
