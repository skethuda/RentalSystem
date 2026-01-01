import { useEffect, useState } from 'react';
import { dbQuery } from '../../../lib/supabase';

export default function AdditionalInfo() {
  const [houseRules, setHouseRules] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await dbQuery('site_settings')
        .select('house_rules, additional_info')
        .single()
        .execute();

      if (error && error.code !== 'PGRST116') {
        console.error('Ek bilgiler yüklenirken hata:', error);
      } else if (data) {
        setHouseRules(data.house_rules || '');
        setAdditionalInfo(data.additional_info || '');
      }
    } catch (error) {
      console.error('Ek bilgiler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Her iki bölüm de boşsa hiçbir şey gösterme
  if ((!houseRules || houseRules.trim() === '') && (!additionalInfo || additionalInfo.trim() === '')) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">Ek Bilgiler</h2>
        
        <div className="space-y-6">
          {/* Ev Kuralları Bölümü */}
          {houseRules && houseRules.trim() !== '' && (
            <div className="bg-[#F5F5DC] rounded-xl p-6 border border-[#E8E8D3]">
              <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Ev Kuralları</h3>
              <div 
                className="text-gray-700 leading-relaxed house-rules-content"
                dangerouslySetInnerHTML={{ __html: houseRules }}
              />
            </div>
          )}

          {/* Ek Bilgiler Bölümü (İkonlu Liste) */}
          {additionalInfo && additionalInfo.trim() !== '' && (
            <div className="space-y-3">
              <div 
                className="text-gray-700 leading-relaxed additional-info-content"
                dangerouslySetInnerHTML={{ __html: additionalInfo }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Ev Kuralları Stilleri */
        .house-rules-content ul,
        .house-rules-content ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .house-rules-content li {
          margin-bottom: 0.75rem;
          padding-left: 0;
          line-height: 1.6;
        }
        .house-rules-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .house-rules-content strong {
          font-weight: 600;
          color: #2C2C2C;
        }

        /* Ek Bilgiler Stilleri - İkonlu Liste */
        .additional-info-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .additional-info-content li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          padding: 0;
          line-height: 1.6;
        }
        .additional-info-content li > *:first-child {
          flex: 1;
        }
        /* Varsayılan mavi check ikonu */
        .additional-info-content li::before {
          content: '✓';
          width: 24px;
          height: 24px;
          min-width: 24px;
          border-radius: 50%;
          background-color: #3B82F6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          flex-shrink: 0;
        }
        /* Özel class'lar için ikon renkleri */
        .additional-info-content li.info::before {
          background-color: #3B82F6;
          content: '✓';
        }
        .additional-info-content li.warning::before {
          background-color: #F59E0B;
          content: '!';
        }
        .additional-info-content li.error::before {
          background-color: #EF4444;
          content: '✕';
        }
        .additional-info-content p {
          margin-bottom: 0.5rem;
        }
        .additional-info-content a {
          color: #D4AF37;
          text-decoration: underline;
        }
        .additional-info-content a:hover {
          color: #B8960D;
        }
        .additional-info-content strong {
          font-weight: 600;
          color: #2C2C2C;
        }
      `}</style>
    </section>
  );
}
