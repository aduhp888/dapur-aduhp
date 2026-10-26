import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatIDR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('dapur_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: 'error', message: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Also fetch checklist for this product if available
    const { data: checklist } = await supabase
      .from('dapur_checklist')
      .select('*')
      .eq('product_id', id);

    return NextResponse.json({
      status: 'success',
      data: {
        ...data,
        formatted_price: formatIDR(data.price),
        checklist: checklist || [],
      },
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    delete updateData.id;

    const { data, error } = await supabase
      .from('dapur_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Produk berhasil diupdate',
      data,
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('dapur_products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Produk berhasil dihapus dari dapur_products',
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
