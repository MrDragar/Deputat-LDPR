import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { RegistrationForm, Education, WorkExperience, ForeignLanguage, RussianFederationLanguage, SocialOrganization, OtherLink } from '../types';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import TextInput from '../components/ui/TextInput';
import TagList from '../components/ui/TagList';
import LanguageProficiency from '../components/ui/LanguageProficiency';
import {
  ArrowLeft, User, Mail, GraduationCap, Briefcase, Languages, Heart, Flag,
  Landmark, Activity, BookOpen, Lightbulb, FileText, Link2, Users
} from 'lucide-react';


const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className }) => {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {children ? (
        <div className="mt-1 text-base font-semibold text-gray-900">{children}</div>
      ) : (
        <p className="mt-1 text-base font-semibold text-gray-900 break-words">
          {(value !== null && value !== undefined && value !== '') ? value : '—'}
        </p>
      )}
    </div>
  );
};

const Section: React.FC<{ id: string; title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm scroll-mt-24">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
      <Icon className="h-6 w-6 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="grid grid-cols-1 gap-y-6">
      {children}
    </div>
  </section>
);

const FullWidthSection: React.FC<{ id: string; title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm scroll-mt-24">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <Icon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    {children}
  </section>
);

const ProseItem: React.FC<{ label: string, text?: string | null }> = ({ label, text }) => {
    if (!text) return null;
    return (
        <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
            <div className="text-base text-gray-800 bg-slate-50 p-4 rounded-md border border-slate-200 prose">
                {text}
            </div>
        </div>
    );
};


const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchForm = async () => {
      try {
        setLoading(true);
        const data = await api.getFormById(id);
        setForm(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные анкеты.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const handleProcess = useCallback(async (status: boolean, message: string) => {
    if (!form?.user) return;
    setProcessing(true);
    try {
      await api.processForm(form.user, status, message);
      navigate('/applications');
    } catch (err) {
      setError('Ошибка при обработке анкеты.');
      console.error(err);
    } finally {
      setProcessing(false);
      setIsRejectModalOpen(false);
      setIsApproveModalOpen(false);
    }
  }, [form, navigate]);
  
  const handleApprove = useCallback(() => handleProcess(true, 'Анкета одобрена'), [handleProcess]);
  const handleReject = useCallback(() => { if (rejectionReason.trim()) handleProcess(false, rejectionReason); }, [rejectionReason, handleProcess]);
  
  const handleRejectionReasonChange = useCallback((_: string, val: string) => {
    setRejectionReason(val);
  }, []);

  const openRejectModal = useCallback(() => setIsRejectModalOpen(true), []);
  const closeRejectModal = useCallback(() => setIsRejectModalOpen(false), []);
  const openApproveModal = useCallback(() => setIsApproveModalOpen(true), []);
  const closeApproveModal = useCallback(() => setIsApproveModalOpen(false), []);

  const renderChildIcons = (maleCount: number | null, femaleCount: number | null) => {
    const mCount = maleCount || 0;
    const fCount = femaleCount || 0;
    if (mCount === 0 && fCount === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={`Мальчиков: ${mCount}, Девочек: ${fCount}`}>
            {Array.from({ length: mCount }).map((_, i) => <User key={`m-${i}`} className="h-5 w-5 text-sky-500" aria-hidden="true" />)}
            {Array.from({ length: fCount }).map((_, i) => <User key={`f-${i}`} className="h-5 w-5 text-pink-500" aria-hidden="true" />)}
        </div>
    );
  };

  if (loading) return <div className="p-6 text-center">Загрузка данных анкеты...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!form) return <div className="p-6 text-center">Анкета не найдена.</div>;
  
  const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.trim();

  return (
    <div className="max-w-4xl mx-auto">
        <Link to="/applications" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft size={16} />
            Вернуться к списку заявок
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                <p className="mt-1 text-gray-500">Анкета кандидата от {new Date(form.createdAt).toLocaleDateString('ru-RU')}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={openRejectModal} disabled={processing} className="px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Отклонить
                </button>
                <button onClick={openApproveModal} disabled={processing} className="px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                {processing ? 'Обработка...' : 'Одобрить'}
                </button>
            </div>
        </div>
        
        <main className="space-y-8">
            <Section id="personal-info" title="Основная информация" icon={User}>
                <DetailItem label="ФИО" value={fullName} />
                <DetailItem label="Дата рождения" value={form.birthDate} />
                <DetailItem label="Пол" value={form.gender} />
                <DetailItem label="Регион" value={form.region} />
            </Section>

            <Section id="contact-info" title="Контактная информация" icon={Mail}>
                <DetailItem label="Телефон" children={<a href={`tel:${form.phone}`} className="text-blue-600 hover:underline">{form.phone}</a>} />
                <DetailItem label="Email" children={<a href={`mailto:${form.email}`} className="text-blue-600 hover:underline">{form.email}</a>} />
                <DetailItem label="Страница ВКонтакте" children={<a href={form.vkPage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{form.vkPage}</a>} />
                {form.vkGroup && <DetailItem label="Сообщество ВКонтакте" children={<a href={form.vkGroup} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{form.vkGroup}</a>} />}
                {form.telegramChannel && <DetailItem label="Telegram канал" children={<a href={form.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{form.telegramChannel}</a>} />}
                {form.personalSite && <DetailItem label="Персональный сайт" children={<a href={form.personalSite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{form.personalSite}</a>} />}
                {form.otherLinks && form.otherLinks.length > 0 && (
                  <DetailItem label="Другие ссылки">
                      <ul className="list-none space-y-2 mt-1">
                      {form.otherLinks.map((link: OtherLink) => <li key={link.id}><a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline break-all"><Link2 size={14}/><span>{link.url}</span></a></li>)}
                      </ul>
                  </DetailItem>
                )}
            </Section>
            
            <FullWidthSection id="education" title="Образование" icon={GraduationCap}>
                {form.education && form.education.length > 0 ? (
                    <div className="space-y-4">
                        {form.education.map((edu: Education, index: number) => (
                            <div key={edu.id} className="p-4 border rounded-lg">
                                <h3 className="font-bold text-gray-800 text-lg mb-4">Образование #{index + 1}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                    <DetailItem label="Уровень" value={edu.level} />
                                    <DetailItem label="Организация" value={edu.organization} />
                                    {edu.hasPostgraduate === 'Да' && <>
                                        <DetailItem label="Послевузовское образование" value={edu.postgraduateType} />
                                        <DetailItem label="Научное учреждение" value={edu.postgraduateOrganization} />
                                    </>}
                                    {edu.hasDegree === 'Да' && <DetailItem label="Ученая степень" value={edu.degreeType} />}
                                    {edu.hasTitle === 'Да' && <DetailItem label="Ученое звание" value={edu.titleType} />}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500">Нет данных</p>}
            </FullWidthSection>
            
            <FullWidthSection id="work-experience" title="Опыт работы" icon={Briefcase}>
                {form.workExperience && form.workExperience.length > 0 ? (
                     <div className="space-y-4">
                        {form.workExperience.map((work: WorkExperience, index: number) => (
                            <div key={work.id} className="p-4 border rounded-lg">
                                <h3 className="font-bold text-gray-800 text-lg mb-4">Место работы #{index + 1}</h3>
                                <div className="grid grid-cols-1 gap-y-4">
                                    <DetailItem label="Организация" value={work.organization} />
                                    <DetailItem label="Должность" value={work.position} />
                                    <DetailItem label="Начало работы" value={work.startDate} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500">Нет данных</p>}
            </FullWidthSection>

            <FullWidthSection id="languages" title="Владение языками" icon={Languages}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-4">Иностранные языки</p>
                        {form.foreignLanguages && form.foreignLanguages.length > 0 ? 
                            <div className="flex flex-col gap-4">
                                {form.foreignLanguages.map((l: ForeignLanguage) => (
                                    <LanguageProficiency key={l.id} name={l.name} level={l.level} />
                                ))}
                            </div> 
                            : '—'}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-4">Языки народов РФ</p>
                        {form.russianFederationLanguages && form.russianFederationLanguages.length > 0 ? 
                            <div className="flex flex-col gap-4">
                                {form.russianFederationLanguages.map((l: RussianFederationLanguage) => (
                                    <LanguageProficiency key={l.id} name={l.name} level={l.level} />
                                ))}
                            </div> 
                            : '—'}
                    </div>
                </div>
            </FullWidthSection>

            <Section id="family" title="Семья" icon={Heart}>
                <DetailItem label="Семейное положение" value={form.maritalStatus} />
                 {form.childrenCount > 0 ? (
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Всего детей</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <div className="relative group">
                                    <div className="flex items-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg cursor-default">
                                        <Users className="h-5 w-5" />
                                        <span className="text-xl font-bold">{form.childrenCount}</span>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 text-left">
                                        Мальчиков: {form.childrenMaleCount || 0}, Девочек: {form.childrenFemaleCount || 0}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                    </div>
                                </div>
                                {renderChildIcons(form.childrenMaleCount, form.childrenFemaleCount)}
                            </div>
                        </div>
                        {form.underageChildrenCount > 0 && (
                             <div>
                                <p className="text-sm font-medium text-gray-500">Из них несовершеннолетних</p>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                    <div className="relative group">
                                        <div className="flex items-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg cursor-default">
                                            <Users className="h-5 w-5" />
                                            <span className="text-xl font-bold">{form.underageChildrenCount}</span>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 text-left">
                                            Мальчиков: {form.underageChildrenMaleCount || 0}, Девочек: {form.underageChildrenFemaleCount || 0}
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                        </div>
                                    </div>
                                    {renderChildIcons(form.underageChildrenMaleCount, form.underageChildrenFemaleCount)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <DetailItem label="Количество детей" value={form.childrenCount} />
                )}
            </Section>
            
            <Section id="party-activity" title="Партийная деятельность" icon={Flag}>
                <DetailItem label="Стаж в партии (лет)" value={form.partyExperience} />
                <DetailItem label="Должность в партии" value={form.partyPosition} />
                <DetailItem label="Должность в рег. отделении" value={form.partyRole} />
            </Section>
            
            <FullWidthSection id="social-activity" title="Общественная деятельность" icon={Landmark}>
                <div className="grid grid-cols-1 gap-y-6">
                    <DetailItem label="Наименование представительного органа" value={form.representativeBodyName} />
                    <DetailItem label="Уровень представительного органа" value={form.representativeBodyLevel} />
                    <DetailItem label="Должность в представительном органе" value={form.representativeBodyPosition} />
                    <DetailItem label="Название комиссии/комитета" value={form.committeeName} />
                    <DetailItem label="Статус в комиссии/комитете" value={form.committeeStatus} />
                </div>
                 {form.socialOrganizations && form.socialOrganizations.length > 0 && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-gray-500 mb-2">Общественные организации</p>
                       <div className="space-y-3">
                           {form.socialOrganizations.map((org: SocialOrganization) => (
                               <div key={org.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                                   <div>
                                       <h4 className="font-semibold text-gray-800 text-base">{org.name}</h4>
                                       <div className="mt-1 space-y-1">
                                           <p className="text-sm text-gray-600"><span className="font-medium text-gray-500">Должность:</span> {org.position}</p>
                                           <p className="text-sm text-gray-600"><span className="font-medium text-gray-500">Годы:</span> {org.years}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}
            </FullWidthSection>

            <FullWidthSection id="professional-activity" title="Профессиональная деятельность" icon={Activity}>
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Сферы деятельности</p>
                        <TagList tags={form.professionalSphere} />
                    </div>
                    {form.awards && (
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Награды</p>
                            <p className="text-base text-gray-900">{form.awards}</p>
                        </div>
                    )}
                </div>
            </FullWidthSection>
            
            <FullWidthSection id="hobbies" title="Увлечения и интересы" icon={BookOpen}>
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Спорт</p>
                        <TagList tags={form.sports} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Активный отдых</p>
                        <TagList tags={form.recreation} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Хобби</p>
                        <TagList tags={form.hobbies} />
                    </div>
                </div>
            </FullWidthSection>

            <FullWidthSection id="feedback" title="Обратная связь" icon={Lightbulb}>
                 <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Используемые ресурсы ЛДПР</p>
                        <TagList tags={form.ldprResources} />
                    </div>
                     <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Недостающие знания</p>
                        <TagList tags={form.knowledgeGaps} />
                    </div>
                    {form.centralOfficeAssistant && (
                         <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Отмеченные сотрудники ЦА</p>
                            <p className="text-base text-gray-900">{form.centralOfficeAssistant}</p>
                        </div>
                    )}
                </div>
            </FullWidthSection>
            
            <FullWidthSection id="additional-info" title="Дополнительная информация" icon={FileText}>
                <div className="space-y-6">
                   <ProseItem label="Дополнительная информация" text={form.additionalInfo} />
                   <ProseItem label="Предложения по улучшению работы" text={form.suggestions} />
                   <ProseItem label="Таланты" text={form.talents} />
                   <ProseItem label="Готов поделиться знаниями" text={form.knowledgeToShare} />
                   <ProseItem label="Суперсила" text={form.superpower} />
                </div>
            </FullWidthSection>

            <ConfirmationModal
                isOpen={isRejectModalOpen}
                onClose={closeRejectModal}
                onConfirm={handleReject}
                title="Отклонить заявку?"
                confirmButtonVariant="danger"
                confirmButtonText="Отклонить"
            >
                <p className="mb-4">Пожалуйста, укажите причину отклонения заявки. Это сообщение будет отправлено кандидату.</p>
                <TextInput 
                  name="rejectionReason"
                  type="textarea"
                  value={rejectionReason}
                  onChange={handleRejectionReasonChange}
                  placeholder="Причина отклонения..."
                  required
                />
            </ConfirmationModal>
            
            <ConfirmationModal
                isOpen={isApproveModalOpen}
                onClose={closeApproveModal}
                onConfirm={handleApprove}
                title="Одобрить заявку?"
                confirmButtonVariant="success"
                confirmButtonText="Одобрить"
            >
                <p className="mb-4 text-sm">Вы уверены, что хотите одобрить анкету кандидата? Пожалуйста, проверьте данные перед подтверждением.</p>
                <div className="p-4 border rounded-lg bg-slate-50 space-y-3 text-sm text-left">
                    <DetailItem label="ФИО" value={fullName} />
                    <DetailItem label="Дата рождения" value={form.birthDate} />
                    <DetailItem label="Пол" value={form.gender} />
                    <DetailItem label="Регион" value={form.region} />
                    <DetailItem label="Должность в рег. отделении" value={form.partyRole} />
                    <DetailItem label="Уровень представительного органа" value={form.representativeBodyLevel} />
                </div>
            </ConfirmationModal>
        </main>
    </div>
  );
};

export default ApplicationDetailPage;