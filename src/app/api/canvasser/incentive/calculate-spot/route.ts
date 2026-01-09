import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/canvasser/incentive/calculate-spot
 * Calculate spot incentive based on category, price, and tenure
 * 
 * This endpoint calculates the incentive amount based on MR Price List data
 * stored in the database (yellow header / newer incentive plan)
 * 
 * Body:
 * {
 *   category: string (e.g., "Refrigerator", "Washing Machine"),
 *   invoicePrice: number,
 *   tenure: number (1, 2, 3, or 4 years)
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { category, invoicePrice, tenure } = body;

        // Validate required fields
        if (!category || !invoicePrice || !tenure) {
            return NextResponse.json(
                { error: 'Missing required fields: category, invoicePrice, tenure' },
                { status: 400 }
            );
        }

        // Validate tenure
        if (![1, 2, 3, 4].includes(tenure)) {
            return NextResponse.json(
                { error: 'Invalid tenure. Must be 1, 2, 3, or 4 years' },
                { status: 400 }
            );
        }

        const price = parseInt(invoicePrice);
        if (isNaN(price) || price <= 0) {
            return NextResponse.json(
                { error: 'Invalid invoice price' },
                { status: 400 }
            );
        }

        // Find matching incentive record
        // Query: category matches AND price falls within the price range
        const incentiveRecord = await prisma.mRIncentive.findFirst({
            where: {
                category: category,
                minPrice: { lte: price },
                OR: [
                    { maxPrice: { gte: price } },
                    { maxPrice: null } // For ranges like "70000+" with no upper limit
                ]
            }
        });

        if (!incentiveRecord) {
            return NextResponse.json(
                {
                    error: `No incentive plan found for ${category} at price ₹${price}`,
                    incentive: 0
                },
                { status: 404 }
            );
        }

        // Get incentive amount based on tenure
        let incentiveAmount = 0;
        switch (tenure) {
            case 1:
                incentiveAmount = incentiveRecord.incentive1Year;
                break;
            case 2:
                incentiveAmount = incentiveRecord.incentive2Year;
                break;
            case 3:
                incentiveAmount = incentiveRecord.incentive3Year;
                break;
            case 4:
                incentiveAmount = incentiveRecord.incentive4Year;
                break;
        }

        return NextResponse.json(
            {
                success: true,
                incentive: incentiveAmount,
                details: {
                    category: incentiveRecord.category,
                    priceRange: incentiveRecord.priceRange,
                    tenure: `${tenure} Year${tenure > 1 ? 's' : ''}`,
                    invoicePrice: price
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error in POST /api/canvasser/incentive/calculate-spot', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
