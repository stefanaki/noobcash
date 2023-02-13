import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import NodeService from '../../services/node.service';

@Component({
  selector: 'login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit, OnDestroy {
  loginForm;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    public nodeService: NodeService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      url: ['', Validators.required],
      port: ['', Validators.maxLength(5)],
    });
  }
  ngOnDestroy(): void {}

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.snackBar.open('All the fields are required', 'OK', {
        duration: 3000,
      });
      return;
    }

    this.nodeService
      .fetchRing(
        this.loginForm.controls.url.value,
        this.loginForm.controls.port.value
      ).subscribe(
        () => this.router.navigate(['/']),
        (_ => this.snackBar.open('Could not connect to the backend service', 'OK', {
          duration: 3000,
        }))
      );
  }
}
