import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LearningChart = ({ historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
      {/* Biểu đồ 1: Sự hội tụ của Q về V* */}
      <div style={{ flex: 1, minWidth: '350px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>📈 Hội tụ của max Q(start) về V*</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="episode" label={{ value: 'Episodes', position: 'insideBottomRight', offset: -5 }} />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="maxQStart" stroke="#2196F3" name="max Q(start, a)" strokeWidth={2} dot={false} />
            <Line type="stepAfter" dataKey="vStarStart" stroke="#4CAF50" name="V*(start)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Biểu đồ 2: Sai số tuyệt đối trung bình (Mean Error) */}
      <div style={{ flex: 1, minWidth: '350px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>📉 Sai số tuyệt đối trung bình |Q - Q*|</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="episode" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="meanError" stroke="#f44336" name="Mean Absolute Error" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LearningChart;