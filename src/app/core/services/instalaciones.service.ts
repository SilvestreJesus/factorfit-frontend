import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstalacionesService {

  private instalacionesUrl = `${environment.apiUrl}/api/instalaciones`;

  constructor(private http: HttpClient) {}


// =====================================
//               instalaciones
// =====================================

getInstalaciones(sede: string = '') {
  let params: any = {};
  if (sede !== '') params.sede = sede;
  return this.http.get<any[]>(`${environment.apiUrl}/api/instalaciones`, { params });
}

getInstalacionesByClave(clave: string) {
  return this.http.get<any>(`${environment.apiUrl}/api/instalaciones/${clave}`);
}

registrarInstalaciones(formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/instalaciones`, formData);
}

actualizarInstalaciones(clave: string, formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/instalaciones/${clave}?_method=PUT`, formData);
}

eliminarInstalaciones(clave: string) {
  return this.http.delete<any>(`${environment.apiUrl}/api/instalaciones/${clave}`);
}
}
