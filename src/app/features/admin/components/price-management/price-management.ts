import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-price-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './price-management.html',
})
export class PriceManagement implements OnInit {
    plansData: any[] = [];

    ngOnInit() {
    }
}