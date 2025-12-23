import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Gift, Settings } from 'lucide-react';
import IconButton from '../ui/IconButton';


interface HolidayListProps {
  holidays: string[];
  date: Date;
  showEdit?: boolean;
  dateString?: string;
}

const HolidayList: React.FC<HolidayListProps> = ({ holidays, date, showEdit = false, dateString }) => {
  const datePart = format(date, 'd MMMM', { locale: ru });
  const dayPart = format(date, 'EEEE', { locale: ru });

  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {datePart}, {dayPart.toLowerCase()}
        </h2>
        {showEdit && dateString && (
          <Link to={`/federal-plan/edit/${dateString}`}>
            <IconButton
              icon={Settings}
              aria-label="Редактировать дату"
              className="bg-slate-100 text-slate-600 hover:bg-slate-200"
            />
          </Link>
        )}
      </div>
      
      {holidays.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {holidays.map((holiday, index) => (
              <div key={index} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] flex items-start gap-3">
                  <Gift className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 flex-1 leading-snug break-words">{holiday}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayList;