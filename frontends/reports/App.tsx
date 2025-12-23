// App.tsx (микрофронтенда reports)
import React from 'react';
import { RemoteDataProvider, setRemoteDataFromHost } from './context/RemoteDataContext';
import RegistrationPage from './pages/RegistrationPage';
import { User } from './types';

// Тип пропсов для App
interface AppProps {
  userData?: User | null;
}

// Компонент для standalone режима
const StandaloneApp: React.FC = () => {
  // Заглушка для standalone режима
  const mockUserData: User = {
    userId: 1,
    login: 'test_user',
    isActive: true,
    role: 'deputy',
    dateJoined: '2024-01-01',
    lastLogin: '2024-12-05',
    deputyForm: {
      birthDate: '1985-05-15',
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: 'Иванович',
      gender: 'male',
      region: 'Москва',
      occupation: 'Депутат',
      phone: '+79991234567',
      email: 'ivanov@example.com',
      vkPage: 'https://vk.com/ivanov',
      vkGroup: '',
      telegramChannel: '',
      personalSite: '',
      maritalStatus: 'married',
      childrenCount: 2,
      childrenMaleCount: 1,
      childrenFemaleCount: 1,
      underageChildrenCount: 1,
      underageChildrenMaleCount: null,
      underageChildrenFemaleCount: null,
      partyExperience: 5,
      partyPosition: 'Депутат',
      partyRole: 'member',
      partyRoleOther: '',
      representativeBodyName: 'Госдума',
      representativeBodyLevel: 'federal',
      representativeBodyPosition: 'Депутат',
      committeeName: 'Комитет по бюджету',
      committeeStatus: 'member',
      professionalSphere: ['politics'],
      awards: 'Грамота за заслуги',
      sports: ['football'],
      sportsCustom: [],
      recreation: ['reading'],
      recreationCustom: [],
      hobbies: ['photography'],
      hobbiesCustom: [],
      ldprResources: ['website'],
      ldprResourcesCustom: [],
      centralOfficeAssistant: 'yes',
      knowledgeGaps: ['economics'],
      knowledgeGapsCustom: [],
      additionalInfo: 'Дополнительная информация',
      suggestions: 'Предложения',
      talents: 'Ораторское искусство',
      knowledgeToShare: 'Юриспруденция',
      superpower: 'Умение договариваться',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-12-05T15:30:00Z',
      otherLinks: [],
      education: [
        {
          id: 1,
          level: 'higher',
          organization: 'МГУ',
          specialty: 'Юриспруденция',
          hasPostgraduate: 'yes',
          postgraduateType: 'aspirantura',
          postgraduateOrganization: 'МГУ',
          hasDegree: 'yes',
          degreeType: 'candidate',
          hasTitle: 'no',
          titleType: ''
        }
      ],
      workExperience: [
        {
          id: 1,
          organization: 'Государственная Дума',
          position: 'Депутат',
          startDate: '2020-01-01'
        }
      ],
      foreignLanguages: [
        {
          id: 1,
          name: 'Английский',
          level: 'advanced'
        }
      ],
      russianFederationLanguages: [],
      socialOrganizations: [
        {
          id: 1,
          name: 'Ветераны Афганистана',
          position: 'Член совета',
          years: '5'
        }
      ]
    }
  };

  // Устанавливаем данные для standalone режима
  React.useEffect(() => {
    setRemoteDataFromHost({ userData: mockUserData });
  }, []);

  return (
    <RemoteDataProvider userData={mockUserData}>
      <RegistrationPage />
    </RemoteDataProvider>
  );
};

// Компонент для хоста (принимает пропсы)
const HostApp: React.FC<AppProps> = ({ userData }) => {
  // Устанавливаем данные при получении из хоста
  React.useEffect(() => {
    if (userData) {
      setRemoteDataFromHost({ userData });
    }
  }, [userData]);

  return (
    <RemoteDataProvider userData={userData}>
      <RegistrationPage />
    </RemoteDataProvider>
  );
};

// Основной App компонент
const App: React.FC<AppProps> = (props) => {
  // Проверяем, запущен ли standalone
  const isStandalone = !window.parent || window.parent === window;

  if (isStandalone) {
    return <StandaloneApp />;
  }

  return <HostApp {...props} />;
};

export default App;