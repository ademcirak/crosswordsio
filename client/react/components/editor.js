import './editor.css';

import Grid from './grid';
import GridControls from './gridControls';
import React, { Component } from 'react';
import EditableSpan from '../components/editableSpan';

import { isGridFilled, getNextCell, getNextEmptyCell, getNextEmptyCellAfter, hasEmptyCells, isFilled, getCellByNumber, getOppositeDirection, getParent, isInBounds, isWhite, isStartOfClue, assignNumbers, makeGrid, fixSelect, alignClues } from '../gameUtils';

window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };


/*
 * Summary of Editor component
 *
 * Props: { grid, clues, updateGrid, updateClues }
 *
 * State: { selected, direction }
 *
 * Children: [ GridControls, Grid, EditableClues ]
 * - GridControls.props:
 *   - attributes: { selected, direction, grid, clues }
 *   - callbacks: { setSelected, setDirection }
 * - Grid.props:
 *   - attributes: { grid, selected, direction }
 *   - callbacks: { setSelected, changeDirection }
 * - EditableClues.props:
 *   - attributes: { getClueList(), selected, halfSelected }
 *   - callbacks: { selectClue }
 *
 * Potential parents (so far):
 * - Compose
 **/


export default class Editor extends Component {
  constructor(props) {
    super();
    const grid = makeGrid(props.grid, true);
    const clues = alignClues(grid, props.clues);
    this.state = {
      selected: fixSelect({
        r: 0,
        c: 0
      }, grid),
      clues: clues,
      direction: 'across',
      grid: grid
    };

    // for deferring scroll-to-clue actions
    this.prvNum = {};
    this.prvIdleID = {};
  }

  didChangePatternOrDims(oldGrid, newGrid) {
    if (oldGrid.length !== newGrid.length || oldGrid[0].length !== newGrid[0].length) {
      return true;
    }

    let result = false;
    oldGrid.forEach((row, r) => {
      if (result) return;
      row.forEach((cell, c) => {
        if ((cell.black) !== (newGrid[r][c] === '.')) {
          result = true;
        }
      });
    });

    return result;
  }

  componentWillReceiveProps(props) {
    let grid, clues, selected;
    if (props.pid !== this.props.pid || this.didChangePatternOrDims(this.state.grid, props.grid)) {
      grid = makeGrid(props.grid, true);
      clues = alignClues(grid, props.clues);
      selected = fixSelect(this.state.selected, grid);
    } else {
      grid = this.state.grid;
      clues = this.state.clues;
      grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          cell.value = props.grid[r][c];
        });
      });

      clues.across.forEach((clue, i) => {
        clues.across[i] = (props.clues && props.clues.across && props.clues.across[i]) || '';
      });
      clues.down.forEach((clue, i) => {
        clues.down[i] = (props.clues && props.clues.down && props.clues.down[i]) || '';
      });
      selected = this.state.selected;
    }
    this.setState({
      grid: grid,
      clues: clues,
      selected: selected
    });
  }

  /* Callback fns, to be passed to child components */

  setDirection(direction) {
    this.setState({
      direction: direction
    });
  }

  setSelected(selected) {
    this.setState({
      selected: selected
    });
  }

  changeDirection() {
    this.setDirection(getOppositeDirection(this.state.direction));
  }

  selectClue(direction, number) {
    this.refs.gridControls.selectClue(direction, number);
  }

  /* Helper functions used when rendering */

  getClueBarAbbreviation() {
    return this.getSelectedClueNumber() + this.state.direction.substr(0, 1).toUpperCase();
  }

  getSelectedClueNumber() {
    return getParent(this.state.grid, this.state.selected.r, this.state.selected.c, this.state.direction);
  }

  getHalfSelectedClueNumber() {
    return getParent(this.state.grid, this.state.selected.r, this.state.selected.c, getOppositeDirection(this.state.direction));
  }

  isClueFilled(direction, number) {
    const clueRoot = getCellByNumber(this.state.grid, number);
    return !hasEmptyCells(this.state.grid, clueRoot.r, clueRoot.c, direction);
  }

  isClueSelected(direction, number) {
    return direction === this.state.direction && number === this.getSelectedClueNumber();
  }

  isClueHalfSelected(direction, number) {
    return direction !== this.state.direction && number === this.getHalfSelectedClueNumber();
  }

  isHighlighted(r, c) {
    return this.refs.grid.isHighlighted(r, c);
  }

  isSelected(r, c) {
    return this.refs.grid.isSelected(r, c);
  }

  /* Public functions, called by parent components */

  getAllSquares() {
    let result = [];
    this.state.grid.forEach((row, r) => {
      result = result.concat(row.map((cell, c) => ({
        r: r,
        c: c
      })));
    });
    return result;
  }

  getSelectedAndHighlightedSquares() {
    return this.getAllSquares().filter(({r, c}) => this.isSelected(r, c) || this.isHighlighted(r, c));
  }

  getSelectedSquares() {
    return this.getAllSquares().filter(({r, c}) => this.isSelected(r, c));
  }

  /* Misc functions */

  // Interacts directly with the DOM
  // Very slow -- use with care
  scrollToClue(dir, num, el) {
    if (el && this.prvNum[dir] !== num) {
      this.prvNum[dir] = num;
      if (this.prvIdleID[dir]) {
        cancelIdleCallback(this.prvIdleID[dir]);
      }
      this.prvIdleID[dir] = requestIdleCallback(() => {
        if (this.clueScroll === el.offsetTop) return;
        const parent = el.offsetParent;
        parent.scrollTop = el.offsetTop - (parent.offsetHeight * .4);
        this.clueScroll = el.offsetTop;
      });
    }
  }

  focusGrid() {
    this.refs.gridControls && this.refs.gridControls.focus();
  }

  focusClue() {
    this.refs.clue && this.refs.clue.focus();
  }

  /* Render */

  render() {
    return (
      <div className='editor--main--wrapper'>
        <div className='editor--main'>
          <div className='editor--main--left'>
            <div className='editor--main--clue-bar'>
              <div className='editor--main--clue-bar--number'>
                { this.getClueBarAbbreviation() }
              </div>
              <div className='editor--main--clue-bar--text'>
                {
                  this.state.editingClue
                    ? (
                      <div className='editor--main--clue-bar--text--edit'>
                        <input
                          ref='clue'
                          onChange={(e) => this.props.updateClues(this.state.direction, this.getSelectedClueNumber(), e.target.value)}
                          value={ this.state.clues[this.state.direction][this.getSelectedClueNumber()] }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              this.setState({ editingClue: false});
                              this.focusGrid();
                            }
                          }}
                        />
                        <i
                          className='fa fa-check-square-o'
                          onClick={() => this.setState({ editingClue: false })}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    )
                    : (
                      <div className='editor--main--clue-bar--text--val'>
                        <span>{ this.state.clues[this.state.direction][this.getSelectedClueNumber()] }
                        </span>
                        <i
                          className='fa fa-pencil-square-o'
                          onClick={() => this.setState({ editingClue: true })}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    )
                }
              </div>
            </div>

            <GridControls
              ref='gridControls'
              selected={this.state.selected}
              direction={this.state.direction}
              onSetDirection={this.setDirection.bind(this)}
              onSetSelected={this.setSelected.bind(this)}
              onEnter={() => this.setState({ editingClue: true }, this.focusClue.bind(this))}
              updateGrid={this.props.updateGrid}
              grid={this.state.grid}
              clues={this.state.clues}
            >
              <div
                className={'editor--main--left--grid'}>
                <Grid
                  ref='grid'
                  size={this.props.size}
                  grid={this.state.grid}
                  selected={this.state.selected}
                  direction={this.state.direction}
                  onSetSelected={this.setSelected.bind(this)}
                  onChangeDirection={this.changeDirection.bind(this)}
                  canFlipColor={true}
                  onFlipColor={this.props.onFlipColor.bind(this)}
                />
              </div>
            </GridControls>
          </div>

          <div className='editor--main--clues'>
            {
              // Clues component
              ['across', 'down'].map((dir, i) => (
                <div key={i} className='editor--main--clues--list'>
                  <div className='editor--main--clues--list--title'>
                    {dir.toUpperCase()}
                  </div>

                  <div
                    className={'editor--main--clues--list--scroll ' + dir}
                    ref={'clues--list--'+dir}>
                    {
                      this.state.clues[dir].map((clue, i) => clue !== undefined && (
                        <div key={i}
                          className={
                            (this.isClueSelected(dir, i)
                              ? 'selected '
                              : ' ')
                              + 'editor--main--clues--list--scroll--clue'
                          }
                          ref={
                            (this.isClueSelected(dir, i) ||
                              this.isClueHalfSelected(dir, i))
                              ? this.scrollToClue.bind(this, dir, i)
                              : null
                          }
                          onClick={this.selectClue.bind(this, dir, i)}>
                          <div className='editor--main--clues--list--scroll--clue--number'>
                            {i}
                          </div>
                          <div className='editor--main--clues--list--scroll--clue--text'>
                            {clue}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}