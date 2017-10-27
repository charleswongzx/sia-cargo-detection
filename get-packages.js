console.log('starting get packages');

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-1'});

exports.handler = (event, context, callback) => {

    let scanParam = {
        TableName: 'Package',
        Limit: 100
    };

    docClient.scan(scanParam, function(err, data){
        if (err) {
            callback(err, null);
        } else {
            optimize(callback, data);
        }
    })
};

const RotationType_WHD = 0;
const RotationType_HWD = 1;
const RotationType_HDW = 2;
const RotationType_DHW = 3;
const RotationType_DWH = 4;
const RotationType_WDH = 5;

const WidthAxis = 0;
const HeightAxis = 1;
const DepthAxis = 2;

const StartPosition = [0, 0, 0];

class Bin {
  constructor(name, w, h, d) {
    this.name = name;
    this.width = w;
    this.height = h;
    this.depth = d;
    this.items = [];
  }

  getName() {
    return this.name;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getDepth() {
    return this.depth;
  }

  getItems() {
    return this.items;
  }

  getVolume() {
    return this.getWidth() * this.getHeight() * this.getDepth();
  }

  putItem(item, p) {
    let box = this;
    let fit = false;

    item.position = p;
    for (let i=0; i<6; i++) {
      item.rotationType = i;
      let d = item.getDimension();

      if (box.getWidth() < p[0] + d[0] || box.getHeight() < p[1] + d[1] || box.getDepth() < p[2] + d[2]) {
        continue;
      }

      fit = true;

      for (let j=0; j<box.items.length; j++) {
        let _j = box.items[j];
        if (_j.intersect(item)) {
          fit = false;
          break;
        }
      }

      if (fit) {
        box.items.push(item);
      }

      return fit;
    }

    return fit;
  }

}

class Item {

  constructor(name, w, h, d, weight, fragile=false, stackable=true, rotatable=true) {
    this.name = name;
    this.width = w;
    this.height = h;
    this.depth = d;
    this.weight = weight;
    this.rotationType = RotationType_WHD;
    this.rotatable = rotatable;
    this.fragile = fragile;
    this.stackable = stackable
    this.position = [];
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getDepth() {
    return this.depth;
  }

  getRotationType() {
    return this.rotationType;
  }

  getRotatable() {
    return this.rotatable;
  }

  getRotationTypeString() {
    return RotationTypeStrings[this.getRotationType()];
  }

  getDimension() {
    let d;
    if (!this.rotatable) {
      d = [this.getWidth(), this.getHeight(), this.getDepth()];
    } else {
      switch (this.rotationType) {
        case RotationType_WHD:
          d = [this.getWidth(), this.getHeight(), this.getDepth()];
          break;
        case RotationType_HWD:
          d = [this.getHeight(), this.getWidth(), this.getDepth()];
          break;
        case RotationType_HDW:
          d = [this.getHeight(), this.getDepth(), this.getWidth()];
          break;
        case RotationType_DHW:
          d = [this.getDepth(), this.getHeight(), this.getWidth()];
          break;
        case RotationType_DWH:
          d = [this.getDepth(), this.getWidth(), this.getHeight()];
          break;
        case RotationType_WDH:
          d = [this.getWidth(), this.getDepth(), this.getHeight()];
          break;
      }
    }
    return d;
  }

  intersect(i2) {
    return rectIntersect(this, i2, WidthAxis, HeightAxis) &&
        rectIntersect(this, i2, HeightAxis, DepthAxis) &&
        rectIntersect(this, i2, WidthAxis, DepthAxis);
  }

  getVolume() {
    return this.getWidth() * this.getHeight() * this.getDepth();
  }
}

class Packer {
  constructor() {
    this.bins = [];
    this.items = [];
    this.unfitItems = [];
  }

  addBin(bin) {
    this.bins.push(bin);
  }

  addItem(item) {
    this.items.push(item);
  }

  findFittedBin(i) {
    for (let _i=0; _i<this.bins.length; _i++) {
      let b = this.bins[_i];

      if (!b.putItem(i, StartPosition)) {
        continue;
      }

      if (b.items.length === 1 && b.items[0] === i) {
        b.items = [];
      }

      return b;
    }
    return null;
  }

  getBiggerBinThan(b) {
    let v = b.getVolume();
    for (let _i=0; _i<this.bins; _i++) {
      let b2 = this.bins[_i];
      if (b2.getVolume() > v) {
        return b2;
      }
    }
    return null;
  }

  unfitItem() {
    if (this.items.length === 0) {
      return;
    }
    this.unfitItems.push(this.items[0]);
    this.items.splice(0, 1);
  }

  packToBin(b, items) {
    let fitted = false;
    let b2 = null;
    let unpacked = [];
    let fit = b.putItem(items[0], StartPosition);

    if (!fit) {
      let b2 = this.getBiggerBinThan(b);
      if (b2) {
        return this.packToBin(b2, items);
      }
      return this.items;
    }

    // Pack unpacked items.
    for (let _i=1; _i < this.items.length; _i++) {
      let item = this.items[_i];

      // Try available pivots in current bin that are not intersect with
      // existing items in current bin.
      lookup:
      for (let _pt=0; _pt < 3; _pt++) {
        for (let _j=0; _j < b.items.length; _j++) {
          let pv;
          let ib = b.items[_j];
          switch (_pt) {
            case WidthAxis:
              pv = [ib.position[0] + ib.getWidth(), ib.position[1], ib.position[2]];
              break;
            case HeightAxis:
              pv = [ib.position[0], ib.position[1] + ib.getHeight(), ib.position[2]];
              break;
            case DepthAxis:
              pv = [ib.position[0], ib.position[1], ib.position[2] + ib.getDepth()];
              break;
          }

          if (b.putItem(item, pv)) {
            fitted = true;
            break lookup;
          }
        }
      }

      if (!fitted) {
        while (b2 !== null) {
          b2 = this.getBiggerBinThan(b);
          if (b2) {
            b2.items.push(item);
            let left = this.packToBin(b2, b2.items);
            if (left.length === 0) {
              b = b2;
              fitted = true;
              break;
            }
          }
        }

        if (!fitted) {
          unpacked.push(item);
        }
      }
    }

    return unpacked;
  }

  pack() {
    this.bins.sort((a, b) => {
      return a.getVolume() > b.getVolume();
    });

    this.items.sort((a, b) => {
      return a.getVolume() > b.getVolume();
    });

    while (this.items.length > 0) {
      let bin = this.findFittedBin(this.items[0]);

      if (bin === null) {
        this.unfitItem();
        continue;
      }

      this.items = this.packToBin(bin, this.items);
    }

    return null;
  }
}

const rectIntersect = (i1, i2, x, y) => {
  let d1, d2, cx1, cy1, cx2, cy2, ix, iy;

  d1 = i1.getDimension();
  d2 = i2.getDimension();

  cx1 = i1.position[x] + d1[x] / 2;
  cy1 = i1.position[y] + d1[y] / 2;
  cx2 = i2.position[x] + d2[x] / 2;
  cy2 = i2.position[y] + d2[y] / 2;

  ix = Math.max(cx1, cx2) - Math.min(cx1, cx2);
  iy = Math.max(cy1, cy2) - Math.min(cy1, cy2);

  return ix < (d1[x] + d2[x]) / 2 && iy < (d1[y] + d2[y]) / 2;
};

optimize = (callback, data) => {
    let items = data['Items']
    let packer = new Packer();
    let bin1 = new Bin("Bin 1", 142, 157, 140, 1000);
    packer.addBin(bin1);
    for (let i = 0; i < items.length; i++) {
      packer.addItem(new Item(items[i].name, items[i].width, items[i].height, items[i].depth))
    }

    // pack items into bin1
    packer.pack();
    callback(null, {"items": bin1.items});
}