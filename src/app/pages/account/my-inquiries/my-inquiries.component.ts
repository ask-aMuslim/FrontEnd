import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-my-inquiries',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './my-inquiries.component.html',
    styleUrls: ['./my-inquiries.component.scss']
})
export class MyInquiriesComponent {
    // Skeleton component for inquiries
    inquiries: any[] = [];
}
