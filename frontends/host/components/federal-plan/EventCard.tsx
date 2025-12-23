import React from 'react';
import type { PlanEvent } from '../../data/federalPlanData';
import { eventCategoryConfig } from '../../data/federalPlanData';
import { Zap } from 'lucide-react';

interface EventCardProps {
  event: PlanEvent;
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    return (
        <div className="py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 mt-1 whitespace-pre-line leading-snug break-words">{value}</p>
        </div>
    );
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { colors: style } = eventCategoryConfig[event.category];
  const detailsToShow = Object.entries(event.details)
    .filter(([, value]) => !!value);

  return (
    <div className="bg-white rounded-lg shadow-sm w-full transition-all hover:shadow-md overflow-hidden flex flex-col">
      <div className={`p-4 ${style.bg} text-white flex flex-col`}>
        <div className="flex-grow">
            <div className="flex justify-between items-start gap-2">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{event.theme}</p>
                {event.isInfostrike && (
                    <div className={`flex-shrink-0 flex items-center gap-1 bg-white ${style.text} text-xs font-bold px-2 py-0.5 rounded-full`}>
                        <Zap className="h-3 w-3" />
                        <span>ИНФОУДАР</span>
                    </div>
                )}
            </div>
            <h4 className="font-bold mt-2 leading-snug break-words">{event.title}</h4>
        </div>
      </div>
      
      {detailsToShow.length > 0 && (
         <div className="bg-white px-4 flex-1">
            <div className="divide-y divide-gray-200">
                {detailsToShow.map(([key, value]) => (
                    <DetailItem 
                        key={key} 
                        label={key} 
                        value={value!} 
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default EventCard;