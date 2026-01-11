import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, registerLocaleData as regLocale } from '@angular/common';
import { FormsModule } from '@angular/forms';
import localeEs from '@angular/common/locales/es';

// Componentes hijos
import { IncomeComponent } from './logbook-income/logbook-income.component';
import { DebtorsComponent } from './logbook-debtors/logbook-debtors.component';
import { AttendanceComponent } from './logbook-attendance/logbook-attendance.component';
import { RecoveryComponent } from './logbook-recovery/logbook-recovery.component';

// Librerías de Excel
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; 
import { UsuarioService } from '../../../../core/services/usuario.service';
import { firstValueFrom } from 'rxjs';

regLocale(localeEs);

@Component({
  selector: 'app-logbook',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IncomeComponent, 
    DebtorsComponent, 
    AttendanceComponent, 
    RecoveryComponent
  ],
  templateUrl: './logbook.html',
  styleUrl: './logbook.css',
})
export class Logbook implements OnInit {
  private usuarioService = inject(UsuarioService);
  
  // --- Signals de Control ---
  sede = localStorage.getItem('sede') ?? '';
  busqueda = signal('');
  currentSubView = signal('ganancias');
  fechaHoraActual = signal(new Date());

  toast = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({
    visible: false, mensaje: '', tipo: 'success'
  });

  ngOnInit() {
    setInterval(() => this.fechaHoraActual.set(new Date()), 1000);
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