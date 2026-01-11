import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private apiUrl = `${environment.apiUrl}/api/asistencias`;

  constructor(private http: HttpClient) {}
// Este es el que te falta:
  getAsistenciasPorSede(sede: string) {
    // Ajusta la URL según cómo esté definida en tu API (ej: /api/asistencias/sede/centro)
    return this.http.get<any>(`${this.apiUrl}/sede/${sede}`);
  }
    // En asistencia.service.ts
    registrarAsistencia(clave: string) {
    return this.http.post(this.apiUrl, {
        clave_cliente: clave
        // Dejamos que Laravel ponga la fecha/hora real del servidor
    });
    }
getAsistencias(sede: string = '') {
  // Enviamos la sede como un query parameter ?sede=NombreSede
  return this.http.get<any>(`${this.apiUrl}?sede=${sede}`);
}
}