import { Component, Input, signal, computed, inject, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../../../core/services/usuario.service';

@Component({
  selector: 'app-logbook-income',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logbook-income.component.html'
})
export class IncomeComponent implements OnChanges {
private usuarioService = inject(UsuarioService);
  
  @Input() busqueda = ''; 
  @Input() sede = ''; // Recibimos la sede
  
  financialLogData = signal<any[]>([]);
  filtroTipoPago = signal('Mensual');

  // Quitamos cargarDatos del constructor
  constructor() {}

  // Este método se dispara en cuanto la sede llega del padre
  ngOnChanges(changes: SimpleChanges) {
    if (changes['sede'] && this.sede) {
      this.cargarDatos();
    }
  }

cargarDatos() {
  // Si la sede es inválida, no disparamos la petición
  if (!this.sede || this.sede === 'null' || this.sede === 'undefined') {
    console.warn("Sede no definida aún");
    return;
  }

  this.usuarioService.getBitacoraIngresos(this.sede).subscribe({
    next: (resp) => {
      if (resp.status && resp.data) {
        // LOG DE DEPURACIÓN: Abre la consola del navegador para ver qué llega
        console.log("Datos recibidos de la sede:", this.sede, resp.data);

        // OPCIÓN RECOMENDADA: Si el backend ya filtró por sede, 
        // solo asigna los datos directamente para evitar errores de comparación de strings
        this.financialLogData.set(resp.data);
      } else {
        this.financialLogData.set([]);
      }
    },
    error: (err) => {
      console.error("Error en bitácora:", err);
      this.financialLogData.set([]);
    }
  });
}
  
ingresosFiltrados = computed(() => {
  const texto = this.busqueda.toLowerCase().trim();
  
  const filtrados = this.financialLogData().filter(log => {
    const coincideTipo = log.tipo_pago === this.filtroTipoPago() && log.status === 'activo';
    if (!coincideTipo) return false;
    return !texto || log.nombre?.toLowerCase().includes(texto) || log.clave?.includes(texto);
  });

  // Ordenamos por la fecha de actualización más reciente
  return filtrados.sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
});

  totalIngresos = computed(() => {
    return this.ingresosFiltrados().reduce((acc, log) => acc + (Number(log.monto) || 0), 0);
  });


  calcularMeses(fecha: string): number {
    if (!fecha) return 0;
    const hoy = new Date();
    const corte = new Date(fecha);
    const meses = (corte.getFullYear() - hoy.getFullYear()) * 12 + (corte.getMonth() - hoy.getMonth());
    return meses > 0 ? meses : 0;
  }
}