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
  tile.width(tileRadius*3);
  tile.height(tileRadius*3);

  tile.spec = this;

  var canvas = $('<canvas />').appendTo(tile);
  canvas.attr('width', tileRadius*3);
  canvas.attr('height', tileRadius*3);
  canvas.addLayer({
    method: 'drawEllipse',
    x: tileRadius*1.5,
    y: tileRadius*1.5,
    width: tileRadius*2,
    height: tileRadius*2,
    strokeStyle: 'black',
    fillStyle: 'tan'
  });
  canvas.drawLayers();

  tile.mousedown(function (e) {
    if (canvas.getLayers().length < 2) {
      canvas.addLayer({
        method: 'drawEllipse',
        strokeStyle: 'red',
        strokeWidth: 5,
        x: tileRadius*1.5,
        y: tileRadius*1.5,
        width: (tileRadius+3)*2,
        height: (tileRadius+3)*2
      });
    } else {
      canvas.removeLayer(1);
    }
    canvas.drawLayers();
  });

  var text = $('<div>' + this.letter + '</div>').appendTo(tile);
  if (this.value) {
    text.append($('<sub>' + this.value + '</sub>'));
  }
  text.position({ my: 'center', at: 'center', of: canvas });

  tile.draggable({
    distance: 5,
    stack: '.tile',
    revert: function (space) {
      if (!space) {
        return true;
      } else {
        placeTileOnSpace(tile, space);
        return false;
      }
    },
    revertDuration: 200,
    start: function (e) {
      $.each(legalSpaces(tile), function (i, space) {
        space.droppable();
      });
    },
    stop: function (e) {
      $('.space').droppable('destroy');
    }
  });
  return tile;
}

TileSpec.prototype.makeTiles = function (parent) {
  var tiles = [];
  for (var i = 0; i < this.freq; i++) {
    tiles.push(this.makeTile(parent));
  }
  return tiles;
}

function isEmpty(space) {
  return !space.data('tile');
}

function legalSpaces(tile) {
  var board = tile.data('board');
  var origin = tile.data('origin');
  var r0 = origin.data('r');
  var c0 = origin.data('c');
  var spaces = [];
  if (isEmpty(origin)) spaces.push(origin);
  $.each([-1, 0, 1], function (_, Δr) {
    $.each([-1, 0, 1], function (_, Δc) {
      if (Δr || Δc) {
        for (var i = 1; i < boardSize; i++) {
          var r = r0 + i*Δr;
          var c = c0 + i*Δc;
          if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
          var space = spaceAt(board, r, c);
          if (!isEmpty(space)) break;
          spaces.push(space);
        }
      }
    });
  });
  return spaces;
}

function drawCircle(element, p) {
  p.radius = p.radius || tileRadius;
  p.width = p.height = 2*p.radius;
  p.strokeStyle = p.strokeStyle || 'black';
  element.drawEllipse(p);
}

function addSpace(board, r, c) {
  var space = $('<canvas class="space" />').appendTo(board);
  space.attr('width', tileRadius*3);
  space.attr('height', tileRadius*3);
  drawCircle(space, { x: tileRadius*1.5, y: tileRadius*1.5 });
  placeSpace(board, space, r, c);
}

function makeBoard(parent) {
  var board = $('<div id="board" />').appendTo(parent);
  board.width(tileRadius*boardSize*3);
  board.height(tileRadius*boardSize*3);

  var spaces = [];
  for (var r = 0; r < boardSize; r++) spaces.push([]);
  board.data('spaces', spaces);

  for (var r = 0; r < boardSize; r++) {
    for (var c = 0; c < boardSize; c++) {
      addSpace(board, r, c);
    }
  }

  return board;
}

function spaceAt(board, r, c) {
  return board.data('spaces')[r][c];  
}

function placeSpace(board, space, r, c) {
  board.data('spaces')[r][c] = space;
  space.data('r', r);
  space.data('c', c);
  space.position({ my: 'left top', at: 'left top', of: board,
                   collision: 'none',
                   offset: c*tileRadius*3 + ' ' + r*tileRadius*3 });
}

function placeTileOnSpace(tile, space) {
  tile.position({ my: 'left top', at: 'left top', of: space,
                  collision: 'none' });
  var oldSpace = tile.data('space');
  if (oldSpace) oldSpace.data('tile', null);
  space.data('tile', tile);
  tile.data('space', space);
}

function placeTileOnBoard(tile, board, r, c) {
  var space = spaceAt(board, r, c);
  placeTileOnSpace(tile, space);
  tile.data('board', board);
  tile.data('origin', space);
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
        placeTileOnBoard(tiles.pop(), board, r, c);
      }
    }
  }
}

$(main);
