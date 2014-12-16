function tileAt(r, c) {
  return game.board.spaceAt(r, c).tile;
}

function move(tile, r, c) {
  game.board.spaceAt(r, c).placeTile(tile);
}

$(function () {
  test('Basic tests', function () {
    ok($('#wordsearch').length > 0, 'wordsearch element exists');
    ok(game, 'game object exists');
    ok(game.board, 'board object exists');

    equal(game.makeTiles(tileData).length, Math.pow(boardSize, 2) - 4, 'game has correct number of tiles');
  });

  test('isBetween', function () {
    ok( game.board.spaceAt(1, 2).isBetween(game.board.spaceAt(0, 1), game.board.spaceAt(4, 5)));
    ok( game.board.spaceAt(0, 4).isBetween(game.board.spaceAt(0, 1), game.board.spaceAt(0, 8)));
    ok(!game.board.spaceAt(0, 0).isBetween(game.board.spaceAt(1, 1), game.board.spaceAt(2, 2)));
  });

  test('Issue #1', function () {
    var t1 = tileAt(4, 3);
    var t2 = tileAt(4, 2);

    // move t1 out of the way
    move(t1, 5, 4);
    // move t2 through t1's origin
    move(t2, 4, 4);

    equal($.inArray(t1.origin, t1.legalSpaces()), -1, "tile can't move back to origin");
  });

  test('Issue #8', function () {
    // TO DO: arrange to call main() from or after QUnit.reset(), so that the board will be reset and we could
    // use tileAt(4, 3) here.
    var t = tileAt(3, 3);
    move(t, 3, 5);
    equal($.inArray(t.origin, t.legalSpaces()), 0, "tile can move back to origin");
  });

  test('Issue #12', function () {
    var tiles = game.makeTiles(tileData);
    ok(_.every(tiles, function (tile) { return tile.letter !== ' '; }), 'game has no blank tiles');
  });
});
