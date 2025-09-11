import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, APIError } from '../services/api';
import { RegistrationForm } from '../types';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ui/ConfirmationModal';
import TextInput from './ui/TextInput';

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => {
  if (!value && !children) return null;
  return (
    <div className="py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || children}</dd>
    </div>
  );
};

const TagList: React.FC<{ items?: string[]; title: string }> = ({ items, title }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="py-3">
      <dt className="text-sm font-medium text-gray-500 mb-2">{title}</dt>
      <dd className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={index} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">{item}</span>
        ))}
      </dd>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">{title}</h3>
        <dl className="divide-y divide-gray-200">{children}</dl>
    </div>
);


const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchForm = async () => {
      try {
        const data = await api.getFormById(id);
        setForm(data);
      } catch (err) {
        if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
          logout();
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [id, logout]);

  const handleProcessForm = async (status: boolean, message: string) => {
    if (!form?.user) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
        await api.processForm(form.user, status, message);
        navigate('/');
    } catch (err) {
        if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
          logout();
        } else {
          setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred during submission.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleConfirmApproval = () => handleProcessForm(true, '');
  
  const handleConfirmDecline = () => {
    if (!declineReason.trim()) {
        setSubmitError("Причина отклонения обязательна.");
        return;
    }
    handleProcessForm(false, declineReason);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">{error}</div>;
  if (!form) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">Form not found.</div>;

  const fullName = `${form.lastName} ${form.firstName} ${form.middleName}`;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Section title="Personal Information">
                        <DetailItem label="Full Name" value={fullName} />
                        <DetailItem label="Date of Birth" value={new Date(form.birthDate).toLocaleDateString()} />
                        <DetailItem label="Gender" value={form.gender} />
                        <DetailItem label="Region" value={form.region} />
                        <DetailItem label="Marital Status" value={form.maritalStatus} />
                    </Section>
                    
                    <Section title="Contact & Socials">
                        <DetailItem label="Phone" value={form.phone} />
                        <DetailItem label="Email" value={form.email} />
                        <DetailItem label="VK Page" value={form.vkPage} />
                        <DetailItem label="VK Group" value={form.vkGroup} />
                        <DetailItem label="Telegram" value={form.telegramChannel} />
                        <DetailItem label="Personal Site" value={form.personalSite} />
                    </Section>

                    <Section title="Party & Political Experience">
                        <DetailItem label="Party Experience (years)" value={form.partyExperience} />
                        <DetailItem label="Party Position" value={form.partyPosition} />
                        <DetailItem label="Party Role" value={form.partyRole} />
                        <DetailItem label="Representative Body" value={`${form.representativeBodyName} (${form.representativeBodyLevel})`} />
                        <DetailItem label="Position in Body" value={form.representativeBodyPosition} />
                        <DetailItem label="Committee" value={`${form.committeeName} (${form.committeeStatus})`} />
                    </Section>

                     {form.education && form.education.length > 0 && (
                        <Section title="Education">
                            {form.education.map(edu => (
                                <div key={edu.id} className="py-3">
                                    <p className="font-semibold text-gray-900">{edu.level} - {edu.organization}</p>
                                    {edu.hasDegree === 'Да' && <p className="text-sm text-gray-700">{edu.degreeType}</p>}
                                    {edu.hasTitle === 'Да' && <p className="text-sm text-gray-700">{edu.titleType}</p>}
                                </div>
                            ))}
                        </Section>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <Section title="Additional Info">
                        <TagList title="Professional Spheres" items={form.professionalSphere} />
                        <TagList title="Sports" items={form.sports} />
                        <TagList title="Hobbies" items={form.hobbies} />
                        <TagList title="Recreation" items={form.recreation} />
                        <DetailItem label="Awards" value={form.awards} />
                        <DetailItem label="Superpower" value={form.superpower} />
                        <DetailItem label="Talents" value={form.talents} />
                    </Section>

                    <div className="sticky top-20">
                      <Section title="Actions">
                          <div className="flex space-x-4">
                              <button onClick={() => setIsApproveModalOpen(true)} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50">Approve</button>
                              <button onClick={() => setIsDeclineModalOpen(true)} disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50">Decline</button>
                          </div>
                          {isSubmitting && <div className="mt-4"><Spinner /></div>}
                      </Section>
                    </div>
                </div>
            </div>
        </div>

        <ConfirmationModal
            isOpen={isApproveModalOpen}
            onClose={() => setIsApproveModalOpen(false)}
            onConfirm={handleConfirmApproval}
            title="Подтверждение одобрения"
        >
            <p>Вы уверены, что хотите одобрить эту заявку?</p>
        </ConfirmationModal>

        <ConfirmationModal
            isOpen={isDeclineModalOpen}
            onClose={() => setIsDeclineModalOpen(false)}
            onConfirm={handleConfirmDecline}
            title="Подтверждение отклонения"
        >
            <div className="space-y-4">
                <p>Пожалуйста, укажите причину отклонения. Это сообщение будет отправлено кандидату.</p>
                 <TextInput
                    label="Причина отклонения (обязательно)"
                    name="declineReason"
                    type="textarea"
                    value={declineReason}
                    onChange={(_, val) => {
                      setDeclineReason(val);
                      if (submitError) setSubmitError(null);
                    }}
                    required
                    error={submitError || undefined}
                />
            </div>
        </ConfirmationModal>
    </div>
  );
};

export default DetailPage;