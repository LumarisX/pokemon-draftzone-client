import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuctionService } from '../../services/auction.service';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
@Component({
  selector: 'pdz-league-auction',
  imports: [CommonModule, FormsModule, MatIconModule, SpriteComponent],
  templateUrl: './league-auction.component.html',
  styleUrl: './league-auction.component.scss',
})
export class LeagueAuctionComponent implements OnInit, OnDestroy {
  private auctionService = inject(AuctionService);
  private route = inject(ActivatedRoute);

  @Input() leagueId!: string;

  auctions = new Map<string, any>();
  bidAmounts = new Map<string, number>();
  endedAuctions = new Map<string, any>();
  minBidIncrease = 5;

  errorMessage: string | null = null;

  private subs = new Subscription();

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.leagueId = params['leagueId']!;
      this.auctionService.joinAuction(this.leagueId);

      this.subs.add(
        this.auctionService.allAuctions$.subscribe((auctionsObj) => {
          this.auctions.clear();
          for (const itemId in auctionsObj) {
            this.auctions.set(itemId, auctionsObj[itemId]);
          }
        }),
      );

      this.subs.add(
        this.auctionService.auctionState$.subscribe((state) => {
          if (this.auctions.has(state.itemId)) {
            this.auctions.set(state.itemId, state);
          }
        }),
      );

      this.subs.add(
        this.auctionService.auctionEnded$.subscribe((result) => {
          if (this.auctions.has(result.itemId)) {
            this.auctions.delete(result.itemId);
            this.endedAuctions.set(result.itemId, result);
          }
        }),
      );

      this.subs.add(
        this.auctionService.auctionError$.subscribe((error) => {
          this.errorMessage = `Error on item ${error.itemId}: ${error.message}`;
          setTimeout(() => (this.errorMessage = null), 5000);
        }),
      );

      this.subs.add(
        interval(1000).subscribe(() => {
          this.updateAllCountdowns();
        }),
      );
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  placeBid(itemId: string): void {
    this.errorMessage = null;
    const bidAmount = this.bidAmounts.get(itemId);
    if (bidAmount && bidAmount > 0) {
      this.auctionService.placeBid(this.leagueId, itemId, bidAmount);
    }
  }

  get auctionArray(): any[] {
    return Array.from(this.auctions.values());
  }

  get endedAuctionArray(): any[] {
    return Array.from(this.endedAuctions.values());
  }

  private updateAllCountdowns(): void {
    this.auctions.forEach((auction) => {
      const endTime = new Date(auction.auctionEndTime).getTime();
      const remaining = endTime - new Date().getTime();

      if (remaining <= 0) {
        auction.countdown = '00:00:00';
      } else {
        const seconds = Math.floor((remaining / 1000) % 60);
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        auction.countdown = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      }
    });
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}
