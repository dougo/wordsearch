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

function main() {
  var root = $('#wordsearch');
  makeBoard(root);
}

$(main);
