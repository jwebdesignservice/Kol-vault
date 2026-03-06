'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  positive?: boolean
}

export function Sparkline({ data, positive }: SparklineProps) {
  const chartData = data.map((v) => ({ v }))
  const trend = data[data.length - 1] > data[0]
  const color = positive !== undefined ? (positive ? '#22D3A0' : '#FF4466') : trend ? '#22D3A0' : '#FF4466'

  return (
    <div style={{ width: 60, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
