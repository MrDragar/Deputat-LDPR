import React from 'react';
import { Hammer, Zap } from 'lucide-react';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">

        {/* Icon Header */}
        <div className="relative inline-block mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full shadow-lg">
                <Hammer className="h-10 w-10 text-white" />
            </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Рабочий стол депутата ЛДПР
        </h1>

        <div className="flex items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500 text-white shadow-sm">
                <Zap className="h-4 w-4 fill-white text-white" />
                Ведутся технические работы
            </span>
        </div>

        <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto">
          Мы обновляем этот раздел, чтобы сделать его максимально удобным и эффективным для вашей работы.

        </p>

        <div className="pt-8 border-t border-gray-100">
             <p className="text-sm text-gray-400">
                Благодарим за понимание. Все остальные разделы платформы работают в штатном режиме.
            </p>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
