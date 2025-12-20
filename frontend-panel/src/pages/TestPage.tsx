import React, { useState, useEffect } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import api from '../config/api';

export const TestPage: React.FC = () => {
  const [message, setMessage] = useState('Página de prueba cargada');
  const [apiStatus, setApiStatus] = useState('No probado');

  const testAPI = async () => {
    try {
      setApiStatus('Probando...');
      const response = await api.get('/health');
      setApiStatus(`✅ API OK: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      setApiStatus(`❌ API Error: ${error.message}`);
    }
  };

  useEffect(() => {
    setMessage('Componente React funcionando correctamente');
  }, []);

  return (
    <Box p={6}>
      <VStack spacing={4} align="start">
        <Text fontSize="2xl" fontWeight="bold">
          Página de Prueba
        </Text>
        
        <Text color="green.500">
          {message}
        </Text>
        
        <Button onClick={testAPI} colorScheme="blue">
          Probar API
        </Button>
        
        <Text>
          Estado API: {apiStatus}
        </Text>
        
        <Text fontSize="sm" color="gray.500">
          Si ves este texto, React está funcionando correctamente.
        </Text>
      </VStack>
    </Box>
  );
};

export default TestPage;