import { Routes } from '@angular/router';
import { AsistenciaScannerComponent } from './features/landing/asistencia-scanner/asistencia-scanner.component';

export const routes: Routes = [
    { path: 'asistencia-scanner', component: AsistenciaScannerComponent },

    {
        path: 'login',
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    },
    {
        path: 'home',
        loadChildren: () => import('./features/landing/landing.module').then(m => m.LandingModule)
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
    },    
    {
        path: 'superadmin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
    },
    {
        path: 'cliente',
        loadChildren: () => import('./features/clients/clients.module').then(m => m.ClientsModule)
    },

    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    },
    {
        path: '',
        redirectTo: 'home', // La página por defecto será la página de inicio
        pathMatch: 'full'
    },
    {
        path: '**', // Cualquier otra ruta te redirige a la página de inicio
        redirectTo: 'home'
    }
];