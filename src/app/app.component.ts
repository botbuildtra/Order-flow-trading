import { Component} from '@angular/core';
import * as io from 'socket.io-client';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: { '(window:keydown)': 'hotkeys($event)' },
})

export class AppComponent{
  currencyArray = [];
  socket;

  constructor(private http: HttpClient) {
    this.socket = io.connect('http://localhost:3000')
    this.socket.on('getCurrencies', (data) => {
      this.currencyArray = data
      this.connectToUpdates()
    })
  }

  connectToUpdates() {
    for (let currency of this.currencyArray) {
      this.socket.on(`update-trades-${currency.exchange}-${currency.symbol}`, (data) => {
        console.log('done')
        if (Math.abs(Number(data[0].vol)) != 0 && Math.abs(Number(data[0].vol)) >= currency.initFilterValue) {
          let date = new Date(data[0].time);
          currency.trades.unshift({
            volume: Math.abs(Number(data[0].vol)).toFixed(data[1].numsAfterDecimal.trades),
            time: date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
            price: data[0].price.toFixed(data[1].numsAfterDecimal.cup),
            side: typeof data[0].side === 'boolean' ? data[0].side : (Math.sign(data[0].vol) == 1 ? false : true)
          })
          if (currency.trades.length >= 58) {
            currency.trades.pop()
          }
        }
      })
      this.socket.on(`update-cup-${currency.exchange}-${currency.symbol}`, (data) => {
        currency.cup = data
      })
    }
  }

  trackByFn(index, item) {
    return item.price;
  }

  changeFilterValue(e) {
    let idArr = e.target.id.split('-')
    for (let currency of this.currencyArray) {
      if (currency.exchange == idArr[0] && currency.symbol == idArr[1]) {
        currency.initFilterValue = Number(e.target.value)
      }
    }
  }

  resetFilter(e){
    let filter  = e.target.nextSibling;
    while (filter.children.length != 0) {
      filter.removeChild(filter.lastChild)
    }
  }

  hotkeys(e) {
    if (e.ctrlKey && e.which == 67) {
      e.preventDefault()
      this.clearCups();
    }
    if (e.ctrlKey && e.which == 70) {
      e.preventDefault()
      let nodes = Array.from(document.querySelectorAll('.filter__trades'))
      nodes.forEach(node => {
        while (node.children.length != 0) {
          node.removeChild(node.lastChild)
        }
      })
    }
  }

  clearCups() {
    this.http.get('http://localhost:3000/clear-cups').subscribe(data => console.log(data))
  }
}
