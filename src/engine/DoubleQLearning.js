import { ACTIONS } from './GridworldEnv';

export class DoubleQLearningAgent {
  constructor(env, alpha = 0.1, gamma = 0.9, epsilon = 0.15) {
    this.env = env;
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.qA = this.createEmptyQTable();
    this.qB = this.createEmptyQTable();
  }

  createEmptyQTable() {
    const table = [];
    for (let r = 0; r < this.env.rows; r++) {
      const row = [];
      for (let c = 0; c < this.env.cols; c++) {
        row.push({ up: 0, right: 0, down: 0, left: 0 });
      }
      table.push(row);
    }
    return table;
  }

  reset() {
    this.qA = this.createEmptyQTable();
    this.qB = this.createEmptyQTable();
  }

  getCombinedQ(state) {
    const qA = this.qA[state.row][state.col];
    const qB = this.qB[state.row][state.col];
    const combined = {};
    ACTIONS.forEach(a => {
      combined[a] = (qA[a] + qB[a]) / 2;
    });
    return combined;
  }

  chooseAction(state) {
    // Chiến lược Exploration: Epsilon-Greedy dựa trên giá trị Q trung bình
    if (Math.random() < this.epsilon) {
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    }
    const combinedQ = this.getCombinedQ(state);
    let bestActions = [ACTIONS[0]];
    let maxQ = combinedQ[ACTIONS[0]];

    for (let i = 1; i < ACTIONS.length; i++) {
      const a = ACTIONS[i];
      if (combinedQ[a] > maxQ) {
        maxQ = combinedQ[a];
        bestActions = [a];
      } else if (combinedQ[a] === maxQ) {
        bestActions.push(a);
      }
    }
    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }

  step(currentState) {
    if (this.env.isTerminal(currentState)) {
      return { nextState: this.env.start, reward: 0, isTerminal: true, action: null, slipped: false };
    }

    const action = this.chooseAction(currentState);
    const { nextState, reward, isTerminal, actualAction, slipped } = this.env.step(currentState, action);

    const s = currentState;
    const sNext = nextState;

    // Tung đồng xu 50/50 để quyết định cập nhật ma trận A hay B
    if (Math.random() < 0.5) {
      // Chọn hành động tốt nhất dựa trên Q_A, nhưng lấy giá trị ước lượng từ Q_B
      const bestA = this.getArgMaxAction(this.qA[sNext.row][sNext.col]);
      const target = isTerminal ? reward : reward + this.gamma * this.qB[sNext.row][sNext.col][bestA];
      this.qA[s.row][s.col][action] += this.alpha * (target - this.qA[s.row][s.col][action]);
    } else {
      // Chọn hành động tốt nhất dựa trên Q_B, nhưng lấy giá trị ước lượng từ Q_A
      const bestB = this.getArgMaxAction(this.qB[sNext.row][sNext.col]);
      const target = isTerminal ? reward : reward + this.gamma * this.qA[sNext.row][sNext.col][bestB];
      this.qB[s.row][s.col][action] += this.alpha * (target - this.qB[s.row][s.col][action]);
    }

    return { nextState, reward, isTerminal, action, actualAction, slipped };
  }

  getArgMaxAction(qValues) {
    let best = ACTIONS[0];
    let maxVal = qValues[ACTIONS[0]];
    for (let i = 1; i < ACTIONS.length; i++) {
      const a = ACTIONS[i];
      if (qValues[a] > maxVal) {
        maxVal = qValues[a];
        best = a;
      }
    }
    return best;
  }
}