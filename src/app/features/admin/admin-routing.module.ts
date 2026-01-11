import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayout } from './components/admin-layout/admin-layout';
import { ClientRegistration } from './components/client-registration/client-registration';
import { UserManagement } from './components/user-management/user-management';
import { UserDetail } from './components/user-detail/user-detail';
import { UserStats } from './components/user-stats/user-stats';
import { UserPay } from './components/user-pay/user-pay';
import { Events } from './components/events/events';
import { Instalaciones } from './components/instalaciones/instalaciones';
import { Entrenamientos } from './components/entrenamientos/entrenamientos';
import { TrainerManagement } from './components/trainer-management/trainer-management';
import { PriceManagement } from './components/price-management/price-management';
import { Registro } from './components/registro/registro';
import { UserPayDetail } from './components/user-pay-detail/user-pay-detail';
import { Logbook } from './components/logbook/logbook';

const routes: Routes = [
    {
        path: '',
        component: AdminLayout,
        children: [
            { path: 'registro', component: ClientRegistration },
            { path: 'usuarios', component: UserManagement },
            { path: 'usuarios/:clave_usuario/editar', component: UserDetail },
            { path: 'usuarios/:clave_usuario/estadisticas', component: UserStats },
            { path: 'pago', component: UserPay },
            {path:  'pago/:clave_usuario/detallepago', component: UserPayDetail },
            {
                path: 'registros', 
                component: Registro, 
                children: [
                    { path: '', redirectTo: 'eventos', pathMatch: 'full' }, 
                    { path: 'eventos', component: Events },
                    { path: 'instalaciones', component: Instalaciones },
                    { path: 'entrenamientos', component: Entrenamientos },
                    { path: 'personal', component: TrainerManagement }
                ]
            },
            { path: 'personal/nuevo', component: TrainerManagement  },
            { path: 'personal/:clave_personal/editar', component: TrainerManagement  },
            { path: 'precios', component: PriceManagement },
            { path: 'bitacora', component: Logbook },
            {
                path: '', // La ruta por defecto (que es /admin) redirige a /admin/registro
                redirectTo: 'registro',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }