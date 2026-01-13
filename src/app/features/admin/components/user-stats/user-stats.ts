import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-stats.html',
  styleUrls: ['./user-stats.css']
})
export class UserStats implements OnInit {
  // Datos de Usuario y Pagos
  user: any = null;
  pago: any = null;
  clave_usuario!: string;

  // Variables de Búsqueda
  busqueda: string = '';
  resultadosBusqueda: any[] = [];

  // Variables de Asistencia y Calendario
  asistenciasDelMes: any[] = [];
  
  diasCalendario: any[] = [];
  ultimosSieteDias: any[] = [];
  porcentajeAsistencia: number = 0;
  hoy: Date = new Date();
nombreMes: string = '';
  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.clave_usuario = this.route.snapshot.paramMap.get('clave_usuario') ?? '';
    this.nombreMes = this.hoy.toLocaleString('es-ES', { month: 'long' });

    if (this.clave_usuario) {
      this.cargarDatosIniciales(this.clave_usuario);
    }
  }

  /**
   * Carga toda la información necesaria del usuario
   */
  cargarDatosIniciales(clave: string) {
    this.cargarUsuario(clave);
    this.cargarPagos(clave);
    this.generarCalendarioYEstadisticas(clave);
  }

  // ================================
  //       CARGA DE SERVICIOS
  // ================================
/* --- CARGAR USUARIO --- */

cargarUsuario(clave_usuario: string) {
  this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
    next: (data) => {
      this.user = data;
      // Usamos el servicio directamente. 
      // Si data.ruta_imagen es null, el servicio devolverá null o una ruta vacía.
      this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
    },
    error: (err) => console.error('Error al cargar usuario:', err)
  });
}

  cargarPagos(clave_usuario: string) {
    this.usuarioService.getPagosByClave(clave_usuario).subscribe({
      next: (data: any) => this.pago = data,
      error: (err) => console.error('Error al cargar pago:', err)
    });
  }

 
  


  private construirGraficaRendimiento() {
  const ultimos7 = [];
  // Escalas de altura base para que se vea de pequeña a grande (7 días)
  const escalasBase = [30, 40, 50, 60, 70, 80, 95]; 

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(this.hoy.getDate() - i);
    const fechaIso = fecha.toISOString().split('T')[0];
    
    const asistio = this.asistenciasDelMes.some(a => a.fecha_diario.startsWith(fechaIso));
    
    // El índice de la escala es (6 - i) para que vaya de 0 a 6
    const indiceEscala = 6 - i;
    
    ultimos7.push({ 
      asistio: asistio,
      // Si asistió, usa la altura de la escala, si no, se queda en un 20% (pequeñito)
      altura: asistio ? `${escalasBase[indiceEscala]}%` : '20%'
    });
  }
  this.ultimosSieteDias = ultimos7;
}

  // ================================
  //       BÚSQUEDA DE USUARIOS
  // ================================

  buscar() {
    if (this.busqueda.trim().length < 2) {
      this.resultadosBusqueda = [];
      return;
    }

    this.usuarioService.buscarUsuariosDeSede(this.busqueda, this.user?.sede).subscribe({
      next: (data: any[]) => this.resultadosBusqueda = data,
      error: (err: any) => console.error('Error en búsqueda:', err)
    });
  }

  seleccionarUsuario(usuario: any) {
    this.resultadosBusqueda = [];
    this.busqueda = '';   
    this.clave_usuario = usuario.clave_usuario;

    // Recargar todo para el nuevo usuario seleccionado
    this.cargarDatosIniciales(this.clave_usuario);
  }


generarCalendarioYEstadisticas(clave: string) {
    const anioActual = this.hoy.getFullYear();
    const mesActual = this.hoy.getMonth() + 1;

    // Calculamos el mes pasado para la racha
    const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
    const anioPasado = mesActual === 1 ? anioActual - 1 : anioActual;

    // 1. Cargamos mes pasado
    this.usuarioService.getAsistenciasMes(clave, anioPasado, mesPasado).subscribe({
      next: (dataPasada: any[]) => {
        // 2. Cargamos mes actual
        this.usuarioService.getAsistenciasMes(clave, anioActual, mesActual).subscribe({
          next: (dataActual: any[]) => {
            // Unimos ambos meses para la racha de 60 días
            this.asistenciasDelMes = [...dataActual, ...dataPasada];
            
            // Construir visuales
            this.construirDiasCalendario(anioActual, mesActual, dataActual);
            this.construirGraficaYEstadisticas();
          }
        });
      }
    });
  }


  rachaActual: number = 0;
  colorRacha: string = 'from-orange-600 to-yellow-400';
  

  private construirDiasCalendario(anio: number, mes: number, asistenciasSoloMesActual: any[]) {
    const primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const temporalDias = [];
    const diaActualNum = this.hoy.getDate();

    for (let i = 0; i < primerDiaSemana; i++) {
      temporalDias.push({ dia: null, estado: 'vacio' });
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaCotejar = `${anio}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const registro = asistenciasSoloMesActual.find(a => a.fecha_diario.startsWith(fechaCotejar));
      
      let estado = 'pendiente'; 
      if (registro) {
        estado = 'asistio';
      } else if (d < diaActualNum) {
        estado = 'falto';
      } else if (d === diaActualNum) {
        estado = 'hoy';
      }
      temporalDias.push({ dia: d, estado });
    }
    this.diasCalendario = temporalDias;
  }

  private construirGraficaYEstadisticas() {
    const anioActual = this.hoy.getFullYear();
    const mesActualIdx = this.hoy.getMonth();
    const mesActualStr = (mesActualIdx + 1).toString().padStart(2, '0');
    const prefijoMes = `${anioActual}-${mesActualStr}`;

    // --- 1. PORCENTAJE (Asistencias de este mes / Días totales del mes) ---
    const diasTotalesMes = new Date(anioActual, mesActualIdx + 1, 0).getDate();
    const asistenciasEsteMes = this.asistenciasDelMes.filter(a => a.fecha_diario.startsWith(prefijoMes)).length;
    this.porcentajeAsistencia = Math.round((asistenciasEsteMes / diasTotalesMes) * 100);

    // --- 2. RACHA (Días seguidos cruzando meses) ---
    let contadorRacha = 0;
    let rachaActiva = true;

    for (let i = 0; i < 60; i++) {
      const fechaAnalizar = new Date();
      fechaAnalizar.setDate(this.hoy.getDate() - i);
      const fechaIso = fechaAnalizar.toISOString().split('T')[0];
      
      const asistio = this.asistenciasDelMes.some(a => a.fecha_diario.startsWith(fechaIso));

      if (asistio && rachaActiva) {
        contadorRacha++;
      } else {
        if (i === 0 && !asistio) continue; // Si hoy no ha ido, no romper racha aún
        rachaActiva = false;
        if (i > 0) break; 
      }
    }
    this.rachaActual = contadorRacha;

    // Color según racha
    if (this.rachaActual >= 21) this.colorRacha = 'from-purple-600 to-pink-500';
    else if (this.rachaActual >= 7) this.colorRacha = 'from-yellow-600 to-yellow-200';
    else this.colorRacha = 'from-orange-600 to-yellow-400';

    // --- 3. ÚLTIMOS 7 DÍAS (Gráfica de barras) ---
    const ultimos7 = [];
    const escalasBase = [30, 40, 50, 60, 70, 80, 95]; 

    for (let i = 0; i <= 6; i++) {
      const f = new Date();
      f.setDate(this.hoy.getDate() - (6 - i)); // De hace 6 días a hoy
      const fIso = f.toISOString().split('T')[0];
      const asistio = this.asistenciasDelMes.some(a => a.fecha_diario.startsWith(fIso));
      
      ultimos7.push({ 
        asistio,
        altura: asistio ? `${escalasBase[i]}%` : '20%',
        diaNombre: f.toLocaleString('es-ES', { weekday: 'narrow' })
      });
    }
    this.ultimosSieteDias = ultimos7;
  }  
}