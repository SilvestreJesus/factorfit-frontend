import { Component, Input, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../../../../core/services/asistencia.service';

@Component({
  selector: 'app-logbook-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logbook-attendance.component.html'
})
export class AttendanceComponent implements OnInit {

private asistenciaService = inject(AsistenciaService);

  @Input() busqueda = '';
  @Input() sede = '';
  
  asistenciasGlobales = signal<any[]>([]);
  statsGrafica = signal<any[]>([]); // Se llena con datos del servidor
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  diaSeleccionado = signal('');

  ngOnInit() {
    this.setDiaHoy();
    this.cargarDatos();
  }

  setDiaHoy() {
    const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const hoyIdx = new Date().getDay();
    const hoyNombre = nombresDias[hoyIdx];
    
    if (hoyIdx === 0 || hoyIdx === 6) {
      this.diaSeleccionado.set('Lunes');
    } else {
      this.diaSeleccionado.set(hoyNombre.charAt(0).toUpperCase() + hoyNombre.slice(1));
    }
  }


cargarDatos() {
  // Pasamos la sede actual al servicio
  this.asistenciaService.getAsistencias(this.sede).subscribe({
    next: (resp: any) => {
      if (resp.status) {
        this.asistenciasGlobales.set(resp.data);
        this.statsGrafica.set(resp.stats);
      }
    },
    error: (err) => {
      console.error("Error del servidor:", err.error?.error || "Error Desconocido");
    }
  });
}

asistenciaFiltrados = computed(() => {
  const texto = this.busqueda.toLowerCase().trim();
  const seleccion = this.diaSeleccionado().toLowerCase();

  return this.asistenciasGlobales()
    .filter(a => {
      // 1. Filtro estricto por nombre del día (Lunes, Martes, etc.)
      const mismoDia = a.dia_nombre?.toLowerCase() === seleccion;
      
      // 2. Filtro de semana actual: Evita mostrar registros de semanas pasadas
      const fechaAsistencia = new Date(a.fecha_diario);
      const hoy = new Date();
      // Calculamos la diferencia en días
      const diffTime = Math.abs(hoy.getTime() - fechaAsistencia.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const esEstaSemana = diffDays <= 7;

      // 3. Filtro por buscador
      const cumpleBusqueda = !texto || 
                             a.nombres?.toLowerCase().includes(texto) || 
                             a.clave_usuario?.toLowerCase().includes(texto);
                             
      return mismoDia && esEstaSemana && cumpleBusqueda;
    })
    // 4. Ordenar: El más reciente (fecha/hora mayor) arriba
    .sort((a, b) => new Date(b.fecha_diario).getTime() - new Date(a.fecha_diario).getTime());
});

  // Corregido: Muestra "X Meses" basado en la fecha de corte del usuario
  calcularMeses(fechaCorte: string): string {
    if (!fechaCorte) return '0 Meses';
    const hoy = new Date();
    const corte = new Date(fechaCorte);
    let meses = (corte.getFullYear() - hoy.getFullYear()) * 12 + (corte.getMonth() - hoy.getMonth());
    return meses > 0 ? `${meses} Meses` : '0 Meses';
  }

  // Agrega esta función dentro de tu clase AttendanceComponent
obtenerMaximo(stats: any[]): number {
  if (!stats || stats.length === 0) return 10;
  
  // Convertimos a número explícitamente para evitar errores de comparación
  const valores = stats.map(s => Number(s.valor) || 0);
  const max = Math.max(...valores);
  
  // Si el máximo es 3, devolverá 3. Usamos un mínimo de 1 para evitar división por cero.
  return max > 0 ? max : 10;
}

  esDiaFuturo(dia: string): boolean {
    const ordenDias: { [key: string]: number } = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5 };
    const hoyIdx = new Date().getDay();
    return ordenDias[dia] > hoyIdx;
  }

  obtenerStatusLabel(u: any): string {
    return u.status.charAt(0).toUpperCase() + u.status.slice(1);
  }

  
}