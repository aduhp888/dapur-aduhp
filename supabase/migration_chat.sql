-- ==============================================================================
-- MIGRATION: LIVE CHAT TANYA STOK (aduHP & Dapur aduHP)
-- Fitur: Chat Realtime Calon Pembeli ke Admin Panel dapur.aduhp.com
-- ==============================================================================

-- 1. TABEL: dapur_chat_rooms (Sesi Room Percakapan Produk)
CREATE TABLE IF NOT EXISTS public.dapur_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Calon Pembeli',
    customer_phone TEXT,
    customer_email TEXT,
    product_id UUID,
    product_name TEXT,
    product_image TEXT,
    variant_info JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message TEXT,
    last_sender_role TEXT DEFAULT 'customer',
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_admin_count INT DEFAULT 1,
    unread_customer_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dapur_chat_rooms_session ON public.dapur_chat_rooms(session_id);
CREATE INDEX IF NOT EXISTS idx_dapur_chat_rooms_status ON public.dapur_chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_dapur_chat_rooms_last_msg ON public.dapur_chat_rooms(last_message_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_dapur_chat_rooms_updated_at ON public.dapur_chat_rooms;
CREATE TRIGGER trigger_dapur_chat_rooms_updated_at
BEFORE UPDATE ON public.dapur_chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. TABEL: dapur_chat_messages (Daftar Pesan Realtime)
CREATE TABLE IF NOT EXISTS public.dapur_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.dapur_chat_rooms(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin', 'system')),
    sender_name TEXT NOT NULL DEFAULT 'Pengguna',
    message TEXT NOT NULL,
    product_snapshot JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dapur_chat_messages_room ON public.dapur_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_dapur_chat_messages_created ON public.dapur_chat_messages(created_at ASC);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.dapur_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dapur_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Operations dapur_chat_rooms" ON public.dapur_chat_rooms;
CREATE POLICY "Allow All Operations dapur_chat_rooms" ON public.dapur_chat_rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Operations dapur_chat_messages" ON public.dapur_chat_messages;
CREATE POLICY "Allow All Operations dapur_chat_messages" ON public.dapur_chat_messages FOR ALL USING (true) WITH CHECK (true);

-- 4. REALTIME PUBLICATION ENABLEMENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'dapur_chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dapur_chat_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'dapur_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dapur_chat_messages;
  END IF;
END $$;
