import { toJpeg } from 'html-to-image';

/**
 * Captura un elemento del DOM y lo descarga como JPG
 * @param {HTMLElement} elementRef Referencia al nodo DOM del recibo
 * @param {string} clienteApodo Apodo del cliente para el nombre
 */
/**
 * Captura un elemento del DOM y lo descarga como JPG
 * @param {HTMLElement} elementRef Referencia al nodo DOM del recibo
 * @param {string} clienteApodo Apodo del cliente para el nombre
 */
export const downloadReceiptAsImage = async (elementRef, clienteApodo) => {
  if (!elementRef) return;

  try {
    // Generar 4 digitos aleatorios
    const random4 = Math.floor(1000 + Math.random() * 9000);
    // Eliminar espacios del nombre
    const safeName = (clienteApodo || 'Cliente').replace(/\s+/g, '');
    const filename = `Recibo_${safeName}_${random4}.jpg`;

    const dataUrl = await toJpeg(elementRef, { 
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 2 // Para mejor resolución
    });

    if (window.electronAPI && window.electronAPI.saveReceipt) {
      const result = await window.electronAPI.saveReceipt(dataUrl, filename);
      return result;
    } else {
      // Fallback para web
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      return { success: true };
    }
  } catch (error) {
    console.error('Error generando recibo:', error);
    throw error;
  }
};

export const downloadReceiptTotalAsImage = async (elementRef, clienteApodo) => {
  if (!elementRef) return;

  try {
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const safeName = (clienteApodo || 'Cliente').replace(/\s+/g, '');
    const filename = `ReciboTotal_${safeName}_${random4}.jpg`;

    const dataUrl = await toJpeg(elementRef, { 
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 2
    });

    if (window.electronAPI && window.electronAPI.saveReceipt) {
      const result = await window.electronAPI.saveReceipt(dataUrl, filename);
      return result;
    } else {
      // Fallback para web
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      return { success: true };
    }
  } catch (error) {
    console.error('Error generando recibo total:', error);
    throw error;
  }
};
