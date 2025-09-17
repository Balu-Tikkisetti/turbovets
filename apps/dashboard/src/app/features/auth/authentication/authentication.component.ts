import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-authentication',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './authentication.component.html'
  })
  export class AuthenticationComponent {}