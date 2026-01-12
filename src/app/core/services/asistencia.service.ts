import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AsistenciaService {


    
  private apiUrl = `${environment.apiUrl}/api/asistencias`;

  constructor(private http: HttpClient) {}
// Este es el que te falta:
  getAsistenciasPorSede(sede: string) {
    // Ajusta la URL según cómo esté definida en tu API (ej: /api/asistencias/sede/centro)
    return this.http.get<any>(`${this.apiUrl}/sede/${sede}`);
  }

getAsistencias(sede: string = '') {
  // Enviamos la sede como un query parameter ?sede=NombreSede
  return this.http.get<any>(`${this.apiUrl}?sede=${sede}`);
}

  // Este método llama al 'public function store' de tu controlador Laravel
  registrarAsistencia(clave_cliente: string): Observable<any> {
    return this.http.post(this.apiUrl, { 
        clave_cliente: clave_cliente,
        porcentaje: '100%' // Opcional, según tu controlador
    });
  }

  // Para el gráfico de barras que tienes en el index del controlador
  getStats(sede: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?sede=${sede}`);
  }

verificarRostroBackend(clave: string, imageBase64: string) {
  return this.http.post(`${this.apiUrl}/verificar-rostro`, {
    clave: clave,
    image: imageBase64
  });
}  

}