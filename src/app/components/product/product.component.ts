import { Component, Input } from '@angular/core';
import { Dataset, FILE_SIZES, Nft, Transaction, TransactionType } from '@build-5/interfaces';
import { Build5, SoonaverseOtrAddress, https, otr } from '@build-5/sdk';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import dayjs from 'dayjs';
import { BehaviorSubject } from 'rxjs';
import { EventLogService } from 'src/app/services/event.service';
import { NftService } from 'src/app/services/nft.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { UnitFormatPipe } from 'src/app/utils/format.utils';
import { environment } from 'src/environments/environment';

@UntilDestroy()
@Component({
  selector: 'app-product',
  standalone: true,
  imports: [UnitFormatPipe],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent {
  @Input() nft: Nft | undefined;
  public getUrl(org: string, size?: FILE_SIZES): string {
    const extensionPat = /\.[^/.]+$/;
    const ext = org.match(extensionPat)?.[0]?.replace('.', '_');
    return org.replace(extensionPat, ext + '_' + size + '.webp');
  }

  constructor(private nftService: NftService, private log: EventLogService, private tranService: TransactionService) {
    // none.
  }

  public medSizeImg(org?: string): string {
    if (!org) return '';

    return this.getUrl(org, FILE_SIZES.medium);
  }

  public monitorOrderProgress(id: string): void {
    const listeningToTransaction: string[] = [];
    const linkedTransactions$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
      Transaction | undefined
    >(undefined);

    linkedTransactions$.subscribe((val) => {
      // Ignore delete or empty
      if (!val) {
        return;
      }

      if (val.type === TransactionType.PAYMENT) {
        this.log.add('Received payment for ' + ((val.payload.amount || 0) / 1000 / 1000) + ' ' + val.network.toUpperCase());
        if (val.payload.invalidPayment === false) {
          this.log.add('Payment has been considered invalid. Refund initiated.');
        }
      } 
   
      if (val.type === TransactionType.CREDIT) {
        if (val.payload.reconciled === true) {
          this.log.add('Credit issued and reconciled.');
        }
      }

      if (val.type === TransactionType.BILL_PAYMENT) {
        this.log.add('Bill Payment issued. Previous owner / Royalties paid.');
      }

    });
    
    // Let's monitor order to understand progress of the transaction.
    this.tranService.getOneLive(id).pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void) {
          this.log.add('Order has expired. Any funds will now be refunded.')
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          // Listen to other transactions.
          for (const tranId of val.linkedTransactions) {
            if (listeningToTransaction.indexOf(tranId) > -1) {
              continue;
            }

            listeningToTransaction.push(tranId);
            this.tranService.getOneLive(id).pipe(untilDestroyed(this)).subscribe(<any>linkedTransactions$);
          }
        }
        if (val.payload.reconciled === true) {
          this.log.add('NFT Sold to user ' + val.member);
        }
      }
    });
  }

  public async buyOtr(id: string): Promise<void> {
    // Get NFT Price
    const nfts = await this.nftService.getNfts(id);
    const price = nfts[0].price;
    this.log.add('NFT Price: ' + price);

    const request = this.nftService.purchase(id, price);
    const url = request.getBloomDeepLink();
    try {
      window.open(url);
    } catch (e) {
      this.log.add('ERRROR: ' + e)
    }
    this.log.add('Deep link created: ' + url);
    const trackingTag = request.getTag(url);
    this.log.add('Tracking of progress:');
    https(Build5.TEST).project(environment.build5Token).trackByTag(trackingTag).subscribe((v) => {
      this.log.add(JSON.stringify(v));
    })
  }
}
