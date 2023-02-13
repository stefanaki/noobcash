import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import NodeService from 'src/app/services/node.service';
import { TransactionService } from 'src/app/services/transaction.service';
import ITransaction from 'src/app/shared/interfaces/transaction.interface';

@Component({
  selector: 'app-transactions-table',
  templateUrl: './transactions-table.component.html',
  styleUrls: ['./transactions-table.component.scss']
})
export class TransactionsTableComponent implements OnInit {

  displayedColumns = ['timestamp', 'index', 'url-port', 'transactionType', 'amount'];
  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private transactionService: TransactionService, public nodeService: NodeService) {

  }

  ngOnInit(): void {
    this.transactionService.fetchLatestTransactions().subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data.transactions.map(
          t => {
            let urlPort = '';
            let node = this.nodeService.ring.find(node => node.index === t.recipientId);

            urlPort = `${node?.url}:${node?.port}`

            return {
              ...t,
              urlPort
            }
          }
        ));

        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    )
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
