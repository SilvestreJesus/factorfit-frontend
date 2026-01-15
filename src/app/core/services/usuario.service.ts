import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/api/usuarios`;
  private promocionesUrl = `${environment.apiUrl}/api/promociones`;
  private pagosUrl = `${environment.apiUrl}/api/pagos`;
  private personalUrl = `${environment.apiUrl}/api/personal`;
  private asistenciasUrl = `${environment.apiUrl}/api/asistencias`;

  constructor(private http: HttpClient) {}


  recuperarPassword(email: string): Observable<any> {
      // Apuntamos directamente a /api/recuperar-password
      return this.http.post(`${environment.apiUrl}/api/recuperar-password`, { email });
  }

  enviarEmail(data: any): Observable<any> {
    // Usamos environment.apiUrl directamente para apuntar a la nueva ruta
    return this.http.post<any>(`${environment.apiUrl}/api/enviar-correo`, data);
  }


  // =====================================
  //               USUARIOS
  // =====================================

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getUsuarioByClave(clave_usuario: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clave_usuario}`);
  }

  getUsuariosRenovacion(sede: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}`, { params: { sede } });
}

  registrarUsuario(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarUsuario(clave_usuario: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${clave_usuario}`, data);
  }

  //eliminarUsuario(clave_usuario: string): Observable<any> {
    //return this.http.delete<any>(`${this.apiUrl}/${clave_usuario}`);
  //}

  buscarUsuarios(texto: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/usuarios/buscar/general/${texto}`);
  }


  getUsuariosPorSede(sede: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/por-sede`, { params: { sede } });
  }

  obtenerClientesActivosSede(sede: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtener-clientes-activos-sede`, { params: { sede } });
  }

  eliminarUsuarioPermanente(clave_usuario: string): Observable<any> {
    // Asegúrate de que la URL coincida con tu ruta de Laravel
    return this.http.delete<any>(`${this.apiUrl}/${clave_usuario}/eliminar-permanente`);
  }
  // usuario.service.ts

  actualizarPerfil(clave: string, datos: any): Observable<any> {
    // CORRECTO: Agregamos /perfil para que coincida con Route::put('/usuarios/perfil/{clave}'...)
    return this.http.put(`${this.apiUrl}/perfil/${clave}`, datos);
  }


  buscarUsuariosDeSede(texto: string, sede: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/usuarios/buscar/sede`, {
      params: { texto, sede }
    });
  }


  eliminarUsuario(clave_usuario: string) {
    return this.http.put(`${this.apiUrl}/${clave_usuario}/eliminar`, {});
  }



// 1. Modifica el método getQrUrl (O cámbiale el nombre a resolverImagen)
getQrUrl(path: string): string {
  if (!path) return 'assets/no-image.png';

  // Si la ruta ya es una URL de Cloudinary (empieza con http)
  if (path.startsWith('http')) {
    return path;
  }

  // Fallback para registros antiguos que guardaban solo el nombre del archivo
  return `${environment.apiUrl}/${path}`;
}


getFotoPerfil(ruta: string | null): string | null {
  // Si la ruta es nula, indefinida, vacía o literalmente el texto "null"
  if (!ruta || ruta === 'null' || ruta.trim() === '') {
    return null; 
  }

  // Si ya es una URL de Cloudinary
  if (ruta.startsWith('http')) {
    return ruta;
  }

  // Si es una ruta local vieja
  return `${environment.apiUrl}/${ruta}`;
}



// En usuario.service.ts
getConteosBitacora(sede: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/conteos-bitacora?sede=${sede}`);
}

getCambiosHoy(sede: string, vistos: number = 0): Observable<any> {
  // Construimos los parámetros de la URL
  const params = new HttpParams()
    .set('sede', sede)
    .set('vistos', vistos.toString());

  return this.http.get(`${this.apiUrl}/cambios-hoy`, { params });
}

private notificaciónLimpiadaSource = new BehaviorSubject<boolean>(false);
notificaciónLimpiada$ = this.notificaciónLimpiadaSource.asObservable();

notificarLimpieza() {
  this.notificaciónLimpiadaSource.next(true);
}


subirImagenCloudinaryDirecto(file: File): Observable<any> {
  const url = `https://api.cloudinary.com/v1_1/dwvcefm84/image/upload`;
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Necesitas crear un "Unsigned Upload Preset" en Cloudinary
  formData.append('folder', 'usuarios/perfiles');

  return this.http.post(url, formData);
}

  // =====================================
  //               Pagos
  // =====================================


  registrarPago(data: any): Observable<any> {
    return this.http.post<any>(this.pagosUrl, data);
  }

  actualizarPago(clave: string, data: any) {
    return this.http.put<any>(`${this.pagosUrl}/${clave}`, data);
  }

  getPagos(tipo: string = 'todos', sede: string = '') {
    let params: any = {};
    if (tipo !== 'todos') params.tipo = tipo;
    if (sede) params.sede = sede;
    return this.http.get<any[]>(this.pagosUrl, { params });
  }

  getPagosByClave(clave_usuario: string) {
    return this.http.get(`${this.pagosUrl}/${clave_usuario}`);
  }

  subirFoto(clave: string, formData: FormData) {
    return this.http.post(`${this.apiUrl}/${clave}/subir-foto`, formData);
  }

getBitacoraIngresos(sede: string = '') {
  // Cambiamos this.apiUrl por this.pagosUrl
  // Esto hará la petición a: http://127.0.0.1:8000/api/pagos/bitacora
  return this.http.get<any>(`${this.pagosUrl}/bitacora`, {
    params: { sede: sede }
  });
}


getBitacoraRecuperacion(sede: string): Observable<any> {
  // Cambiamos this.apiUrl por this.pagosUrl para que apunte a /api/pagos/...
  return this.http.get(`${this.pagosUrl}/bitacora-recuperacion`, {
    params: { sede: sede }
  });
}
 
  // =====================================
  //               Asistencias
  // =====================================
 
  registrarAsistencia(data: any): Observable<any> {
    return this.http.post<any>(this.asistenciasUrl, data);
  }

  getAsistenciasMes(clave: string, year: number, month: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.asistenciasUrl}/mes/${clave}/${year}/${month}`);
  }
  
  getBitacoraAsistenciasMensual(sede: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.asistenciasUrl}/reporte-mensual`, { params: { sede } });
  }

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


  getPromociones(sede: string) {
    return this.http.get(`${this.promocionesUrl}?sede=${sede}`);
  }

  guardarPromocion(promo: any) {
    return this.http.post(`${this.promocionesUrl} `, promo);
  }

  eliminarPromocion(id: number) {
    return this.http.delete(`${this.promocionesUrl}/${id}`);
  }

}
