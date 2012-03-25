var tileRadius = 20;
var boardSize = 10;

var tileData = [
  ['A', 0, 7],
  ['B', 2, 3],
  ['C', 2, 3],
  ['D', 1, 3],
  ['E', 0, 10],
  ['F', 2, 3],
  ['G', 2, 4],
  ['H', 3, 2],
  ['I', 0, 7],
  ['J', 4, 1],
  ['K', 3, 2],
  ['L', 0, 4],
  ['M', 2, 3],
  ['N', 1, 4],
  ['O', 0, 7],
  ['P', 2, 3],
  ['Q', 4, 1],
  ['R', 1, 5],
  ['S', 1, 5],
  ['T', 1, 5],
  ['U', 1, 4],
  ['V', 4, 1],
  ['W', 3, 3],
  ['X', 4, 1],
  ['Y', 3, 2],
  ['Z', 4, 1],
  [' ', 0, 2]
];

function TileSpec(letter, value, freq) {
  this.letter = letter;
  this.value = value;
  this.freq = freq;
}

function makeTileSpecs(tileData) {
  return $.map(tileData, function (args) {
    var spec = new TileSpec();
    TileSpec.apply(spec, args);
    return spec;
  });
}

TileSpec.prototype.makeTile = function (parent) {
  var tile = $('<div class="tile" />').appendTo(parent);

  tile.spec = this;

  var canvas = $('<canvas />');
  canvas.attr('width', tileRadius*3);
  canvas.attr('height', tileRadius*3);
  drawCircle(canvas, tileRadius*1.5, tileRadius*1.5, tileRadius);
  tile.append(canvas);

  var text = $('<div>' + this.letter + '</div>');
  if (this.value) {
    text.append($('<sub>' + this.value + '</sub>'));
  }
  tile.append(text);
  text.position({ my: 'center', at: 'center', of: canvas });

  tile.draggable();
  return tile;
}

TileSpec.prototype.makeTiles = function (parent) {
  var tiles = []
  for (var i = 0; i < this.freq; i++) {
    tiles.push(this.makeTile(parent));
  }
  return tiles;
}

function drawCircle(element, x, y, r) {
  var context = element[0].getContext('2d');
  context.beginPath();
  context.arc(x, y, r, 0, 2*Math.PI, false);
  context.stroke();
}

function drawSpace(board, r, c) {
  drawCircle(board, tileRadius*(c*3+1.5), tileRadius*(r*3+1.5), tileRadius);
}

function makeBoard(parent) {
  var board = $('<canvas />').appendTo(parent);
  board.attr('width', tileRadius*boardSize*3);
  board.attr('height', tileRadius*boardSize*3);
  for (var r = 0; r < boardSize; r++) {
    for (var c = 0; c < boardSize; c++) {
      drawSpace(board, r, c);
    }
  }
  return board;
}

function placeTile(board, tile, r, c) {
  tile.position({ my: 'left top', at: 'left top', of: board,
                  collision: 'none',
                  offset: c*tileRadius*3 + ' ' + r*tileRadius*3 });
}

function main() {
  var root = $('#wordsearch');
  var board = makeBoard(root);
  var tiles = [];
  $.each(makeTileSpecs(tileData), function (i, spec) {
    tiles.push.apply(tiles, spec.makeTiles(root));
  });
  $.shuffle(tiles);
  for (var r = 0; r < boardSize; r++) {
    for (var c = 0; c < boardSize; c++) {
      if (r < boardSize/2 - 1 || r > boardSize/2 ||
          c < boardSize/2 - 1 || c > boardSize/2) {
        placeTile(board, tiles.pop(), r, c);
      }
    }
  }
}

$(main);
