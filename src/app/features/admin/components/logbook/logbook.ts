import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule, registerLocaleData as regLocale } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

// Componentes hijos e imports de librerías (mantener igual...)
import { IncomeComponent } from './logbook-income/logbook-income.component';
import { DebtorsComponent } from './logbook-debtors/logbook-debtors.component';
import { AttendanceComponent } from './logbook-attendance/logbook-attendance.component';
import { RecoveryComponent } from './logbook-recovery/logbook-recovery.component';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; 
import { UsuarioService } from '../../../../core/services/usuario.service';
import { firstValueFrom } from 'rxjs';

regLocale(localeEs);

@Component({
  selector: 'app-logbook',
  standalone: true,
 imports: [CommonModule, FormsModule, IncomeComponent, DebtorsComponent, AttendanceComponent, RecoveryComponent],
  templateUrl: './logbook.html',
  styleUrl: './logbook.css',
})
export class Logbook implements OnInit {
  private usuarioService = inject(UsuarioService);
  conteos = signal({ pagos: 0, asistencias: 0, renovacion: 0 });
  vistos = signal({
    pagos: Number(localStorage.getItem('visto_pagos') ?? 0),
    asistencias: Number(localStorage.getItem('visto_asistencias') ?? 0),
    renovacion: Number(localStorage.getItem('visto_renovacion') ?? 0)
  });
  // --- Signals de Control ---
  sede = localStorage.getItem('sede') ?? '';
  busqueda = signal('');
  currentSubView = signal('ganancias');
  fechaHoraActual = signal(new Date());

  toast = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({
    visible: false, mensaje: '', tipo: 'success'
  });



  constructor() {
    // Escuchar cambios de pestaña de forma reactiva
    effect(() => {
      this.marcarComoVisto(this.currentSubView());
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.cargarConteos();
    setInterval(() => this.fechaHoraActual.set(new Date()), 1000);
  }

async descargarBaseDeDatos() {
  this.showToastMessage('Generando respaldo de seguridad...', 'success');
  
  try {
    const blob = await firstValueFrom(this.usuarioService.descargarBackupSQL());
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `BACKUP_SISTEMA_${this.sede.toUpperCase()}_${fecha}.sql`;
    
    saveAs(blob, nombreArchivo);
    this.showToastMessage('Base de datos descargada con éxito');
  } catch (error: any) {
    // Si el error es un Blob (porque el backend devolvió JSON pero Angular esperaba un archivo)
    if (error.error instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        const errorString = reader.result as string;
        const errorParsed = JSON.parse(errorString);
        console.error('Error detallado del servidor:', errorParsed);
        this.showToastMessage('Error: ' + (errorParsed.detalle?.[0] || 'Fallo en servidor'), 'error');
      };
      reader.readAsText(error.error);
    } else {
      console.error('Error al descargar DB:', error);
      this.showToastMessage('Error al generar el respaldo', 'error');
    }
  }
}

  // 2. Mapeo correcto de la respuesta del Backend
cargarConteos() {
    this.usuarioService.getConteosBitacora(this.sede).subscribe({
      next: (res) => {
        // CORRECCIÓN: Usamos los nombres que definimos arriba en el Signal
        this.conteos.set({
          pagos: res.pagos || 0,
          asistencias: res.asistencias || 0,
          renovacion: res.renovacion || 0
        });
      },
      error: (err) => console.error('Error cargando conteos', err)
    });
  }

  // 3. Método unificado para cambiar de vista (usado en el HTML)
  seleccionarVista(vista: string) {
    this.currentSubView.set(vista);
  }

marcarComoVisto(view: string) {
  const keyMap: { [key: string]: string } = {
    'ganancias': 'pagos',
    'asistencia': 'asistencias',
    'renovacion': 'renovacion'
  };

  const key = keyMap[view];
  if (!key) return;

  const totalActual = (this.conteos() as any)[key] || 0;
  
  localStorage.setItem(`visto_${key}`, totalActual.toString());
  this.vistos.update(v => ({ ...v, [key]: totalActual }));

  // AVISAMOS AL HEADER QUE CAMBIARON LOS VISTOS
  this.usuarioService.notificarLimpieza(); 
}

  // 5. Helper único para el HTML (Usa este en los *ngIf)
  getContador(view: string): number {
    const total = (this.conteos() as any)[view] || 0;
    const visto = (this.vistos() as any)[view] || 0;
    
    const resultado = total - visto;
    return resultado > 0 ? resultado : 0;
  }

  getBadge(view: string): number {
  const keyMap: { [key: string]: string } = {
    'ganancias': 'pagos',
    'asistencia': 'asistencias',
    'renovacion': 'renovacion'
  };

  const key = keyMap[view];
  const total = (this.conteos() as any)[key] || 0;
  const visto = (this.vistos() as any)[key] || 0;
  
  const diferencia = total - visto;
  return diferencia > 0 ? diferencia : 0;
}

  // --- MÉTODO PRINCIPAL DE DESCARGA ---
  async descargarReportes() {
    this.showToastMessage('Preparando archivos Excel...', 'success');
    const workbook = new ExcelJS.Workbook();
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());

    try {
      // 1. Obtención de datos mediante promesas
      const [resIngresos, resAsistencias, resUsuarios] = await Promise.all([
        firstValueFrom(this.usuarioService.getBitacoraIngresos(this.sede)),
        firstValueFrom(this.usuarioService.getBitacoraAsistenciasMensual(this.sede)),
        firstValueFrom(this.usuarioService.getUsuariosPorSede(this.sede))
      ]);

      const extraerArray = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        return res.data && Array.isArray(res.data) ? res.data : [];
      };

      const ingresosRaw = extraerArray(resIngresos);
      const asistencias = extraerArray(resAsistencias);
      const usuarios = extraerArray(resUsuarios);

      // 2. Mapa de correos para evitar el "N/A"
      const mapaCorreos = new Map();
      usuarios.forEach(u => mapaCorreos.set(u.clave_usuario, u.email));

      // 3. Procesar deudores cruzando con el mapa de correos
      const deudores = ingresosRaw
        .filter((log: any) => (Number(log.monto_pendiente ?? 0) + Number(log.monto_recargo ?? 0)) > 0)
        .map((log: any) => ({
          ...log,
          email: mapaCorreos.get(log.clave_usuario) || mapaCorreos.get(log.clave) || 'Sin Correo'
        }));

      // 4. Creación de hojas
      this.crearHojaExcel(workbook, 'Ingresos', ['Clave', 'Nombre Completo', 'Monto', 'Tipo/Meses', 'Fecha Corte'], ingresosRaw);
      this.crearHojaExcel(workbook, 'Deudores', ['Clave', 'Nombre', 'Deuda Pendiente', 'Teléfono', 'Fecha Corte', 'Correo'], deudores);
      this.crearHojaExcel(workbook, 'Asistencias', ['Clave','Nombre Usuario', 'Tipo/Meses', 'Teléfono', 'Status', 'Fecha Asistencia'], asistencias);

      // 5. Generación del archivo
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Reporte_${this.sede.toUpperCase()}_${monthName.toUpperCase()}.xlsx`);
      this.showToastMessage('Reporte generado correctamente');

    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.showToastMessage('Error al procesar los datos', 'error');
    }
  }

  private crearHojaExcel(workbook: ExcelJS.Workbook, nombreHoja: string, headers: string[], data: any[]) {
    const sheet = workbook.addWorksheet(nombreHoja);

    // --- ESTILOS ---
    sheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = `REPORTE: ${nombreHoja.toUpperCase()} - ${this.sede.toUpperCase()}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }; 

    const headerRow = sheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; 
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    // --- LÓGICA DE FORMATO ---
    const formatearSoloFecha = (fechaStr: any) => {
      if (!fechaStr) return 'N/A';
      return String(fechaStr).split(' ')[0].split('T')[0]; 
    };

    const calcularMesesIngresos = (fecha: string): string => {
      if (!fecha) return '1 Mes';
      const hoy = new Date();
      const corte = new Date(fecha);
      const meses = (corte.getFullYear() - hoy.getFullYear()) * 12 + (corte.getMonth() - hoy.getMonth());
      const res = meses > 0 ? meses : 1;
      return res === 1 ? '1 Mes' : `${res} Meses`;
    };

    const calcularMesesAsistencias = (fecha: string): string => {
      if (!fecha) return '1 Mes'; // Valor por defecto igual que ingresos
      const hoy = new Date();
      const corte = new Date(fecha);
      const meses = (corte.getFullYear() - hoy.getFullYear()) * 12 + (corte.getMonth() - hoy.getMonth());
      
      // Si quieres que el mínimo sea 1 igual que en Ingresos:
      const res = meses > 0 ? meses : 1; 
      return res === 1 ? '1 Mes' : `${res} Meses`;
    };

    // --- LLENADO DE FILAS ---
    data.forEach(item => {
      let rowValues: any[] = [];

      if (nombreHoja === 'Ingresos') {
        rowValues = [
          item.clave || item.clave_usuario || 'N/A', 
          item.nombre || `${item.nombres} ${item.apellidos}` || 'N/A', 
          Number(item.monto) || Number(item.monto_pagado) || 0, 
          calcularMesesIngresos(item.fecha_corte), 
          formatearSoloFecha(item.fecha_corte)
        ];
      } else if (nombreHoja === 'Deudores') {
        rowValues = [
          item.clave || item.clave_usuario || 'N/A', 
          item.nombre || `${item.nombres} ${item.apellidos}` || 'N/A', 
          (Number(item.monto_pendiente) || 0) + (Number(item.monto_recargo) || 0), 
          item.telefono || 'N/A',
          formatearSoloFecha(item.fecha_corte),
          item.email || 'N/A'
        ];
      } else if (nombreHoja === 'Asistencias') {
        const fechaReferencia = item.fecha_corte || item.vigencia || null;
        rowValues = [
          item.clave || item.clave_usuario || 'N/A', 
          item.nombre_usuario || item.nombre || 'N/A', 
         calcularMesesAsistencias(fechaReferencia),
          item.telefono || 'N/A',
          item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Activo',
          formatearSoloFecha(item.fecha_diario)
        ];
      }
      
      const row = sheet.addRow(rowValues);
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center' };
      });
    });

    sheet.columns.forEach((column, index) => {
      column.width = 25; 
      if (index === 2 && (nombreHoja === 'Ingresos' || nombreHoja === 'Deudores')) {
        column.numFmt = '"$"#,##0.00';
      }
    });
  }

  showToastMessage(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.toast.set({ visible: true, mensaje, tipo });
    setTimeout(() => {
      this.toast.update(prev => ({ ...prev, visible: false }));
    }, 3000);
  }
}