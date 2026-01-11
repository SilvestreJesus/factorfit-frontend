import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientsRoutingModule } from './clients-routing.module';
import { ClientDefaultLayout } from './client-default-layout/client-default-layout';
import { ClientHomeLayout } from './client-home-layout/client-home-layout';
import { ClientsProfile } from './clients-profile/clients-profile';
import { HomeClients } from './home_clients/home_clients';
import { ClientsStats } from './clients-stats/clients-stats';
@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        ClientsRoutingModule ,
        ClientDefaultLayout,
        ClientHomeLayout,
        HomeClients,
        ClientsProfile,
        ClientsStats
    ]
})
export class ClientsModule { }