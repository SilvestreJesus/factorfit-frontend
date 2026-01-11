import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {

  private entrenamientosUrl = `${environment.apiUrl}/api/entrenamientos`;

  constructor(private http: HttpClient) {}


// =====================================
//               entrenamientos
// =====================================

getEntrenamientos(sede: string = '') {
  let params: any = {};
  if (sede !== '') params.sede = sede;
  return this.http.get<any[]>(`${environment.apiUrl}/api/entrenamientos`, { params });
}

getEntrenamientosByClave(clave: string) {
  return this.http.get<any>(`${environment.apiUrl}/api/entrenamientos/${clave}`);
}

registrarEntrenamientos(formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/entrenamientos`, formData);
}

actualizarEntrenamientos(clave: string, formData: FormData) {
  return this.http.post<any>(`${environment.apiUrl}/api/entrenamientos/${clave}?_method=PUT`, formData);
}

eliminarEntrenamientos(clave: string) {
  return this.http.delete<any>(`${environment.apiUrl}/api/entrenamientos/${clave}`);
}
}
