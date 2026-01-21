import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-items-details',
  templateUrl: './items-details.page.html',
  styleUrls: ['./items-details.page.scss'],
})
export class ItemsDetailsPage implements OnInit {
  titre: string;
  Description: string;
  prix: string;
  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe((params) => {
      if (this.router.getCurrentNavigation().extras.state) {
        let product = this.router.getCurrentNavigation().extras.state.item;
        if (product) {
          this.titre = product.titre;
          this.Description = product.description;
          this.prix = product.prix;
        }
      }
    });
  }

  ngOnInit() {}
}
