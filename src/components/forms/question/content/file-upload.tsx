
import React, { useState } from "react";
import { ContentComponentProps } from "../types";
import { FileUp } from "lucide-react";

export const FileUpload: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [maxFileSize, setMaxFileSize] = useState<number>(question.maxFileSize || 2);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setFileError("Tipo de archivo no permitido. Solo se aceptan PDF, JPG o PNG.");
      e.target.value = "";
      return;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setFileError(`El archivo excede el tamaño máximo de ${maxFileSize}MB.`);
      e.target.value = "";
      return;
    }
    
    setSelectedFile(file);
  };

  if (readOnly) {
    return (
      <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <FileUp size={24} className="mb-2" />
          <p>Clic para adjuntar archivo</p>
          <p className="text-xs mt-1">PDF, JPG o PNG (máx. {question.maxFileSize || 2}MB)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="border border-dashed border-gray-300 hover:border-gray-400 transition-colors rounded-md p-6 cursor-pointer bg-gray-50 text-center">
        <label htmlFor={`file-upload-${question.id}`} className="cursor-pointer flex flex-col items-center">
          <FileUp size={24} className="mb-2 text-gray-500" />
          <span className="text-sm text-gray-700 mb-1">
            Clic para seleccionar un archivo
          </span>
          <span className="text-xs text-gray-500">
            PDF, JPG o PNG (máx. {maxFileSize}MB)
          </span>
          <input
            id={`file-upload-${question.id}`}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />
        </label>
        {selectedFile && (
          <div className="mt-3 text-sm text-left flex items-center justify-between bg-blue-50 p-2 rounded">
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
            </span>
          </div>
        )}
        {fileError && (
          <div className="mt-2 text-xs text-red-500">{fileError}</div>
        )}
      </div>
      <div className="flex items-center">
        <span className="mr-3 text-sm text-gray-600">Tamaño máximo (MB):</span>
        <input
          type="number"
          value={maxFileSize}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setMaxFileSize(value > 0 ? value : 1);
            onUpdate({ maxFileSize: value > 0 ? value : 1 });
          }}
          min="1"
          max="10"
          className="w-20 border border-gray-300 rounded-md p-1 text-sm"
        />
      </div>
    </div>
  );
};
