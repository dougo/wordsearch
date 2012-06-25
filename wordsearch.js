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

// MODELS

var Game = Backbone.Model.extend({
  initialize: function () {
    this.total = 0;
    this.selected = new Tiles();
    this.board = new Board({ game: this, tiles: this.makeTiles(tileData) });
  },

  makeTiles: function (tileData) {
    var game = this;
    return _.shuffle(_.flatten(_.map(tileData, function (args) {
      return function (letter, value, freq) {
        return _.map(_.range(freq), function (i) {
          return new Tile({ game: game, letter: letter, value: value });
        });
      }.apply(game, args);
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
          space.placeTile(tile);
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

  placeTile: function (tile) {
    var oldSpace = tile.space;
    if (oldSpace) oldSpace.tile = null;
    this.tile = tile;
    tile.moveTo(this);
    tile.updateSelection();
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

  isSelected: function () {
    return this.game.selected.include(this);
  },

  updateSelection: function () {
    if (this.space == this.origin) {
      this.unselect();
    } else {
      this.select();
    }
  },

  select: function () {
    this.game.select(this);
  },

  unselect: function () {
    this.game.unselect(this);
  },

  remove: function () {
    this.unselect();
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

// VIEWS

var GameView = Backbone.View.extend({
  initialize: function (attrs) {
    var game = this.model;
    game.view = this;

    this.$el.width(tileRadius*boardSize*3);
    this.$el.height(tileRadius*boardSize*3);

    new BoardView({ model: game.board, parent: this });

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
    var view = board.view = this;

    this.$el.appendTo(opts.parent.$el);
    this.$el.width(tileRadius*boardSize*3);
    this.$el.height(tileRadius*boardSize*3);

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
    space.view = this;
    this.$el.data('model', space);

    this.$el.appendTo(opts.parent.$el);
    this.$el.attr('width', tileRadius*3);
    this.$el.attr('height', tileRadius*3);
    drawCircle(this.$el, { x: tileRadius*1.5, y: tileRadius*1.5 });

    this.$el.position({
      my: 'left top', at: 'left top', of: opts.parent.$el,
      collision: 'none',
      offset: space.c*tileRadius*3 + ' ' + space.r*tileRadius*3
    });

    if (space.tile) {
      new TileView({ model: space.tile, parent: space.board.game.view });
    }
  }
});

var TileView = Backbone.View.extend({
  className: 'tile',

  initialize: function (opts) {
    var tile = this.model;
    var view = tile.view = this;
    this.$el.data('model', tile);

    this.$el.appendTo(opts.parent.$el);
    this.$el.width(tileRadius*3);
    this.$el.height(tileRadius*3);

    var canvas = $(this.make('canvas')).appendTo(this.$el);
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

    var label = $(this.make('div', { 'class': 'label' })).appendTo(this.$el);
    label.append(this.make('div', { 'class': 'letter' }, tile.letter));
    if (tile.value)
      label.append(this.make('sub', { 'class': 'value' }, tile.value));
    label.position({ my: 'center', at: 'center', of: canvas });

    this.render();

    this.model.on('add remove change', this.render, this);

    this.$el.draggable({
      distance: 5,
      stack: '.tile',
      revert: function (space) {
        if (!space) {
          tile.updateSelection();
          return true;
        } else {
          space.data('model').placeTile(tile);
          // This might not result in an event, if dropped on/near the
          // same space, but we still need to move it back to the
          // center of its space, so just call render directly.
          view.render();
          return false;
        }
      },
      revertDuration: 200,
      start: function (e) {
        _.each(tile.legalSpaces(), function (space) {
          space.view.$el.droppable();
        });
      },
      stop: function (e) {
        // This bypasses the mouseup handler, because selection is
        // updated in the revert function.
        e.stopImmediatePropagation();
        $('.space').droppable('destroy');
      }
    });
  },

  render: function () {
    var space = this.model.space;
    if (space) {
      this.$el.position({ my: 'left top', at: 'left top', of: space.view.$el,
                          collision: 'none' });
    } else {
      this.$el.css('visibility', 'hidden');
    }

    var canvas = this.$('canvas');
    if (this.model.isSelected()) {
      if (canvas.getLayers().length == 1) {
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
    } else {
      if (canvas.getLayers().length > 1) {
        canvas.removeLayer(1);
        canvas.drawLayers();
      }
    }

    return this;
  },

  events: {
    'mouseup': 'mouseup'
  },

  // Handle clicking on a tile without dragging. 
  mouseup: function () {
    var tile = this.model;
    if (!tile.isSelected()) {
      tile.select();
    } else {
      tile.updateSelection();
    }
  }
});

var game;
var view;

function main() {
  game = new Game();
  view = new GameView({ model: game, el: $('#wordsearch') });
}

$(main);
