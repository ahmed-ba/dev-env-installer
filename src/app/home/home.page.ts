import { Component } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { AddItemPage } from "../add-item/add-item.page";
import { Router, NavigationExtras } from "@angular/router";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage {
  products = [];
  constructor(private modal: ModalController, private router: Router) {}

  async addItem() {
    const modal = await this.modal.create({
      component: AddItemPage,
    });
    modal.onDidDismiss().then((item) => {
      //console.log(item.data);
      this.products.push(item.data);
      console.log(this.products);
    });
    return await modal.present();
  }
  viewDetails(product) {
    let navigationExtras: NavigationExtras = { state: { item: product } };
    this.router.navigateByUrl("item-details", navigationExtras);
  }
}