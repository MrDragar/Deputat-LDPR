
import React from 'react';
import { CheckCircle, Edit } from 'lucide-react';

interface SuccessPageProps {
  onEdit: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ onEdit }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 text-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">Отчет успешно сформирован!</h1>

        <div className="my-8">
          <img
            src="images/sokol_ldpr_4.webp"
            alt="ЛДПР"
            className="max-w-sm w-full mx-auto rounded-lg"
          />
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-left">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Все введенные вами данные сохранены в вашем браузере. Если нужно будет внести изменения в отчёт, то нажмите на кнопку ниже
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="mt-10 px-8 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 w-full sm:w-auto mx-auto"
        >
          <Edit className="h-5 w-5" />
          Внести изменения
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;