var tileRadius = 20;
var boardSize = 10;

var tileData = [
  // letter, value, frequency
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

function Game() {
  this.view = $('#wordsearch');
  this.view.data('model', this);
  this.view.width(tileRadius*boardSize*3);
  this.view.height(tileRadius*boardSize*3);

  this.board = new Board(this);
  this.makeAllTiles(tileData);

  this.board.placeTiles(this.tiles);

  this.selected = [];
  this.total = 0;
}
Game.prototype = {

  makeAllTiles: function (tileData) {
    this.tiles = [];
    var game = this;
    $.each(tileData, function (_, args) {
      game.makeTiles.apply(game, args);
    });
    $.shuffle(this.tiles);
  },

  makeTiles: function (letter, value, freq) {
    for (var i = 0; i < freq; i++) {
      this.tiles.push(new Tile(this, letter, value));
    }
  },

  select: function (tile) {
    this.selected.push(tile);
  },

  unselect: function (tile) {
    this.selected.splice(this.selected.indexOf(tile), 1);
  },

  reset: function () {
    while (this.selected.length > 0) {
      var tile = this.selected[0];
      tile.origin.placeTile(tile);
    }
  },

  updateWord: function() {
    this.word = this.getWord();
    $('#word').text(this.word || '');
    $('#score').text(this.word ? '= ' + this.score() : '');
    $('#scoreButton').attr('disabled', this.word ? false : true);
  },

  getWord: function () {
    tiles = this.selected;
    if (tiles.length > 1) {
      tiles.sort(function (a, b) {
        if (a == b) return 0;
        var as = a.space, bs = b.space;
        return (as.r < bs.r || as.r == bs.r && as.c < bs.c) ? -1 : 1;
      });
      var origin = tiles[0].space;
      var space = tiles[1].space
      var Δr = space.r - origin.r, Δc = space.c - origin.c;
      if (Δr >= -1 && Δr <= 1 && Δc >= -1 && Δc <= 1) {
        for (var i = 2; i < tiles.length; i++) {
          var next = tiles[i].space;
          if (next.r - space.r != Δr || next.c - space.c != Δc) return;
          space = next;
        }
        var letters = $.map(tiles, function (tile) { return tile.letter; });
        return letters.join('');
      }
    }
  },

  score: function () {
    if (this.word) {
      var sum = 0;
      $.each(this.selected, function (_, tile) { sum += tile.value; });
      return sum * this.selected.length;
    }
  },

  scoreWord: function () {
    var score = this.score();
    $.each(this.selected, function (_, tile) { tile.remove(); });
    this.selected = [];
    this.total += score;
    $('#total').text(this.total);
    this.updateWord();
  }
}

function Board(game) {
  this.makeView(game.view);
  this.makeSpaces();
}
Board.prototype = {

  makeSpaces: function () {
    this.spaces = [];
    for (var r = 0; r < boardSize; r++) {
      this.spaces.push([]);
      for (var c = 0; c < boardSize; c++) {
        this.makeSpace(r, c);
      }
    }
  },

  makeSpace: function (r, c) {
    var space = new Space(this, r, c);
    this.spaces[r][c] = space;
  },

  spaceAt: function (r, c) {
    return this.spaces[r][c];  
  },

  placeTiles: function (tiles) {
    for (var r = 0; r < boardSize; r++) {
      for (var c = 0; c < boardSize; c++) {
        if (r < boardSize/2 - 1 || r > boardSize/2 ||
            c < boardSize/2 - 1 || c > boardSize/2) {
          this.placeTile(tiles.pop(), r, c);
        }
      }
    }
  },

  placeTile: function (tile, r, c) {
    var space = this.spaceAt(r, c);
    tile.origin = space;
    space.placeTile(tile, true);
    tile.board = this;
  },

  makeView: function (parent) {
    var view = $('<div id="board" />').appendTo(parent);
    view.data('model', this);
    this.view = view;

    view.width(tileRadius*boardSize*3);
    view.height(tileRadius*boardSize*3);
  }
}

function Space(board, r, c) {
  this.r = r;
  this.c = c;
  this.makeView(board.view);
}
Space.prototype = {

  makeView: function (parent) {
    var view = $('<canvas class="space" />').appendTo(parent);
    view.data('model', this);
    this.view = view;

    view.attr('width', tileRadius*3);
    view.attr('height', tileRadius*3);
    drawCircle(view, { x: tileRadius*1.5, y: tileRadius*1.5 });

    view.position({ my: 'left top', at: 'left top', of: parent,
                    collision: 'none',
                    offset: this.c*tileRadius*3 + ' ' + this.r*tileRadius*3 });
  },

  placeTile: function (tile, noUpdate) {
    var oldSpace = tile.space;
    if (oldSpace) oldSpace.tile = null;
    this.tile = tile;
    tile.space = this;

    tile.view.position({ my: 'left top', at: 'left top', of: this.view,
                         collision: 'none' });

    if (!noUpdate) tile.updateHighlight();
  },

  isBetween: function (s1, s2) {
    // TO DO: I suspect there is a simpler/quicker way to compute this.
    return (s1.r - s2.r)*(s1.c - this.c) == (s1.c - s2.c)*(s1.r - this.r) &&
      (s1.r <= this.r && this.r <= s2.r || s2.r <= this.r && this.r <= s1.r) &&
      (s1.c <= this.c && this.c <= s2.c || s2.c <= this.c && this.c <= s1.c);
  }
}

function drawCircle(canvas, p) {
  p.radius = p.radius || tileRadius;
  p.width = p.height = 2*p.radius;
  p.strokeStyle = p.strokeStyle || 'black';
  canvas.drawEllipse(p);
}

function Tile(game, letter, value) {
  this.game = game;
  this.letter = letter;
  this.value = value;
  this.makeView(game.view);
}
Tile.prototype = {

  legalSpaces: function() {
    var tile = this;
    var board = this.board;
    var r0 = this.origin.r;
    var c0 = this.origin.c;
    var spaces = [];
    if (!this.origin.tile) {
      // A tile can't move back to its origin if it would be in the
      // way of another tile that's already moved.
      if ($.grep(this.game.selected, function(movedTile) {
        return tile.origin.isBetween(movedTile.origin, movedTile.space);
      }).length == 0) {
        spaces.push(this.origin);
      }
    }
    $.each([-1, 0, 1], function (_, Δr) {
      $.each([-1, 0, 1], function (_, Δc) {
        if (Δr || Δc) {
          for (var i = 1; i < boardSize; i++) {
            var r = r0 + i*Δr;
            var c = c0 + i*Δc;
            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
            var space = board.spaceAt(r, c);
            if (space == tile.origin) break;
            var tileInSpace = space.tile;
            if (tileInSpace && tileInSpace != tile) break;
            spaces.push(space);
          }
        }
      });
    });
    return spaces;
  },

  makeView: function (parent) {
    var view = $('<div class="tile" />').appendTo(parent);
    view.data('model', this);
    this.view = view;

    view.width(tileRadius*3);
    view.height(tileRadius*3);

    var canvas = $('<canvas />').appendTo(view);
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

    var label = $('<div class="label" />').appendTo(view);
    $('<div class="letter">' + this.letter + '</div>').appendTo(label);
    if (this.value) {
      $('<sub class="value">' + this.value + '</sub>').appendTo(label);
    }
    label.position({ my: 'center', at: 'center', of: canvas });

    var tile = this;

    view.mouseup(function (e) {
      if (!tile.highlit) {
        tile.highlight();
      } else {
        tile.updateHighlight();
      }
    });

    view.draggable({
      distance: 5,
      stack: '.tile',
      revert: function (space) {
        if (!space) {
          tile.updateHighlight();
          return true;
        } else {
          space.data('model').placeTile(tile);
          return false;
        }
      },
      revertDuration: 200,
      start: function (e) {
        $.each(tile.legalSpaces(), function (_, space) {
          space.view.droppable();
        });
      },
      stop: function (e) {
        // This bypasses the mouseup handler, because highlighting is
        // updated in the revert function.
        e.stopImmediatePropagation();
        $('.space').droppable('destroy');
      }
    });
  },

  updateHighlight: function() {
    if (this.space == this.origin) {
      this.unhighlight();
    } else {
      this.highlight();
    }
  },

  highlight: function () {
    if (!this.highlit) {
      this.highlit = true;
      this.game.select(this);
      var canvas = this.view.find('canvas');
      canvas.addLayer({
        method: 'drawEllipse',
        strokeStyle: 'red',
        strokeWidth: 5,
        x: tileRadius*1.5,
        y: tileRadius*1.5,
        width: (tileRadius+3)*2,
        height: (tileRadius+3)*2
      });
      canvas.drawLayers();
    }
    this.game.updateWord();
  },

  unhighlight: function () {
    if (this.highlit) {
      this.highlit = false;
      this.game.unselect(this);
      var canvas = this.view.find('canvas');
      canvas.removeLayer(1);
      canvas.drawLayers();
    }
    this.game.updateWord();
  },

  remove: function () {
    this.view.css('visibility', 'hidden');
    this.space.tile = null;
  }
}

var game;

function main() {
  game = new Game();
}

$(main);
