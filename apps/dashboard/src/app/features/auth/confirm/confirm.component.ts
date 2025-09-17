import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-confirm',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './confirm.component.html'
  })
  export class ConfirmComponent {
    onSubmit() {
      console.log('Confirm form submitted');
    }
  }
