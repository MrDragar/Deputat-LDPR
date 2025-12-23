// StandaloneApp.tsx (микрофронтенда) - ДЛЯ STANDALONE
import React, { useEffect, useState } from 'react';
import { RemoteDataProvider } from './context/RemoteDataContext';
import RegistrationPage from './pages/RegistrationPage';
import { User } from './types';

export const StandaloneApp: React.FC = () => {
    const [mockUserData, setMockUserData] = useState<User | null>(null);

    useEffect(() => {
        console.log('Standalone режим: создаём заглушку');

        const mockData: User = {
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
                representativeBodyName: 'Государственная Дума',
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
                education: [],
                workExperience: [],
                foreignLanguages: [],
                russianFederationLanguages: [],
                socialOrganizations: []
            }
        };

        // Устанавливаем данные в window для контекста
        (window as any).__REMOTE_DATA__ = { userData: mockData };
        setMockUserData(mockData);

    }, []);

    // Показываем индикатор загрузки, пока данные не готовы
    if (!mockUserData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <RemoteDataProvider userData={mockUserData}>
            <RegistrationPage />
        </RemoteDataProvider>
    );
};
export default StandaloneApp;