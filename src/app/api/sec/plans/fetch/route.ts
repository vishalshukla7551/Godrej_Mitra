import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { category, price } = await req.json();
        const invoicePrice = parseInt(price);

        if (!category || isNaN(invoicePrice)) {
            return NextResponse.json({ error: 'Invalid category or price' }, { status: 400 });
        }

        // 1. Find the GodrejSKU by Category name
        // The frontend sends 'REF', 'WM' etc. We need to map these IDs to DB Category names
        // OR the frontend can send the full Category name.
        // Let's assume frontend sends the ID (e.g. 'REF') and we map it, OR frontend sends mapped name.
        // Let's check frontend: devices array has { id: 'REF', ModelName: 'Refrigerator' }
        // It's safer to rely on ModelName (which matches DB Category).

        // However, the frontend 'deviceId' state holds the ID ('REF'). 
        // I should probably send the ModelName from frontend or map it here.
        // Let's assume receiving the ModelName (e.g., 'Refrigerator') directly is easier.

        const sku = await prisma.godrejSKU.findFirst({
            where: {
                Category: category
            }
        });

        if (!sku) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // 2. Fetch all plans for this SKU
        const allPlans = await prisma.plan.findMany({
            where: {
                godrejSKUId: sku.id
            }
        });

        // 3. Filter plans based on price range
        const applicablePlans = allPlans.filter(plan => {
            const range = plan.priceRange; // e.g., "10001-20000" or "70000+"
            if (!range) return false;

            if (range.endsWith('+')) {
                const min = parseInt(range.replace('+', ''));
                return invoicePrice >= min;
            } else {
                const [minStr, maxStr] = range.split('-');
                const min = parseInt(minStr);
                const max = parseInt(maxStr);
                return invoicePrice >= min && invoicePrice <= max;
            }
        });

        // 4. Sort plans by price/type if needed
        // (Optional)

        return NextResponse.json({ plans: applicablePlans });

    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
