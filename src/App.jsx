import React, { useState } from 'react';
import GridCanvas from './components/GridCanvas';
import { GridworldEnv } from './engine/GridworldEnv';
import { DoubleQLearningAgent } from './engine/DoubleQLearning';
import { ValueIteration } from './engine/ValueIteration';
import LearningChart from './components/LearningChart';

const env = new GridworldEnv();
const agent = new DoubleQLearningAgent(env, 0.1, 0.9, 0.15);

// Chạy Value Iteration 1 lần duy nhất để lấy V* và Q* chính xác
const vi = new ValueIteration(env, 0.9);
const exactValues = vi.run();
const vStarStart = exactValues.V[env.start.row][env.start.col];

// Hàm phụ trợ tính trung bình sai số tuyệt đối |Q - Q*|
const calculateMeanError = (agentCombinedQ, exactQMatrix) => {
  let totalError = 0;
  let count = 0;
  for (let r = 0; r < env.rows; r++) {
    for (let c = 0; c < env.cols; c++) {
      if (env.isTerminal({row: r, col: c}) || env.isWall({row: r, col: c})) continue;
      
      const qHocDuoc = agentCombinedQ({row: r, col: c});
      const qTuyetDoi = exactQMatrix[r][c];
      
      ['up', 'right', 'down', 'left'].forEach(a => {
        totalError += Math.abs(qHocDuoc[a] - qTuyetDoi[a]);
        count++;
      });
    }
  }
  return totalError / count;
};

function App() {
  const [agentPos, setAgentPos] = useState(env.start);
  const [activeTable, setActiveTable] = useState('avg');
  const [lastLog, setLastLog] = useState('Sẵn sàng chạy mô phỏng.');
  const [episodesCount, setEpisodesCount] = useState(0);
  const [testStats, setTestStats] = useState(null);
  const [history, setHistory] = useState([
    { episode: 0, maxQStart: 0, vStarStart: vStarStart, meanError: calculateMeanError(agent.getCombinedQ.bind(agent), exactValues.Q) }
  ]);
  const [useRewardNoise, setUseRewardNoise] = useState(false);
  const [lastActionInfo, setLastActionInfo] = useState(null);


  const getRenderQTable = (tableType) => {
    const renderTable = [];
    for (let r = 0; r < env.rows; r++) {
      const row = [];
      for (let c = 0; c < env.cols; c++) {
        let type = 'normal';
        if (r === 1 && c === 1) type = 'wall';
        else if (r === 0 && c === 3) type = 'goal';
        else if (r === 1 && c === 3) type = 'trap';

        let qValues = { up: 0, right: 0, down: 0, left: 0 };
        if (type === 'normal') {
          if (tableType === 'qA') qValues = { ...agent.qA[r][c] };
          else if (tableType === 'qB') qValues = { ...agent.qB[r][c] };
          else qValues = agent.getCombinedQ({ row: r, col: c });
        }

        row.push({ type, qValues });
      }
      renderTable.push(row);
    }
    return renderTable;
  };

  const [qTableRender, setQTableRender] = useState(getRenderQTable('avg'));

  const updateUI = (newPos, tableType = activeTable) => {
    setAgentPos(newPos);
    setQTableRender(getRenderQTable(tableType));
  };

  const handleNextStep = () => {
    const result = agent.step(agentPos);
    
    // Lưu lại thông tin hành động để Canvas vẽ mũi tên và báo "Bị trượt"
    setLastActionInfo({
      action: result.action,
      actualAction: result.actualAction,
      slipped: result.slipped
    });

    if (result.isTerminal) {
      setLastLog(`Chạm đích/bẫy (Reward: ${result.reward}). Đã đưa Robot về góc xuất phát.`);
      updateUI(env.start);
      setEpisodesCount(prev => prev + 1);
      setTimeout(() => setLastActionInfo(null), 1000); // Xóa mũi tên sau 1 giây
    } else {
      const slipText = result.slipped ? ` ⚠️ Trượt sang [${result.actualAction}]!` : '';
      setLastLog(`Hành động chọn: ${result.action}${slipText} | Reward: ${result.reward}`);
      updateUI(result.nextState);
    }
  };
  
  const handleToggleNoise = (e) => {
    const isChecked = e.target.checked;
    setUseRewardNoise(isChecked);
    env.useRewardNoise = isChecked;
    setLastLog(isChecked ? 'Đã BẬT nhiễu phần thưởng.' : 'Đã TẮT nhiễu phần thưởng.');
  };

  const handleTestMode = () => {
    let wins = 0, traps = 0, totalSteps = 0, totalReturn = 0;
    const testEpisodes = 1000;

    for (let i = 0; i < testEpisodes; i++) {
      let currState = env.start;
      let stepCount = 0;
      let episodeReturn = 0;
      while (!env.isTerminal(currState) && stepCount < 200) {
        const combinedQ = agent.getCombinedQ(currState);
        const bestAction = agent.getArgMaxAction(combinedQ);
        const res = env.step(currState, bestAction);
        currState = res.nextState;
        episodeReturn += res.reward;
        stepCount++;
        if (res.isTerminal) {
          if (res.reward > 0) wins++; else traps++;
        }
      }
      totalSteps += stepCount;
      totalReturn += episodeReturn;
    }

    setTestStats({
      winRate: (wins / testEpisodes * 100).toFixed(1),
      trapRate: (traps / testEpisodes * 100).toFixed(1),
      avgReturn: (totalReturn / testEpisodes).toFixed(3),
      avgSteps: (totalSteps / testEpisodes).toFixed(1)
    });
    setLastLog('Đã chạy xong 1000 episodes ở Test Mode (Chỉ khai thác Greedy).');
  };

  const handleShowOptimal = () => {
    const vi = new ValueIteration(env);
    const { Q } = vi.run();
    const renderTable = [];
    for (let r = 0; r < env.rows; r++) {
      const row = [];
      for (let c = 0; c < env.cols; c++) {
        let type = 'normal';
        if (r === 1 && c === 1) type = 'wall';
        else if (r === 0 && c === 3) type = 'goal';
        else if (r === 1 && c === 3) type = 'trap';
        
        row.push({ type, qValues: type === 'normal' ? Q[r][c] : { up: 0, right: 0, down: 0, left: 0 } });
      }
      renderTable.push(row);
    }
    setQTableRender(renderTable);
    setActiveTable('optimal');
    setLastLog('Đang hiển thị mốc Q* tối ưu tính từ phương trình Bellman (Value Iteration).');
  };

  const handleTrainEpisodes = (numEpisodes = 100) => {
    for (let ep = 0; ep < numEpisodes; ep++) {
      let currPos = env.start;
      let stepCount = 0;
      while (!env.isTerminal(currPos) && stepCount < 100) {
        const res = agent.step(currPos);
        currPos = res.nextState;
        stepCount++;
      }
    }
    
    const newEps = episodesCount + numEpisodes;
    setEpisodesCount(newEps);
    setLastLog(`Đã huấn luyện nhanh thêm ${numEpisodes} episodes!`);
    updateUI(env.start);
  
    // Lưu lịch sử để vẽ Chart
    const qStart = agent.getCombinedQ(env.start);
    const maxQAtStart = Math.max(...Object.values(qStart));
    const meanErr = calculateMeanError(agent.getCombinedQ.bind(agent), exactValues.Q);
    
    setHistory(prev => [
      ...prev, 
      { episode: newEps, maxQStart: maxQAtStart, vStarStart: vStarStart, meanError: meanErr }
    ]);
  };

  const handleReset = () => {
    agent.reset();
    setEpisodesCount(0);
    setLastLog('Đã xóa trắng ma trận Q-table về 0.');
    updateUI(env.start);
    setHistory([{ episode: 0, maxQStart: 0, vStarStart: vStarStart, meanError: calculateMeanError(agent.getCombinedQ.bind(agent), exactValues.Q) }]);
    setTestStats(null);
  };

  const handleViewChange = (type) => {
    setActiveTable(type);
    updateUI(agentPos, type);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '850px', margin: '0 auto' }}>
      <h2>Stochastic Gridworld - Double Q-Learning Demo</h2>
      
      {/* Tính năng Nhiễu */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ cursor: 'pointer', fontWeight: 'bold', color: '#FF9800' }}>
          <input type="checkbox" checked={useRewardNoise} onChange={handleToggleNoise} style={{ marginRight: '8px' }} />
          Bật nhiễu Reward (Mô phỏng sai số môi trường)
        </label>
      </div>

      {/* Thanh nút công cụ */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button onClick={handleNextStep} style={btnStyle('#2196F3')}>Step (1 bước)</button>
        <button onClick={() => handleTrainEpisodes(100)} style={btnStyle('#4CAF50')}>Train 100 Episodes</button>
        <button onClick={handleReset} style={btnStyle('#f44336')}>Reset Q-Table</button>
        <button onClick={handleTestMode} style={btnStyle('#9C27B0')}>Chạy Test 1000 Eps</button>
        <button onClick={handleShowOptimal} style={btnStyle('#607D8B')}>Xem mốc Q* (Value Iteration)</button>
      </div>

      {/* Tabs xem ma trận Q */}
      <div style={{ marginBottom: '15px' }}>
        <span>Hiển thị bảng Q: </span>
        {['avg', 'qA', 'qB'].map(type => (
          <button 
            key={type} 
            onClick={() => handleViewChange(type)}
            style={{ 
              marginRight: '8px', 
              fontWeight: activeTable === type ? 'bold' : 'normal',
              background: activeTable === type ? '#333' : '#fff',
              color: activeTable === type ? '#fff' : '#333',
              border: '1px solid #ccc',
              padding: '4px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {type === 'avg' ? 'Q Trung bình' : type === 'qA' ? 'Bảng Q_A' : 'Bảng Q_B'}
          </button>
        ))}
        {activeTable === 'optimal' && <span style={{ color: '#e91e63', fontWeight: 'bold', marginLeft: '10px' }}>Đang xem Q*</span>}
      </div>

      <GridCanvas 
        qTable={qTableRender} 
        agentPos={agentPos} 
        gridSize={{ rows: 3, cols: 4 }} 
        cellSize={120} 
        lastActionInfo={lastActionInfo} // Truyền dữ liệu mũi tên
      />
      <GridCanvas 
        qTable={qTableRender} 
        agentPos={agentPos} 
        gridSize={{ rows: 3, cols: 4 }} 
        cellSize={120} 
        lastActionInfo={lastActionInfo} 
      />

      {/* Biểu đồ phân tích hội tụ */}
      <LearningChart historyData={history} />
      {/* Khu vực Bảng Thống Kê Test Mode */}
      {testStats && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#ffe0b2', borderRadius: '4px', border: '1px solid #ffb74d' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#e65100' }}>📊 Báo cáo Thống kê Test Mode (1000 lượt chạy Greedy)</h4>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0 }}><strong>Tỉ lệ vào Đích (+1):</strong> {testStats.winRate}%</p>
            <p style={{ margin: 0 }}><strong>Tỉ lệ vào Bẫy (-1):</strong> {testStats.trapRate}%</p>
            <p style={{ margin: 0 }}><strong>Thưởng TB / lượt:</strong> {testStats.avgReturn}</p>
            <p style={{ margin: 0 }}><strong>Số bước TB / lượt:</strong> {testStats.avgSteps}</p>
          </div>
        </div>
      )}

      {/* Nhật ký hệ thống */}
      <div style={{ marginTop: '15px', padding: '12px', background: '#eef', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 5px 0' }}><strong>Tổng Episode đã học:</strong> {episodesCount}</p>
        <p style={{ margin: 0 }}><strong>Nhật ký trạng thái:</strong> {lastLog}</p>
      </div>
    </div>
  );
}

const btnStyle = (bg) => ({
  padding: '8px 16px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
});

export default App;