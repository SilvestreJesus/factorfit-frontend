import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Header } from '../../../../shared/components/header/header';
import { Footer } from '../../../../shared/components/footer/footer';
import { HeroSection } from '../hero-section/hero-section';
import { AboutUsSection } from '../about-us-section/about-us-section';
import { EventsSection } from '../events-sections/events-section';
import { InstalacionesSection } from '../instalaciones-section/instalaciones-section';
import { EntrenamientosSection } from '../entrenamientos-section/entrenamientos-section';
import { TrainersSection } from '../trainers-section/trainers-section';
import { PriceManagement } from '../price-management/price-management';
import { LocationSection } from '../location-section/location-section';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        Header,
        Footer,
        HeroSection,
        AboutUsSection,
        EventsSection,
        InstalacionesSection,
        EntrenamientosSection,
        TrainersSection,
        LocationSection
    ],
    templateUrl: './landing-page.html',
    styleUrls: ['./landing-page.css']
})
export class LandingPage implements OnInit {
    trainersData: any[] = [];
    plansData: any[] = [];


    ngOnInit() {
    }
}