import { ChatMessage, Attachment } from "../types";

const WEBHOOK_URL = "https://n8n.suattayfuntopak.com/webhook/n8n-mentor";

function oturumIdGetir(): string {
  const anahtar = "n8n_mentor_oturum_id";
  let oturumId = localStorage.getItem(anahtar);

  if (!oturumId) {
    oturumId = `oturum_${Date.now()}`;
    localStorage.setItem(anahtar, oturumId);
  }

  return oturumId;
}

export const getGeminiResponse = async (
  _messages: ChatMessage[],
  currentText: string,
  attachments: Attachment[]
): Promise<string> => {
  const temizMetin = (currentText || "").trim();

  if (!temizMetin && attachments.length === 0) {
    return "Lütfen bir mesaj yaz.";
  }

  let gonderilecekMesaj = temizMetin;

  if (!temizMetin && attachments.length > 0) {
    gonderilecekMesaj =
      "Dosya veya görsel eklendi. Bu sürümde önce metin tabanlı analiz aktif. Lütfen ekle birlikte ne yapmak istediğini de yaz.";
  }

  if (temizMetin && attachments.length > 0) {
    gonderilecekMesaj += `

Not: ${attachments.length} adet ek seçildi. Bu yeni sürümde arayüz hazır, ancak eklerin n8n tarafında tam işlenmesini bir sonraki adımda açacağız. Şimdilik metin üzerinden yönlendirme yap.`;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oturum_id: oturumIdGetir(),
        kullanici_id: "web_kullanici",
        mesaj: gonderilecekMesaj,
        mod: "mentor",
      }),
    });

    const veri = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(veri?.message || "Webhook çağrısı başarısız oldu.");
    }

    return veri?.cevap || "Şu anda bir yanıt alınamadı.";
  } catch (error) {
    console.error("n8n webhook hatası:", error);
    return "Bağlantı kurulamadı. Lütfen biraz sonra tekrar deneyin.";
  }
};