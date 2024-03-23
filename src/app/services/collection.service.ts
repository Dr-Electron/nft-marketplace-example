import { Injectable } from '@angular/core';
import { Collection, Dataset } from '@build-5/interfaces';
import { https } from '@build-5/sdk/https';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private client = https(environment.build5Env).project(environment.build5Token).dataset(Dataset.COLLECTION);
  getOne(id: string): Observable<Collection | undefined> {
    return from(this.client.id(id).get());
  }
}
