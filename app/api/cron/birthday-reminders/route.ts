import { NextResponse } from 'next/server';
import { checkBirthdays } from '@/app/utils/checkBirthdays';

export async function GET(request: Request) {
  try {
    // Verificar el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que sea la hora correcta (8 AM ± 5 minutos)
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour !== 8 || minute > 5) {
      return NextResponse.json({
        success: false,
        error: 'This endpoint should only be called at 8:00 AM'
      });
    }

    const result = await checkBirthdays();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in birthday reminder cron:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Prevenir que la ruta se llame con demasiada frecuencia
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar cada hora 