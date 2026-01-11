import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientHomeLayout } from './client-home-layout/client-home-layout';
import { ClientDefaultLayout } from './client-default-layout/client-default-layout';

import { ClientsProfile } from './clients-profile/clients-profile';
import { ClientsStats } from './clients-stats/clients-stats';
import { HomeClients } from './home_clients/home_clients';

const routes: Routes = [

    {
        path: ':clave_usuario',
        children: [
            
            {
                path: 'home',
                component: ClientHomeLayout,
                children: [
                    { path: '', component: HomeClients }
                ]
            },

            {
                path: '',
                component: ClientDefaultLayout,
                children: [
                    { path: 'perfil', component: ClientsProfile },
                    { path: 'estadisticas', component: ClientsStats },

                    { path: '', redirectTo: 'perfil', pathMatch: 'full' }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClientsRoutingModule {}