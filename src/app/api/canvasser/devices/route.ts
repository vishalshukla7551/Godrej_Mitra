import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/canvasser/devices
 * Fetch all available Godrej SKU categories for the dropdown
 */
export async function GET() {
    try {
        // Get distinct categories from GodrejSKU
        const devices = await prisma.godrejSKU.findMany({
            select: {
                id: true,
                Category: true
            },
            distinct: ['Category'],
            orderBy: {
                Category: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            devices
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch devices' },
            { status: 500 }
        );
    }
}
