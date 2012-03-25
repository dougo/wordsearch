function drawCircle(element, x, y, r) {
  var context = element[0].getContext('2d');
  context.beginPath();
  context.arc(x, y, r, 0, 2*Math.PI, false);
  context.stroke();
}

var tileRadius = 20;
var boardSize = 10;

function drawSpace(board, r, c) {
  drawCircle(board, tileRadius*(c*3+1.5), tileRadius*(r*3+1.5), tileRadius);
}

function makeBoard(parent) {
  var board = $('<canvas />');
  board.attr('width', tileRadius*boardSize*3);
  board.attr('height', tileRadius*boardSize*3);
  for (var r = 0; r < boardSize; r++) {
    for (var c = 0; c < boardSize; c++) {
      drawSpace(board, r, c);
    }
  }
  parent.append(board);
  return board;
}

var values = {
  A: 0,
  B: 2,
  C: 2,
  D: 1,
  E: 0,
  F: 2,
  G: 2,
  H: 3,
  I: 0,
  J: 4,
  K: 3,
  L: 0,
  M: 2,
  N: 1,
  O: 0,
  P: 2,
  Q: 4,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 3,
  X: 4,
  Y: 3,
  Z: 4,
  blank: 0
};

var freqs = {
  A: 7,
  B: 3,
  C: 3,
  D: 3,
  E: 10,
  F: 3,
  G: 4,
  H: 2,
  I: 7,
  J: 1,
  K: 2,
  L: 4,
  M: 3,
  N: 4,
  O: 7,
  P: 3,
  Q: 1,
  R: 5,
  S: 5,
  T: 5,
  U: 4,
  V: 1,
  W: 3,
  X: 1,
  Y: 2,
  Z: 1,
  blank: 2
};

function makeTile(parent, letter, value) {
  var tile = $('<div class="tile" />');
  parent.append(tile);

  tile.letter = letter;
  tile.letterValue = value;

  var canvas = $('<canvas />');
  canvas.attr('width', tileRadius*3);
  canvas.attr('height', tileRadius*3);
  drawCircle(canvas, tileRadius*1.5, tileRadius*1.5, tileRadius);
  tile.append(canvas);

  if (letter != 'blank') {
    var text = $('<div>' + letter + '</div>');
    if (value) {
      text.append($('<sub>' + value + '</sub>'));
    }
    tile.append(text);
    text.position({ my: 'center', at: 'center', of: canvas });
  }

  tile.draggable();
  return tile;
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
  for (var letter in freqs) {
    for (var i = 0; i < freqs[letter]; i++) {
      tiles.push(makeTile(root, letter, values[letter]));
    }
  }
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
