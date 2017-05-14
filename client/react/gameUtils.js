import { toArr } from './jsUtils';

function isSolved(grid, solution) {
  let ans = 0;
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (solution[r][c] !== '.' && grid[r][c].value !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

function isGridFilled(grid) {
  for (var r = 0; r < grid.length; r += 1) {
    for (var c = 0; c < grid[r].length; c += 1) {
      if (!grid[r][c].black && grid[r][c].value === '') {
        return false;
      }
    }
  }
  return true;
}

function getNextCell(grid, r, c, direction) {
  if (direction === 'across') {
    c += 1;
  } else {
    r += 1;
  }

  if (isInBounds(grid, r, c) && isWhite(grid, r, c)) {
    return { r, c };
  } else {
    return undefined;
  }
}

function getNextEmptyCellAfter(grid, r, c, direction) {
  if (direction === 'across') {
    c += 1;
  } else {
    r += 1;
  }
  while (isInBounds(grid, r, c) && isWhite(grid, r, c)) {
    if (!isFilled(grid, r, c)) {
      return { r, c };
    } else {
      if (direction === 'across') {
        c += 1;
      } else {
        r += 1;
      }
    }
  }
  return undefined;
}


function getNextEmptyCell(grid, r, c, direction) {
  while (isInBounds(grid, r, c) && isWhite(grid, r, c)) {
    if (!isFilled(grid, r, c)) {
      return { r, c };
    } else {
      if (direction === 'across') {
        c += 1;
      } else {
        r += 1;
      }
    }
  }
  return undefined;
}

function hasEmptyCells(grid, r, c, direction) {
  return getNextEmptyCell(grid, r, c, direction) !== undefined;
}

function getCellByNumber(grid, number) {
  for (var r = 0; r < grid.length; r += 1) {
    for (var c = 0; c < grid[r].length; c += 1) {
      if (isWhite(grid, r, c) && !grid[r][c].parents) {
        console.log({r, c}, 'blank');
      }
      if (grid[r][c].number === number) {
        return { r, c };
      }
    }
  }
}


function fixSelect({r, c}, grid) {
  while (!isWhite(grid, r, c)) {
    if (c < grid[r].length) {
      c += 1;
    } else {
      r += 1;
      c = 0;
    }
  }
  return {r, c};
}

function getOppositeDirection(direction) {
  return {
    'across': 'down',
    'down': 'across'
  }[direction];
}

function getParent(grid, r, c, direction) {
  return grid[r][c].parents[direction];
}

function isInBounds(grid, r, c) {
  return (
    r >= 0
    && c >= 0
    && r < grid.length
    && c < grid[r].length
  );
};

function isFilled(grid, r, c) {
  return grid[r][c].value !== '';
}

function isWhite(grid, r, c) {
  return !grid[r][c].black;
};

function isStartOfClue(grid, r, c, dir) {
  if (!isWhite(grid, r, c)) return false;
  if (dir === 'across') {
    return !isInBounds(grid, r, c - 1) || !isWhite(grid, r, c - 1);
  } else if (dir === 'down') {
    return !isInBounds(grid, r - 1, c) || !isWhite(grid, r - 1, c);
  } else {
    throw new Error('invalid dir', dir);
  }
}

function assignNumbers(grid) {
  // assign numbers and parents
  let nextNumber = 1;
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!isWhite(grid, r, c)) return;
      if (isStartOfClue(grid, r, c, 'across') ||
        isStartOfClue(grid, r, c, 'down')) {
          cell.number = nextNumber;
          nextNumber += 1;
      }

      cell.parents = {
        across: isStartOfClue(grid, r, c, 'across') ? cell.number : grid[r][c - 1].parents.across,
        down: isStartOfClue(grid, r, c, 'down') ? cell.number : grid[r - 1][c].parents.down,
      };
    });
  });
  return grid;
}

function makeGrid(textGrid, fillWithSol) {
  const grid = assignNumbers(textGrid.map(row =>
    row.map(cell => ({
      black: cell === '.',
      edits: [],
      value: fillWithSol ? cell :  '',
      number: null
    }))
  ));
  return grid;
}


function alignClues(grid, clues) {
  const result = {
    across: [],
    down: []
  };
  grid.forEach(row => row.forEach(cell => {
    for (let dir of ['across', 'down']) {
      if (cell.parents && cell.parents[dir] === cell.number) {
        result[dir][cell.number] = (clues && clues[dir] && clues[dir][cell.number]) || '';
      }
    }
  }));

  return result;
}

function makeGame(gid, name, puzzle) {
  const grid = assignNumbers(makeGrid(puzzle.grid));
  const clues = alignClues(grid, puzzle.clues);
  const game = {
    gid: gid,
    name: name,
    info: puzzle.info,
    clues: clues,
    solution: puzzle.grid,
    pid: puzzle.pid || null,
    grid: grid,
    createTime: new Date().getTime(),
    startTime: null,
    chat: {
      users: [],
      messages: []
    },
  };
  return game;
}

export { isSolved, isGridFilled, getNextCell, getNextEmptyCellAfter, getNextEmptyCell, hasEmptyCells, isFilled, getCellByNumber, getOppositeDirection, getParent, isInBounds, isWhite, isStartOfClue, makeGame, assignNumbers, makeGrid, fixSelect, alignClues };

