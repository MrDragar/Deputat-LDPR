
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { UI_COLORS } from '../constants';

const data = [
    { name: 'Предоставили отчет', value: 50 },
    { name: 'Не предоставили', value: 39 },
];

const COLORS = [UI_COLORS.secondary, UI_COLORS.chartGray];

export const ReportStatusChart: React.FC = () => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] col-span-1">
            <h2 className="text-lg font-semibold text-brand-on-surface-primary">Статус отчетов</h2>
            <p className="text-sm text-brand-on-surface-secondary mb-4">Соотношение РО, предоставивших и не предоставивших отчеты</p>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '14px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
