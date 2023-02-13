import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import NodeService from '../services/node.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private nodeService: NodeService, private router: Router) {}

  canActivate() {
    if (this.nodeService.self && this.nodeService.ring.length > 0) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
