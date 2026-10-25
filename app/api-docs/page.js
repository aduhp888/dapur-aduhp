'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Code2, ExternalLink, Copy, Check, Smartphone, Terminal, RefreshCw } from 'lucide-react';

export default function ApiDocsPage() {
  const [jsonResponse, setJsonResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedDart, setCopiedDart] = useState(false);
  const [endpointParam, setEndpointParam] = useState('all');

  useEffect(() => {
    fetchLiveApi(endpointParam);
  }, [endpointParam]);

  async function fetchLiveApi(param) {
    setLoading(true);
    try {
      const url = param === 'all' ? '/api/products' : `/api/products?condition=${param}`;
      const res = await fetch(url);
      const data = await res.json();
      setJsonResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setJsonResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  const curlCommand = `curl -X GET "https://dapur.aduhp.com/api/products?condition=second" \\
  -H "Accept: application/json"`;

  const dartCode = `// Flutter Dart (Android & iPhone)
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<ProductModel>> fetchAduHPProducts() async {
  final url = Uri.parse('https://dapur.aduhp.com/api/products');
  final response = await http.get(url, headers: {'Accept': 'application/json'});

  if (response.statusCode == 200) {
    final Map<String, dynamic> jsonBody = json.decode(response.body);
    final List<dynamic> productsJson = jsonBody['data'];
    return productsJson.map((e) => ProductModel.fromJson(e)).toList();
  } else {
    throw Exception('Failed to load products from dapur.aduhp.com');
  }
}`;

  function copyText(text, type) {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedDart(true);
      setTimeout(() => setCopiedDart(false), 2000);
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={24} color="#00e5ff" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            API Mobile: Android & iPhone JSON Feed
          </h1>
        </div>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
          Endpoint RESTful JSON yang disediakan oleh <code>dapur.aduhp.com</code> untuk diintegrasikan ke aplikasi mobile Flutter.
        </p>
      </div>

      {/* Grid of endpoints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>GET</span>
            <span style={{ fontSize: '11px', color: '#666', fontFamily: 'var(--font-mono)' }}>Semua Produk</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
            /api/products
          </div>
          <p style={{ fontSize: '11.5px', color: '#777', marginTop: '6px' }}>
            Mengambil seluruh katalog HP aktif (BNIB dan Second).
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>GET</span>
            <span style={{ fontSize: '11px', color: '#666', fontFamily: 'var(--font-mono)' }}>Filter Second</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
            /api/products?condition=second
          </div>
          <p style={{ fontSize: '11.5px', color: '#777', marginTop: '6px' }}>
            Khusus HP Second bersertifikat dengan hasil QC 35 titik.
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)' }}>POST</span>
            <span style={{ fontSize: '11px', color: '#666', fontFamily: 'var(--font-mono)' }}>Input Unit</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
            /api/products
          </div>
          <p style={{ fontSize: '11.5px', color: '#777', marginTop: '6px' }}>
            Payload JSON untuk menyimpan produk baru ke database.
          </p>
        </div>
      </div>

      {/* Code Snippets: Flutter Dart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={16} color="#00e5ff" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Snippet Integrasi Flutter (Android & iPhone)
            </span>
          </div>
          <button
            onClick={() => copyText(dartCode, 'dart')}
            className="btn btn-secondary btn-sm"
          >
            {copiedDart ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            <span>{copiedDart ? 'Tersalin' : 'Salin Kode Dart'}</span>
          </button>
        </div>
        <pre className="code-preview-box" style={{ maxHeight: '220px' }}>
          {dartCode}
        </pre>
      </div>

      {/* Live Interactive Tester */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="#10b981" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Live API Response Preview
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={endpointParam}
              onChange={(e) => setEndpointParam(e.target.value)}
              className="form-select"
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              <option value="all">GET /api/products (Semua)</option>
              <option value="baru">GET /api/products?condition=baru</option>
              <option value="second">GET /api/products?condition=second</option>
            </select>

            <button
              onClick={() => fetchLiveApi(endpointParam)}
              className="btn btn-secondary btn-sm"
              title="Refresh Response"
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
            </button>

            <a
              href={`/api/products${endpointParam !== 'all' ? `?condition=${endpointParam}` : ''}`}
              target="_blank"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={12} /> Buka Tab Baru
            </a>
          </div>
        </div>

        <pre className="code-preview-box" style={{ maxHeight: '350px' }}>
          {loading ? '// Mengambil data live...' : jsonResponse}
        </pre>
      </div>
    </div>
  );
}
