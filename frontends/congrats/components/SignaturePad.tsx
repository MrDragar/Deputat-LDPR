
import React, { useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, Upload, Download } from 'lucide-react';

interface SignaturePadProps {
  value: string | null; // data URL of an SVG
  onChange: (signatureData: string | null) => void;
}

// Helper to get content from inside an <svg> tag.
const getSvgContent = (svgData: string): string => {
  try {
    let svgString = svgData;
    if (svgData.startsWith('data:image/svg+xml;base64,')) {
      svgString = atob(svgData.split(',')[1]);
    } else if (svgData.startsWith('data:image/svg+xml,')) {
      svgString = decodeURIComponent(svgData.split(',')[1]);
    }

    const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    return contentMatch ? contentMatch[1].trim() : '';
  } catch (error) {
    console.error("Error parsing SVG content:", error);
    return '';
  }
};

const AnySignatureCanvas = SignatureCanvas as any;

const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvas = (): HTMLCanvasElement | null => (sigCanvas.current as any)?.getCanvas();

  // Resize the canvas to fit its container.
  useLayoutEffect(() => {
    const canvas = getCanvas();
    if (!containerRef.current || !canvas) return;

    const resizeCanvas = () => {
      const { width } = containerRef.current!.getBoundingClientRect();
      if (canvas.width !== width) {
        canvas.width = width;
        canvas.height = width; // Keep it square
        sigCanvas.current?.clear();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Clear canvas whenever the base signature changes.
  useEffect(() => {
    sigCanvas.current?.clear();
  }, [value]);

  const handleEndDrawing = useCallback(() => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return;
    }

    const newDrawingDataUrl = sigCanvas.current.toDataURL('image/svg+xml');
    
    const newDrawingContent = getSvgContent(newDrawingDataUrl);
    if (!newDrawingContent) return;

    const canvas = getCanvas();
    if (!canvas) return;
    const { width: canvasWidth, height: canvasHeight } = canvas;
    
    let finalSvgString: string;

    if (value) {
      // Merge new drawing with the existing signature
      try {
        const baseSvgString = atob(value.split(',')[1]);
        const closingTagIndex = baseSvgString.lastIndexOf('</svg>');
        
        // Default to a 1:1 transform if no viewBox is found
        let transformedContent = newDrawingContent;

        // Find viewBox to calculate the correct transform for the new paths
        const viewBoxMatch = baseSvgString.match(/viewBox="([\d\s\.-]+)"/);
        if (viewBoxMatch && viewBoxMatch[1]) {
            const [vx, vy, vw, vh] = viewBoxMatch[1].split(' ').map(parseFloat);
            const scaleX = vw / canvasWidth;
            const scaleY = vh / canvasHeight;

            // This transform scales the new drawing from canvas coordinates to the SVG's viewBox coordinates.
            transformedContent = `<g transform="matrix(${scaleX} 0 0 ${scaleY} ${vx} ${vy})">${newDrawingContent}</g>`;
        }
        
        if (closingTagIndex !== -1) {
            finalSvgString = 
                baseSvgString.slice(0, closingTagIndex) + 
                transformedContent + 
                baseSvgString.slice(closingTagIndex);
        } else { // Fallback for malformed base SVG
            finalSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${newDrawingContent}</svg>`;
        }
      } catch (e) {
        console.error("Failed to merge SVGs:", e);
        finalSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${newDrawingContent}</svg>`;
      }
    } else {
      // Create a new signature from scratch
      finalSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${newDrawingContent}</svg>`;
    }

    const finalSvgDataUrl = `data:image/svg+xml;base64,${btoa(finalSvgString)}`;
    onChange(finalSvgDataUrl);

  }, [onChange, value]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Пожалуйста, загрузите файл в формате SVG.");
    }
    if (e.target) e.target.value = '';
  };

  const handleDownload = () => {
    if (value) {
      const link = document.createElement('a');
      link.href = value;
      link.download = 'signature.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClear = () => {
    onChange(null); // Triggers useEffect to clear canvas
  };

  const ToolButton: React.FC<{ icon: React.ElementType, onClick: () => void, label: string, disabled?: boolean }> =
    ({ icon: Icon, onClick, label, disabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="p-3 rounded-lg transition-colors duration-200 bg-gray-100 text-gray-600 enabled:hover:bg-brand-secondary enabled:hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon size={20} />
    </button>
  );

  return (
    <div className="flex flex-col gap-4 items-start w-full">
      <label className="block text-sm font-medium text-gray-500">Подпись</label>
      <div 
        ref={containerRef} 
        className="relative w-full max-w-md aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden"
      >
        {value && (
          <img 
            src={value} 
            alt="Текущая подпись"
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
            aria-hidden="true"
          />
        )}
        <AnySignatureCanvas
            ref={sigCanvas}
            penColor="#1E40AF" // brand-primary
            canvasProps={{ className: 'relative w-full h-full bg-transparent' }}
            onEnd={handleEndDrawing}
        />
      </div>
      <div className="flex flex-row gap-3 self-start">
        <ToolButton icon={Trash2} onClick={handleClear} label="Очистить" disabled={!value}/>
        <ToolButton icon={Download} onClick={handleDownload} label="Скачать SVG" disabled={!value}/>
        <ToolButton icon={Upload} onClick={() => uploadInputRef.current?.click()} label="Загрузить SVG"/>
      </div>
      <input type="file" ref={uploadInputRef} onChange={handleFileUpload} accept="image/svg+xml" className="hidden"/>
    </div>
  );
};

export default SignaturePad;
