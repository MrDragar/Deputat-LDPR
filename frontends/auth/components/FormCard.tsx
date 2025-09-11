import React from 'react';
import { Link } from 'react-router-dom';
import { RegistrationForm } from '../types';

interface FormCardProps {
  form: RegistrationForm;
}

const FormCard: React.FC<FormCardProps> = ({ form }) => {
  const fullName = `${form.lastName} ${form.firstName} ${form.middleName}`;
  const creationDate = new Date(form.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link to={`/form/${form.user}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-5 h-full flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500 transform hover:-translate-y-1">
        <div>
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{fullName}</h3>
            <p className="text-sm text-gray-600 mt-1">{form.region}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500">Created: {creationDate}</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
    </Link>
  );
};

export default FormCard;