import { useState, useEffect } from 'react';

export function useJsonStorage(initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al inicio desde Electron o Fallback web
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        if (window.electronAPI) {
          const data = await window.electronAPI.readData();
          if (isMounted) setStoredValue(data && data.length > 0 ? data : initialValue);
        } else {
          // Fallback para cuando se abre sólo la web sin Electron (desarrollo)
          const item = window.localStorage.getItem('anime_figures_sales');
          if (isMounted) setStoredValue(item ? JSON.parse(item) : initialValue);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMounted) setStoredValue(initialValue);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();

    return () => { isMounted = false; };
  }, []); // Dependencias vacías, sólo se ejecuta al montar

  // Guardar datos
  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Actualizamos estado local inmediatamente para evitar lagg interaccional
      setStoredValue(valueToStore);
      
      // Guardamos persistentemente
      if (window.electronAPI) {
         await window.electronAPI.writeData(valueToStore);
      } else {
         window.localStorage.setItem('anime_figures_sales', JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return [storedValue, setValue, isLoading];
}
