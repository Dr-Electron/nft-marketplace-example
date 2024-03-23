import { Injectable } from '@angular/core';
import { Dataset, Nft, NftAvailable, NftPurchaseTangleRequest, Transaction } from '@build-5/interfaces';
import { SoonaverseOtrAddress, otr } from '@build-5/sdk';
import { https } from '@build-5/sdk/https';
import { OtrRequest } from '@build-5/sdk/otr/datasets/common';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NftService {
  private client = https(environment.build5Env).project(environment.build5Token).dataset(Dataset.NFT);
  private otrClient = otr(SoonaverseOtrAddress.TEST).dataset(Dataset.NFT);
  constructor() {}

  getByCollection(col: string): Observable<Nft[] | undefined> {
    return from(this.client.getByField('collection', col));
  }

  getByCollectionAvailableForSaleLive(col: string): Observable<Nft[] | undefined> {
    return from(this.client.getByFieldLive(['collection', 'available'], [col, NftAvailable.SALE]));
  }

  getByCollectionAvailableForAuctionLive(col: string): Observable<Nft[] | undefined> {
    return from(this.client.getByFieldLive(['collection', 'available'], [col, NftAvailable.AUCTION]));
  }

  getNfts(id: string): Promise<Nft[]> {
    return this.client.getManyById([id]);
  }

  purchase(id: string, price: number): OtrRequest<NftPurchaseTangleRequest> {
    return this.otrClient.purchase({
      collection: environment.collection,
      nft: id
    }, price);
  }
}
