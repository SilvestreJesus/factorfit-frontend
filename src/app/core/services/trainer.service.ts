import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainerService {

    
  private personalUrl = `${environment.apiUrl}/api/personal`;

  constructor(private http: HttpClient) {}


  // =====================================
  //               Personal
  // =====================================
 

  registrarPersonal(data: FormData) {
    return this.http.post<any>(`${environment.apiUrl}/api/personal`, data);
  }


  getPersonalByClave(clave: string) {
    return this.http.get<any>(`${environment.apiUrl}/api/personal/${clave}`);
  }
  getPersonal(sede: string = '') {
    let params: any = {};
    if (sede !== '') params.sede = sede;
    return this.http.get<any[]>(`${environment.apiUrl}/api/personal`, { params });
  }


  eliminarPersonal(clave: string) {
    return this.http.delete(`${environment.apiUrl}/api/personal/${clave}`);
  }

 actualizarPersonal(clave: string, formData: FormData) {
    return this.http.post(`${environment.apiUrl}/api/personal/${clave}?_method=PUT`, formData);
  }

  getPersonalPorSede(sede: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/api/personal`, { params: { sede } });
  }

  getImagenPersonal(ruta: string) {
    if (!ruta) return 'assets/no-image.png';
    return `${environment.apiUrl}/${ruta}`;
}

}
