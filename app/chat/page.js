'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  Search, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Edit3, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Bell, 
  RefreshCw, 
  Check, 
  XCircle, 
  Archive, 
  Sparkles,
  PhoneCall,
  User,
  ShoppingBag,
  Filter,
  CheckCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const WA_FALLBACK_NUMBER = '6281511843450';

function formatRupiah(num) {
  if (!num) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function playAdminNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio autoplay policy fallback
  }
}

export default function AdminLiveChatPage() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'closed'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request browser notification
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        alert('Notifikasi desktop aktif! Anda akan diberi tahu jika ada chat pembeli masuk.');
      }
    }
  };

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      let query = supabase
        .from('dapur_chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        setDbError(error.message);
        setRooms([]);
      } else {
        setDbError(null);
        setRooms(data || []);
        // Jika belum ada room aktif terpilih dan list ada, pilih yang pertama
        if (!activeRoomId && data && data.length > 0) {
          setActiveRoomId(data[0].id);
        }
      }
    } catch (err) {
      setDbError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    // Supabase Realtime channel for rooms
    const roomChannel = supabase
      .channel('admin_chat_rooms_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dapur_chat_rooms' },
        (payload) => {
          fetchRooms();
          // Jika ada pesan baru dari customer
          if (payload.new && payload.new.last_sender_role === 'customer' && soundEnabled) {
            playAdminNotificationSound();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Chat Baru dari Pelanggan aduHP', {
                body: `${payload.new.customer_name || 'Pembeli'}: ${payload.new.last_message || 'Tanya stok'}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [soundEnabled]);

  // Fetch Messages for active room
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    async function loadMessages() {
      try {
        const { data, error } = await supabase
          .from('dapur_chat_messages')
          .select('*')
          .eq('room_id', activeRoomId)
          .order('created_at', { ascending: true });

        if (!error && data && isMounted) {
          setMessages(data);

          // Reset unread admin count
          await supabase
            .from('dapur_chat_rooms')
            .update({ unread_admin_count: 0 })
            .eq('id', activeRoomId);

          // Update local room state unread count
          setRooms((prev) =>
            prev.map((r) => (r.id === activeRoomId ? { ...r, unread_admin_count: 0 } : r))
          );
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    }

    loadMessages();

    // Realtime channel for current room's messages
    const messageChannel = supabase
      .channel(`admin_room_messages_${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dapur_chat_messages',
          filter: `room_id=eq.${activeRoomId}`
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_role === 'customer' && soundEnabled) {
            playAdminNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(messageChannel);
    };
  }, [activeRoomId, soundEnabled]);

  // Send Admin Reply
  const handleSendReply = async (customText = null) => {
    const textToSend = (typeof customText === 'string' ? customText : inputMessage).trim();
    if (!textToSend || !activeRoomId) return;

    if (!customText) {
      setInputMessage('');
    }

    const adminName = profile?.full_name || user?.email?.split('@')[0] || 'Admin Dapur';

    const optimisticMessage = {
      id: 'admin_temp_' + Date.now(),
      room_id: activeRoomId,
      sender_role: 'admin',
      sender_name: adminName,
      message: textToSend,
      created_at: new Date().toISOString(),
      is_read: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('dapur_chat_messages')
        .insert({
          room_id: activeRoomId,
          sender_role: 'admin',
          sender_name: adminName,
          message: textToSend,
          is_read: true
        })
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? data : m)));

        // Update room status
        await supabase
          .from('dapur_chat_rooms')
          .update({
            last_message: textToSend,
            last_sender_role: 'admin',
            last_message_at: new Date().toISOString(),
            unread_admin_count: 0
          })
          .eq('id', activeRoomId);

        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoomId
              ? {
                  ...r,
                  last_message: textToSend,
                  last_sender_role: 'admin',
                  last_message_at: new Date().toISOString(),
                  unread_admin_count: 0
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Toggle Room Status (active / closed)
  const handleToggleRoomStatus = async () => {
    if (!activeRoom) return;
    const newStatus = activeRoom.status === 'active' ? 'closed' : 'active';
    try {
      await supabase
        .from('dapur_chat_rooms')
        .update({ status: newStatus })
        .eq('id', activeRoom.id);

      setRooms((prev) =>
        prev.map((r) => (r.id === activeRoom.id ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    // Tab filter
    if (filterTab === 'unread' && (r.unread_admin_count || 0) <= 0) return false;
    if (filterTab === 'closed' && r.status !== 'closed') return false;
    if (filterTab === 'all' && r.status === 'closed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.customer_name || '').toLowerCase().includes(q);
      const matchProd = (r.product_name || '').toLowerCase().includes(q);
      const matchMsg = (r.last_message || '').toLowerCase().includes(q);
      return matchName || matchProd || matchMsg;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E5FF'
          }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Live Chat Pelanggan</span>
              <span style={{ fontSize: '11px', background: 'rgba(198, 255, 0, 0.15)', color: '#C6FF00', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                REALTIME
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
              Pusat bantuan & tanya ketersediaan stok fisik gudang langsung dari pembeli di web
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title={soundEnabled ? 'Notifikasi suara aktif' : 'Notifikasi suara dibisukan'}
          >
            {soundEnabled ? <Volume2 size={15} color="#C6FF00" /> : <VolumeX size={15} color="#888" />}
            <span>{soundEnabled ? 'Suara ON' : 'Suara Muted'}</span>
          </button>

          <button
            onClick={requestNotificationPermission}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Aktifkan notifikasi desktop"
          >
            <Bell size={15} color="#00E5FF" />
            <span>Notifikasi Desktop</span>
          </button>

          <button
            onClick={fetchRooms}
            className="btn btn-secondary btn-sm"
            title="Refresh daftar chat"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* DATABASE WARNING BANNER IF TABLE NOT READY */}
      {dbError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(255, 69, 58, 0.12)',
          border: '1px solid rgba(255, 69, 58, 0.35)',
          color: '#FF6B6B',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <strong>Peringatan Database:</strong> {dbError}. Tabel <code>dapur_chat_rooms</code> belum dibuat di Supabase.
          </div>
          <Link
            href="/schema-setup"
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            Buka Halaman Setup Schema SQL
          </Link>
        </div>
      )}

      {/* MAIN CHAT DESK CONTAINER (2 COLUMNS) */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: '16px',
        minHeight: 0,
        background: '#121318',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0d0e12'
        }}>
          {/* Search Bar */}
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px'
            }}>
              <Search size={15} color="#888" />
              <input
                type="text"
                placeholder="Cari pembeli atau produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12.5px',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {[
                { id: 'all', label: 'Aktif' },
                { id: 'unread', label: 'Belum Dibalas' },
                { id: 'closed', label: 'Selesai' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: filterTab === tab.id ? 'rgba(198, 255, 0, 0.15)' : 'transparent',
                    color: filterTab === tab.id ? '#C6FF00' : '#888',
                    border: filterTab === tab.id ? '1px solid rgba(198, 255, 0, 0.3)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Items List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                Memuat percakapan...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#777', fontSize: '13px' }}>
                Tidak ada obrolan dalam kategori ini.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = room.id === activeRoomId;
                const hasUnread = (room.unread_admin_count || 0) > 0;
                return (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(198, 255, 0, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #C6FF00' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: hasUnread ? '#fff' : '#ccc' }}>
                          {room.customer_name || 'Calon Pembeli'}
                        </span>
                        {hasUnread && (
                          <span style={{
                            fontSize: '9px',
                            background: '#FF453A',
                            color: '#fff',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 900
                          }}>
                            {room.unread_admin_count}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        {new Date(room.last_message_at || room.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Product badge */}
                    <div style={{
                      fontSize: '11.5px',
                      color: '#00E5FF',
                      fontWeight: 700,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Smartphone size={12} />
                      <span>{room.product_name || 'Produk HP'}</span>
                      {room.variant_info?.color && (
                        <span style={{ color: '#888', fontWeight: 400 }}>({room.variant_info.color})</span>
                      )}
                    </div>

                    {/* Snippet message */}
                    <div style={{
                      fontSize: '12px',
                      color: hasUnread ? '#fff' : '#777',
                      fontWeight: hasUnread ? 700 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {room.last_sender_role === 'admin' ? '✓ ' : ''}{room.last_message || 'Mulai tanya stok...'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT ROOM */}
        {activeRoom ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#121318' }}>
            {/* Active Header with Product Info */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeRoom.product_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeRoom.product_image}
                    alt={activeRoom.product_name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      background: '#000',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    background: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888'
                  }}>
                    <Smartphone size={22} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                      {activeRoom.customer_name || 'Calon Pembeli'}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: activeRoom.status === 'active' ? 'rgba(198, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                      color: activeRoom.status === 'active' ? '#C6FF00' : '#888',
                      fontWeight: 800
                    }}>
                      {activeRoom.status === 'active' ? '● Aktif' : 'Selesai'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#00E5FF' }}>{activeRoom.product_name}</strong>
                    {activeRoom.variant_info && (
                      <span>
                        • {activeRoom.variant_info.ram}GB/{activeRoom.variant_info.storage}GB ({activeRoom.variant_info.color})
                        • {formatRupiah(activeRoom.variant_info.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeRoom.product_id && (
                  <Link
                    href={`/products/${activeRoom.product_id}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Buka halaman edit stok produk di dapur"
                  >
                    <Edit3 size={13} color="#C6FF00" />
                    <span>Edit Stok Produk</span>
                  </Link>
                )}

                <a
                  href={`https://wa.me/${WA_FALLBACK_NUMBER}?text=${encodeURIComponent(
                    `Halo Admin, terkait pertanyaan produk ${activeRoom.product_name} oleh ${activeRoom.customer_name}:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#25D366' }}
                  title="Hubungi melalui WhatsApp"
                >
                  <PhoneCall size={13} />
                  <span>WhatsApp (+6281511843450)</span>
                </a>

                <button
                  onClick={handleToggleRoomStatus}
                  className="btn btn-secondary btn-sm"
                  title={activeRoom.status === 'active' ? 'Tandai percakapan selesai' : 'Buka kembali'}
                >
                  {activeRoom.status === 'active' ? <CheckCircle2 size={14} color="#10b981" /> : <RefreshCw size={14} />}
                  <span>{activeRoom.status === 'active' ? 'Tandai Selesai' : 'Buka Lagi'}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{isAdmin ? (msg.sender_name || 'Admin Dapur') : (activeRoom.customer_name || 'Pembeli')}</span>
                      <span>•</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{
                      padding: '11px 16px',
                      borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isAdmin ? 'linear-gradient(135deg, #00E5FF 0%, #00a0b2 100%)' : 'rgba(255, 255, 255, 0.08)',
                      color: isAdmin ? '#000' : '#eee',
                      fontSize: '13.5px',
                      lineHeight: '1.45',
                      fontWeight: isAdmin ? 700 : 500,
                      wordBreak: 'break-word',
                      boxShadow: isAdmin ? '0 4px 16px rgba(0, 229, 255, 0.25)' : 'none'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Replies */}
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              <span style={{ fontSize: '11px', color: '#666', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                ⚡ Quick Reply:
              </span>
              {[
                `Halo kak! Fisik varian ${activeRoom.variant_info?.color || ''} ready di gudang, segel BNIB resmi siap kirim hari ini.`,
                'Stok varian ini fisik tinggal 1 unit kak, silakan langsung di-checkout sebelum kehabisan.',
                'Unit 100% garansi resmi PT, segel green peel utuh dan lolos uji 35 titik QC Lab kami.',
                'Mohon maaf kak, varian warna ini sedang restock 2 hari lagi. Apakah ingin varian warna lain?'
              ].map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReply(text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#bbb',
                    padding: '5px 10px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00E5FF';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#bbb';
                  }}
                >
                  {text.slice(0, 36)}...
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#0d0e12',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <input
                type="text"
                placeholder={`Balas pesan ke ${activeRoom.customer_name || 'Pembeli'}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00E5FF'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                style={{
                  padding: '12px 20px',
                  background: inputMessage.trim() ? '#00E5FF' : 'rgba(255, 255, 255, 0.1)',
                  color: inputMessage.trim() ? '#000' : '#666',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <span>Kirim</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            gap: '12px'
          }}>
            <MessageSquare size={44} color="#333" />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              Pilih salah satu percakapan di sebelah kiri
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#555' }}>
              Pesan baru dari calon pembeli akan muncul secara realtime
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
