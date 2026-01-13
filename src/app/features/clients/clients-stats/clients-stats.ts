import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';


// 1. Registramos los datos de español
registerLocaleData(localeEs);

@Component({
  selector: 'app-clients-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './clients-stats.html',
  styleUrls: ['./clients-stats.css'],
  
  providers: [
      // ... otros providers (router, etc)
      { provide: LOCALE_ID, useValue: 'es-ES' } // 2. Establecemos español por defecto
    ]
})

export class ClientsStats implements OnInit {
  user: any = null;
  pago: any = null;
  clave_usuario!: string;

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
    // Obtenemos la clave de la ruta
    this.clave_usuario = this.route.snapshot.parent?.paramMap.get('clave_usuario') ?? '';
    
    // Configuramos el nombre del mes en español
    this.nombreMes = this.hoy.toLocaleString('es-ES', { month: 'long' });

    if (!this.clave_usuario) {
      console.error("No se recibió clave_usuario en la ruta");
      return;
    }

    this.cargarDatos(this.clave_usuario);
  }

  cargarDatos(clave: string) {
    this.cargarUsuario(clave);
    this.cargarPagos(clave);
    this.generarCalendarioYEstadisticas(clave);
  }

cargarUsuario(clave_usuario: string) {
  this.usuarioService.getUsuarioByClave(clave_usuario).subscribe({
    next: (data) => {
      this.user = data;
      // Usamos el método del servicio para procesar la imagen (Local vs Cloudinary)
      if (this.user) {
        this.user.ruta_imagen_mostrar = this.usuarioService.getFotoPerfil(this.user.ruta_imagen);
      }
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



  // Ejemplo de carga doble
cargarAsistenciasCompletas(clave: string) {
  const mesActual = this.hoy.getMonth() + 1;
  const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
  const anioPasado = mesActual === 1 ? this.hoy.getFullYear() - 1 : this.hoy.getFullYear();

  // Combinar resultados de ambos meses en 'asistenciasDelMes'
  // Así la racha puede mirar hacia atrás y encontrar los días de diciembre
}

rachaActual: number = 0;

// Añade esta variable para el color
colorRacha: string = 'from-orange-600 to-yellow-400'; 


// ... dentro de la clase ClientsStats

generarCalendarioYEstadisticas(clave: string) {
  const anioActual = this.hoy.getFullYear();
  const mesActual = this.hoy.getMonth() + 1;

  // Calculamos el mes pasado
  const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
  const anioPasado = mesActual === 1 ? anioActual - 1 : anioActual;

  // 1. Cargamos mes pasado
  this.usuarioService.getAsistenciasMes(clave, anioPasado, mesPasado).subscribe({
    next: (dataPasada: any[]) => {
      // 2. Cargamos mes actual
      this.usuarioService.getAsistenciasMes(clave, anioActual, mesActual).subscribe({
        next: (dataActual: any[]) => {
          // Unimos ambos meses para que la racha pueda "mirar" hacia atrás
          this.asistenciasDelMes = [...dataActual, ...dataPasada];
          
          // El calendario y el % solo usan dataActual (el mes en curso)
          this.construirDiasCalendario(anioActual, mesActual, dataActual);
          this.construirGraficaRendimiento();
        },
        error: (err) => console.error('Error mes actual:', err)
      });
    },
    error: (err) => console.error('Error mes pasado:', err)
  });
}

private construirDiasCalendario(anio: number, mes: number, asistenciasMes: any[]) {
  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const temporalDias = [];
  const diaActualNum = this.hoy.getDate();
  let asistenciasContadas = 0;

  for (let i = 0; i < primerDiaSemana; i++) {
    temporalDias.push({ dia: null, estado: 'vacio' });
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaCotejar = `${anio}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const registro = asistenciasMes.find(a => a.fecha_diario.startsWith(fechaCotejar));
    
    let estado = 'pendiente'; 
    if (registro) {
      estado = 'asistio';
      asistenciasContadas++;
    } else if (d < diaActualNum) {
      estado = 'falto';
    } else if (d === diaActualNum) {
      estado = 'hoy';
    }
    temporalDias.push({ dia: d, estado });
  }

  this.diasCalendario = temporalDias;
  // El porcentaje sigue siendo solo del mes actual
  this.porcentajeAsistencia = diaActualNum > 0 ? Math.round((asistenciasContadas / diaActualNum) * 100) : 0;
}

private construirGraficaRendimiento() {
  const ultimos7 = [];
  let contadorRacha = 0;
  let rachaActiva = true;

  // --- 1. CÁLCULO DEL PORCENTAJE DEL MES ---
  const anioActual = this.hoy.getFullYear();
  const mesActualIndex = this.hoy.getMonth(); // 0-11
  const mesActualFormateado = (mesActualIndex + 1).toString().padStart(2, '0');
  const prefijoMesActual = `${anioActual}-${mesActualFormateado}`;

  // Días totales del mes (ej: 31 para enero)
  const diasTotalesMes = new Date(anioActual, mesActualIndex + 1, 0).getDate();

  // Contamos solo asistencias del mes en curso
  const asistenciasSoloEsteMes = this.asistenciasDelMes.filter(a => 
    a.fecha_diario.startsWith(prefijoMesActual)
  ).length;

  // Porcentaje real: (Asistencias / Días totales del mes)
  this.porcentajeAsistencia = Math.round((asistenciasSoloEsteMes / diasTotalesMes) * 100);

  // --- 2. LÓGICA DE RACHA (DÍAS SEGUIDOS) ---
  for (let i = 0; i < 60; i++) {
    const fechaAnalizar = new Date();
    fechaAnalizar.setDate(this.hoy.getDate() - i);
    const fechaIso = fechaAnalizar.toISOString().split('T')[0];
    
    const asistio = this.asistenciasDelMes.some(a => a.fecha_diario.startsWith(fechaIso));

    if (asistio && rachaActiva) {
      contadorRacha++;
    } else {
      // Si es hoy y no hay registro, la racha del pasado sigue viva
      if (i === 0 && !asistio) continue; 
      rachaActiva = false;
      if (i > 0) break; 
    }
  }

  this.rachaActual = contadorRacha;

  // Ajuste de colores
  if (this.rachaActual >= 21) {
    this.colorRacha = 'from-purple-600 to-pink-500';
  } else if (this.rachaActual >= 7) {
    this.colorRacha = 'from-yellow-600 to-yellow-200';
  } else {
    this.colorRacha = 'from-orange-600 to-yellow-400';
  }

  // Mini-gráfica 7 días
  for (let i = 0; i <= 6; i++) {
    const f = new Date();
    f.setDate(this.hoy.getDate() - i);
    const fIso = f.toISOString().split('T')[0];
    const asistio = this.asistenciasDelMes.some(a => a.fecha_diario.startsWith(fIso));
    
    ultimos7.unshift({
      asistio,
      diaNombre: f.toLocaleString('es-ES', { weekday: 'narrow' })
    });
  }
  this.ultimosSieteDias = ultimos7;
}


}