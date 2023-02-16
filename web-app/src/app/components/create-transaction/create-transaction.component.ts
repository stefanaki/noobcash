import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import NodeService from 'src/app/services/node.service';
import INode from 'src/app/shared/interfaces/node.interface';

@Component({
  selector: 'app-create-transaction',
  templateUrl: './create-transaction.component.html',
  styleUrls: ['./create-transaction.component.scss'],
})
export class CreateTransactionComponent implements OnInit {
  ring: INode[] = [];
  createTransactionForm!: FormGroup;

  constructor(
    public nodeService: NodeService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTransactionComponent>
  ) {}

  ngOnInit(): void {
    this.ring = this.nodeService.ring.filter(
      (node) => node.publicKey !== this.nodeService.self.publicKey
    );

    this.createTransactionForm = this.formBuilder.group({
      recipient: ['', Validators.required],
      amount: ['', Validators.required],
    });
  }

  get recipientControl() {
    return this.createTransactionForm.controls.recipient;
  }

  get amountControl() {
    return this.createTransactionForm.controls.amount;
  }

  onSubmit() {
    let self = this.nodeService.self;

    this.http
      .post<{ message: string }>(`${self.url}:${self.port}/transaction`, {
        recipientId: Number(this.recipientControl.value),
        amount: Number(this.amountControl.value),
      })
      .subscribe(
        (data) => {
          this.snackBar.open(
            `Transaction created and is in pending state`,
            'OK',
            {
              duration: 3000,
            }
          );

          this.dialogRef.close();
        },
        (err) => {
          this.snackBar.open(`Error submitting transaction`, 'OK', {
            duration: 3000,
          });
        }
      );
  }
}
