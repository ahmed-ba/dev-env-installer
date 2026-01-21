import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.page.html',
  styleUrls: ['./add-item.page.scss'],
})
export class AddItemPage implements OnInit {
  titre: string;
  description: string;
  prix: string;
  constructor(public modal: ModalController) {}

  ngOnInit() {}

  saveItem() {
    let newItem = {
      titre: this.titre,
      description: this.titre,
      prix: this.prix,
    };
    this.modal.dismiss(newItem);
  }
  close() {
    this.modal.dismiss();
  }
}
