import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, Legend } from 'recharts';
import { UI_COLORS } from '../constants';

const data = [{ name: 'Вовлеченность', value: 85, fill: UI_COLORS.secondary }];
const engagementCategories = [
    { value: 'Все (66%-100%)', type: 'circle', id: 'c1', color: UI_COLORS.positive },
    { value: 'Частично (34%-65%)', type: 'circle', id: 'c2', color: UI_COLORS.chartBlue },
    { value: 'Низкий/Отсутствует (0%-33%)', type: 'circle', id: 'c3', color: UI_COLORS.negative },
]

export const EngagementChart: React.FC = () => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold text-brand-on-surface-primary">Вовлеченность депутатов</h2>
            <p className="text-sm text-brand-on-surface-secondary mb-4">Процент вовлеченных в прием от числа взаимодействующих</p>
             <div className="grid grid-cols-2" style={{ height: 250 }}>
                 <div className="w-full h-full relative">
                    <ResponsiveContainer>
                        <RadialBarChart
                            innerRadius="70%"
                            outerRadius="90%"
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                            barSize={20}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                // FIX: Removed invalid 'clockwise' prop which was causing a TypeScript error.
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-brand-on-surface-primary">85%</span>
                    </div>
                </div>
                <div className="flex flex-col justify-center pl-8">
                    <h3 className="font-semibold mb-2">Категории вовлеченности:</h3>
                    <ul className="space-y-2">
                        {engagementCategories.map(item => (
                             <li key={item.id} className="flex items-center text-sm">
                                <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: item.color}}></span>
                                {item.value}
                            </li>
                        ))}
                    </ul>
                </div>
             </div>
        </div>
    );
};
