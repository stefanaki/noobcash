import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import { CreateTransactionComponent } from './components/create-transaction/create-transaction.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'noobcash-app';

  constructor(public router: Router, public dialog: MatDialog) {}

  onCreateClick() {
    this.dialog.open(CreateTransactionComponent, {
    });
  }
}
