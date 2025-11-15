import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/categories - Lấy tất cả categories cho user hiện tại
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!prisma) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        // Tìm user theo email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Lấy categories của user (chỉ user tự tạo)
        const categories = await prisma.category.findMany({
            where: {
                userId: user.id,
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        console.log('📂 Categories for user:', user.id, '- Count:', categories.length);

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}// POST /api/categories - Tạo category mới cho user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!prisma) {
            return NextResponse.json({ error: 'Database not available' }, { status: 503 });
        }

        // Tìm user theo email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        } const body = await request.json();
        const { name, slug, icon, color } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists for this user
        const existingCategory = await prisma.category.findUnique({
            where: {
                slug_userId: {
                    slug,
                    userId: user.id,
                },
            },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: 'Category with this name already exists' },
                { status: 409 }
            );
        }

        console.log('Creating category for user:', user.id);

        // Create new category
        const newCategory = await prisma.category.create({
            data: {
                name,
                slug,
                icon: icon || '📍',
                color: color || '#3B82F6',
                userId: user.id,
                isDefault: false,
            },
        });

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}