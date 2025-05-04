interface DolarBlueResponse {
  venta: number;
  compra: number;
}

export async function getDolarBlue(): Promise<DolarBlueResponse> {
  try {
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const data = await response.json();
    return {
      venta: data.blue.value_sell,
      compra: data.blue.value_buy
    };
  } catch (error) {
    console.error('Error fetching dolar blue:', error);
    return {
      venta: 0,
      compra: 0
    };
  }
} 