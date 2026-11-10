import { ACTIONS } from './GridworldEnv';

export class ValueIteration {
  constructor(env, gamma = 0.9, theta = 1e-4) {
    this.env = env;
    this.gamma = gamma;
    this.theta = theta;
    this.V = this.createEmptyGrid();
    this.Q = this.createEmptyQGrid();
  }

  createEmptyGrid() {
    return Array.from({ length: this.env.rows }, () => Array(this.env.cols).fill(0));
  }

  createEmptyQGrid() {
    const qGrid = [];
    for (let r = 0; r < this.env.rows; r++) {
      const row = [];
      for (let c = 0; c < this.env.cols; c++) {
        row.push({ up: 0, right: 0, down: 0, left: 0 });
      }
      qGrid.push(row);
    }
    return qGrid;
  }

  run() {
    let isConverged = false;
    while (!isConverged) {
      let delta = 0;
      let newV = this.createEmptyGrid();

      for (let r = 0; r < this.env.rows; r++) {
        for (let c = 0; c < this.env.cols; c++) {
          let state = { row: r, col: c };
          if (this.env.isTerminal(state) || this.env.isWall(state)) continue;

          let maxActionVal = -Infinity;
          
          for (let action of ACTIONS) {
            let expectedValue = 0;
            const actionIndex = ACTIONS.indexOf(action);
            
            const transitions = [
              { a: action, prob: 0.8 },
              { a: ACTIONS[(actionIndex + 3) % 4], prob: 0.1 },
              { a: ACTIONS[(actionIndex + 1) % 4], prob: 0.1 }
            ];

            for (let trans of transitions) {
              let nextState = this.env.getNextState(state, trans.a);
              let reward = this.env.stepPenalty;
              
              if (nextState.row === this.env.goal.row && nextState.col === this.env.goal.col) reward = 1.0;
              else if (nextState.row === this.env.trap.row && nextState.col === this.env.trap.col) reward = -1.0;

              let nextVal = this.env.isTerminal(nextState) ? 0 : this.V[nextState.row][nextState.col];
              expectedValue += trans.prob * (reward + this.gamma * nextVal);
            }
            
            this.Q[r][c][action] = expectedValue;
            if (expectedValue > maxActionVal) maxActionVal = expectedValue;
          }
          
          newV[r][c] = maxActionVal;
          delta = Math.max(delta, Math.abs(this.V[r][c] - newV[r][c]));
        }
      }
      this.V = newV;
      if (delta < this.theta) isConverged = true;
    }
    return { V: this.V, Q: this.Q };
  }
}