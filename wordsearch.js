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

var Game = Backbone.Model.extend({
  initialize: function () {
    this.board = new Board({ game: this, tiles: this.makeTiles(tileData) });
    this.selected = new Tiles();
    this.total = 0;
  },

  makeTiles: function (tileData) {
    var game = this;
    return _.shuffle(_.flatten(_.map(tileData, function (args) {
      return function (letter, value, freq) {
        return _.map(_.range(freq), function (i) {
          return new Tile({ game: game, letter: letter, value: value });
        })}.apply(game, args);
    })));
  },

  select: function (tile) {
    this.selected.add(tile);
  },

  unselect: function (tile) {
    this.selected.remove(tile);
  },

  reset: function () {
    while (this.selected.length > 0) {
      var tile = this.selected.at(0);
      tile.origin.placeTile(tile);
    }
  },

  getWord: function () {
    tiles = this.selected;
    if (tiles.length > 1) {
      // Determine if the tiles are in a line.
      var origin = tiles.at(0).space;
      var space = tiles.at(1).space
      var Δr = space.r - origin.r, Δc = space.c - origin.c;
      if (Δr >= -1 && Δr <= 1 && Δc >= -1 && Δc <= 1) {
        for (var i = 2; i < tiles.length; i++) {
          var next = tiles.at(i).space;
          if (next.r - space.r != Δr || next.c - space.c != Δc) return;
          space = next;
        }
        return tiles.pluck('letter').join('');
      }
    }
  },

  score: function () {
    var sum = 0;
    this.selected.each(function (tile) { sum += tile.value; });
    return sum * this.selected.length;
  },

  scoreWord: function () {
    this.total += this.score();
    // Copy to a fresh array first, rather than iterating over the
    // collection (which gets mutated during the iteration).
    var tiles = this.selected.toArray();
    _.invoke(tiles, 'remove');
  }
});

var Board = Backbone.Model.extend({
  initialize: function (attrs) {
    this.game = attrs.game;
    this.spaces = this.makeSpaces();
    this.placeTiles(attrs.tiles);
  },

  makeSpaces: function () {
    var board = this;
    return _.map(_.range(boardSize), function (r) {
      return _.map(_.range(boardSize), function (c) {
        return new Space({ board: board, r: r, c: c });
      });
    });
  },

  spaceAt: function (r, c) {
    return this.spaces[r][c];  
  },

  placeTiles: function (tiles) {
    var board = this;
    _.each(_.range(boardSize), function (r) {
      _.each(_.range(boardSize), function (c) {
        // Leave the center four spaces blank.
        if (r < boardSize/2 - 1 || r > boardSize/2 ||
            c < boardSize/2 - 1 || c > boardSize/2) {
          var tile = tiles.pop();
          var space = board.spaceAt(r, c);
          tile.origin = space;
          space.placeTile(tile, true);
          tile.board = board;
        }
      });
    });
  }
});

var Space = Backbone.Model.extend({
  initialize: function (attrs) {
    this.board = attrs.board;
    this.r = attrs.r;
    this.c = attrs.c;
  },

  placeTile: function (tile, noUpdate) {
    var oldSpace = tile.space;
    if (oldSpace) oldSpace.tile = null;
    this.tile = tile;
    tile.moveTo(this);

    if (!noUpdate) tile.updateHighlight();
  },

  isBetween: function (s1, s2) {
    // TO DO: I suspect there is a simpler/quicker way to compute this.
    return (s1.r - s2.r)*(s1.c - this.c) == (s1.c - s2.c)*(s1.r - this.r) &&
      (s1.r <= this.r && this.r <= s2.r || s2.r <= this.r && this.r <= s1.r) &&
      (s1.c <= this.c && this.c <= s2.c || s2.c <= this.c && this.c <= s1.c);
  }
});

var Tile = Backbone.Model.extend({
  initialize: function (attrs) {
    this.game = attrs.game;
    this.letter = attrs.letter;
    this.value = attrs.value;
  },

  legalSpaces: function () {
    var tile = this;
    var board = this.board;
    var r0 = this.origin.r;
    var c0 = this.origin.c;
    var spaces = [];
    if (!this.origin.tile) {
      // A tile can't move back to its origin if it would be in the
      // way of another tile that's already moved.
      if (!this.game.selected.any(function (movedTile) {
        return tile != movedTile &&
          tile.origin.isBetween(movedTile.origin, movedTile.space);
      })) {
        spaces.push(this.origin);
      }
    }
    _.each([-1, 0, 1], function (Δr) {
      _.each([-1, 0, 1], function (Δc) {
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

  moveTo: function (space) {
    this.space = space;
    this.set('space', space);
  },

  updateHighlight: function () {
    if (this.space == this.origin) {
      this.unhighlight();
    } else {
      this.highlight();
    }
  },

  highlight: function () {
    if (!this.get('highlit')) {
      this.set('highlit', true);
    }
    this.game.select(this);
  },

  unhighlight: function () {
    if (this.get('highlit')) {
      this.set('highlit', false);
    }
    this.game.unselect(this);
  },

  remove: function () {
    this.game.unselect(this);
    this.space.tile = null;
    this.moveTo(null);
  }
});

var Tiles = Backbone.Collection.extend({
  model: Tile,

  comparator: function (a, b) {
    if (a == b) return 0;
    var as = a.space, bs = b.space;
    return (as.r < bs.r || as.r == bs.r && as.c < bs.c) ? -1 : 1;
  }
});



var GameView = Backbone.View.extend({
  initialize: function (attrs) {
    var game = this.model;
    var view = this.$el;
    game.view = view;

    view.width(tileRadius*boardSize*3);
    view.height(tileRadius*boardSize*3);

    new BoardView({ model: game.board, parent: view });

    game.selected.on('add remove change', this.render, this);
  },

  render: function () {
    var word = this.model.getWord();
    $('#word').text(word || '');
    $('#score').text(word ? '= ' + this.model.score() : '');
    $('#scoreButton').attr('disabled', !word);
    $('#total').text(this.model.total);
    return this;
  }
});

var BoardView = Backbone.View.extend({
  id: 'board',

  initialize: function (opts) {
    var board = this.model;
    var view = this.$el;
    board.view = view;

    view.appendTo(opts.parent);
    view.width(tileRadius*boardSize*3);
    view.height(tileRadius*boardSize*3);

    _.each(_.range(boardSize), function (r) {
      _.each(_.range(boardSize), function (c) {
        new SpaceView({ model: board.spaceAt(r, c), parent: view });
      });
    });
  }
});

function drawCircle(canvas, p) {
  p.radius = p.radius || tileRadius;
  p.width = p.height = 2*p.radius;
  p.strokeStyle = p.strokeStyle || 'black';
  canvas.drawEllipse(p);
}

var SpaceView = Backbone.View.extend({
  tagName: 'canvas',
  className: 'space',

  initialize: function (opts) {
    var space = this.model;
    var view = this.$el;
    view.data('model', space);
    space.view = view;

    view.appendTo(opts.parent);
    view.attr('width', tileRadius*3);
    view.attr('height', tileRadius*3);
    drawCircle(view, { x: tileRadius*1.5, y: tileRadius*1.5 });

    view.position({ my: 'left top', at: 'left top', of: opts.parent,
                    collision: 'none',
                    offset: space.c*tileRadius*3 + ' ' + space.r*tileRadius*3 });

    if (space.tile) {
      new TileView({ model: space.tile, parent: space.board.game.view});
    }
  }
});

var TileView = Backbone.View.extend({
  className: 'tile',

  initialize: function (opts) {
    var tile = this.model;
    var view = this.$el;
    view.data('model', tile);
    tile.view = view;

    view.appendTo(opts.parent);
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
    $('<div class="letter">' + tile.letter + '</div>').appendTo(label);
    if (tile.value) {
      $('<sub class="value">' + tile.value + '</sub>').appendTo(label);
    }
    label.position({ my: 'center', at: 'center', of: canvas });

    this.render();

    this.model.on('change', this.render, this);

    view.mouseup(function (e) {
      if (!tile.get('highlit')) {
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
        _.each(tile.legalSpaces(), function (space) {
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

  render: function () {
    var space = this.model.space;
    if (space) {
      this.$el.position({ my: 'left top', at: 'left top', of: space.view,
                          collision: 'none' });
    } else {
      this.$el.css('visibility', 'hidden');
    }

    if (this.model.hasChanged('highlit')) {
      var canvas = this.$('canvas');
      if (this.model.get('highlit')) {
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
      } else {
        canvas.removeLayer(1);
        canvas.drawLayers();
      }
    }

    return this;
  }
});

var game;
var gameView;

function main() {
  game = new Game();
  gameView = new GameView({ model: game, el: $('#wordsearch') });
}

$(main);
