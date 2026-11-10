export const ACTIONS = ['up', 'right', 'down', 'left'];

export class GridworldEnv {
  constructor(rows = 3, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    this.wall = { row: 1, col: 1 };
    this.goal = { row: 0, col: 3 };
    this.trap = { row: 1, col: 3 };
    this.start = { row: 2, col: 0 };
    this.stepPenalty = -0.04;
    this.useRewardNoise = false;
  }

  isTerminal(state) {
    return (state.row === this.goal.row && state.col === this.goal.col) ||
           (state.row === this.trap.row && state.col === this.trap.col);
  }

  isWall(state) {
    return state.row === this.wall.row && state.col === this.wall.col;
  }

  isValid(state) {
    return state.row >= 0 && state.row < this.rows &&
           state.col >= 0 && state.col < this.cols &&
           !this.isWall(state);
  }

  getNextState(state, action) {
    let next = { ...state };
    if (action === 'up') next.row -= 1;
    else if (action === 'down') next.row += 1;
    else if (action === 'left') next.col -= 1;
    else if (action === 'right') next.col += 1;

    return this.isValid(next) ? next : { ...state };
  }

  step(state, action) {
    if (this.isTerminal(state)) {
      return { nextState: state, reward: 0, isTerminal: true, actualAction: action, slipped: false };
    }

    // Xử lý động học ngẫu nhiên: 80% đúng hướng, 10% trượt trái, 10% trượt phải
    const rand = Math.random();
    let actualAction = action;
    const actionIndex = ACTIONS.indexOf(action);

    if (rand < 0.8) {
      actualAction = action;
    } else if (rand < 0.9) {
      actualAction = ACTIONS[(actionIndex + 3) % 4]; // Trượt vuông góc bên trái
    } else {
      actualAction = ACTIONS[(actionIndex + 1) % 4]; // Trượt vuông góc bên phải
    }

    const nextState = this.getNextState(state, actualAction);
    let reward = this.stepPenalty;

    if (nextState.row === this.goal.row && nextState.col === this.goal.col) {
      reward = 1.0;
    } else if (nextState.row === this.trap.row && nextState.col === this.trap.col) {
      reward = -1.0;
    }
    // CHÈN THÊM KHỐI LỆNH NÀY VÀO TRƯỚC RETURN:
    if (this.useRewardNoise && !this.isTerminal(nextState)) {
      reward += (Math.random() * 0.1 - 0.05);
    }
    return {
      nextState,
      reward,
      isTerminal: this.isTerminal(nextState),
      actualAction,
      slipped: actualAction !== action
    };
  }
}