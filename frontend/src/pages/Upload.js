import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, Image, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';

function Upload({ socket }) {
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('cameraId', 1); // Câmera padrão para upload manual

      const response = await axios.post('/api/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadResult({
        success: false,
        error: error.response?.data?.error || 'Erro ao processar imagem'
      });
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const resetUpload = () => {
    setUploadResult(null);
    setPreview(null);
    setLoading(false);
  };

  const ResultCard = ({ result }) => {
    if (!result) return null;

    const isAlert = result.alert;
    const isSuccess = result.success;

    return (
      <div className={`mt-6 p-6 rounded-lg border-l-4 ${
        !isSuccess 
          ? 'bg-red-50 border-red-500'
          : isAlert 
            ? 'bg-red-50 border-red-500'
            : 'bg-green-50 border-green-500'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {!isSuccess ? (
              <AlertTriangle className="text-red-500" size={24} />
            ) : isAlert ? (
              <AlertTriangle className="text-red-500 animate-pulse" size={24} />
            ) : (
              <CheckCircle className="text-green-500" size={24} />
            )}
          </div>
          
          <div className="ml-4 flex-1">
            {!isSuccess ? (
              <div>
                <h3 className="text-lg font-medium text-red-900">Erro no Processamento</h3>
                <p className="text-red-700 mt-1">{result.error}</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-medium ${isAlert ? 'text-red-900' : 'text-green-900'}`}>
                    Placa Detectada: <span className="plate-number">{result.plate}</span>
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {result.confidence?.toFixed(1)}% confiança
                  </span>
                </div>

                {isAlert && result.monitoredPlate && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="text-red-500 mr-2 animate-pulse" size={20} />
                      <h4 className="font-semibold text-red-900">
                        🚨 ALERTA: {result.monitoredPlate.status.toUpperCase()}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Descrição:</span>
                        <p className="text-gray-600">{result.monitoredPlate.description}</p>
                      </div>
                      
                      {result.monitoredPlate.owner_name && (
                        <div>
                          <span className="font-medium text-gray-700">Proprietário:</span>
                          <p className="text-gray-600">{result.monitoredPlate.owner_name}</p>
                        </div>
                      )}
                      
                      {result.monitoredPlate.vehicle_model && (
                        <div>
                          <span className="font-medium text-gray-700">Veículo:</span>
                          <p className="text-gray-600">
                            {result.monitoredPlate.vehicle_model} - {result.monitoredPlate.vehicle_color || 'Cor não informada'}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">Adicionado em:</span>
                        <p className="text-gray-600">
                          {new Date(result.monitoredPlate.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Data da análise:</span>
                    {new Date().toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">ID da detecção:</span>
                    #{result.detection?.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Upload de Imagem</h1>
        {(uploadResult || preview) && (
          <button
            onClick={resetUpload}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Nova Análise
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={loading} />
            
            <div className="flex flex-col items-center">
              {loading ? (
                <>
                  <Loader className="animate-spin text-blue-500" size={48} />
                  <p className="mt-4 text-lg font-medium text-gray-700">
                    Processando imagem...
                  </p>
                  <p className="text-gray-500">Reconhecendo placa na imagem</p>
                </>
              ) : (
                <>
                  <UploadIcon className="text-gray-400" size={48} />
                  <p className="mt-4 text-lg font-medium text-gray-700">
                    {isDragActive ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                  </p>
                  <p className="text-gray-500">PNG, JPG, GIF até 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 Dicas para melhor reconhecimento:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use imagens com boa iluminação</li>
              <li>• A placa deve estar visível e nítida</li>
              <li>• Evite imagens muito distantes ou desfocadas</li>
              <li>• Formatos suportados: JPG, PNG, GIF</li>
            </ul>
          </div>
        </div>

        {/* Preview e Resultado */}
        <div className="space-y-4">
          {preview && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Image className="mr-2" size={20} />
                Imagem Carregada
              </h3>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg"
              />
            </div>
          )}

          <ResultCard result={uploadResult} />
        </div>
      </div>
    </div>
  );
}

export default Upload;