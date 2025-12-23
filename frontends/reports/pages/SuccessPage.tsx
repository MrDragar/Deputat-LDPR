// SuccessPage.tsx
import React, { useState } from 'react';
import { CheckCircle, Edit, Download, FileText, RefreshCw } from 'lucide-react';

interface SuccessPageProps {
  onEdit: () => void;
  pdfUrl?: string | null;
  onDownloadPdf?: (url: string) => Promise<void>;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ 
  onEdit, 
  pdfUrl, 
  onDownloadPdf 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!pdfUrl || !onDownloadPdf) return;
    
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      await onDownloadPdf(pdfUrl);
    } catch (error: any) {
      setDownloadError(error.message || 'Ошибка скачивания');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJSON = () => {
    const data = window.localStorage.getItem('ldpr_report_draft');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 text-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
          Отчет успешно сформирован!
        </h1>

        <div className="my-8">
          <img
            src="images/reposts/sokol_ldpr_4.webp"
            alt="ЛДПР"
            className="max-w-sm w-full mx-auto rounded-lg"
          />
        </div>

        {pdfUrl ? (
          <div className="mb-8">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg text-left mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>PDF отчёт готов!</strong> Файл был автоматически отправлен на скачивание.
                    Если скачивание не началось, нажмите кнопку ниже.
                  </p>
                </div>
              </div>
            </div>

            {downloadError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-left mb-6">
                <p className="text-sm text-red-700">{downloadError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition ${
                  isDownloading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Скачивание...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Скачать PDF
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <FileText className="h-5 w-5" />
                Скачать JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-left mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Все введенные вами данные сохранены в вашем браузере. 
                  Если нужно будет внести изменения в отчёт, нажмите на кнопку ниже.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={onEdit}
            className="w-full sm:w-auto px-8 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md border border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-5 w-5" />
            Заполнить новый отчёт
          </button>
        </div>

        {pdfUrl && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Ссылка на PDF:</strong>{' '}
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {pdfUrl}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;