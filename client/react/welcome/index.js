import './style.css';
import Admin from '../upload/index'
import nameGenerator from './nameGenerator';

import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import actions, { db } from '../actions';

export default class Welcome extends Component {
  constructor() {
    super();
    this.state = {
      gameList: [],
      puzzleList: [],
      name: nameGenerator(),
    };
    this.gameListRef = db.ref('gamelist');
    this.puzzleListRef = db.ref('puzzlelist');
  }

  componentDidMount() {
    this.gameListRef.on('value', this.updateGameList.bind(this));
    this.puzzleListRef.on('value', this.updatePuzzleList.bind(this));
  }

  componentWillUnmount() {
    this.gameListRef.off();
    this.puzzleListRef.off();
  }

  updateGameList(gameList) {
    this.setState({ gameList: Object.values(gameList.val() || {} )});
  }

  updatePuzzleList(puzzleList) {
    this.setState({ puzzleList: Object.values(puzzleList.val() || {}) }, () => {
      if (!this.state.pid && this.state.puzzleList.length > 0) {
        this.setState({ pid: this.state.puzzleList[0].pid });
      }
    });
  }

  prevent(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  handleNameChange(ev) {
    this.setState({ name: ev.target.value });
  }

  handleEmojiClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({ name: nameGenerator() });
  }

  handleStartClick(ev) {
    if (!this.state.pid) return;
    const gid = actions.createGame({
      name: this.state.name,
      pid: this.state.pid
    }, gid => {
      this.props.history.push(`/game/${gid}`);
    });
  }

  handleSelectChange(ev) {
    this.setState({ pid: ev.target.value });
  }

  render() {
    return (
      <div className='welcome'>
        <div className='welcome--browse'>
          <div className='welcome--browse--title'>
            Browse Puzzles
          </div>
          <div className='welcome--browse--puzzlelist'>
            {
              this.state.puzzleList.slice().reverse().map((entry, i) =>
                <Link key={i} to={'/puzzle/' + entry.pid} style={{ textDecoration: 'none', color: 'black' }}>
                  <div className='welcome--browse--puzzlelist--entry'>
                    <div>
                      {entry.title + (entry.author ? (' by ' + entry.author) : '') }
                    </div>
                  </div>
                </Link>
              )
            }
          </div>
        </div>
        <div className='welcome--upload'>
          <div className='welcome--upload--title'>
            Upload Puzzles
          </div>
          <Admin history={this.props.history}/>
        </div>
      </div>
    );
  }
}

