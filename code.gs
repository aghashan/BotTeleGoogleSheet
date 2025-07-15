const spreadsheetId = 'IDGoogleSheet';
const barangSheet = 'Barang';
const penjualanSheet = 'Penjualan';

const botHandle = '@UsernameBot';
const botToken = 'BotToken';
const appsScriptUrl  = 'WebAppUrl(didapat setelah melakukan deploy)';
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

function formatDate() {
  const date = new Date();
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function sendTelegramMessage(chatId, replyToMessageId, textMessage) {
  const url = `${telegramApiUrl}/sendMessage`;
  const data = {
    parse_mode: 'HTML',
    chat_id: chatId,
    reply_to_message_id: replyToMessageId,
    text: textMessage,
    disable_web_page_preview: true,
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
  };
  return UrlFetchApp.fetch(url, options).getContentText();
}

function parseMessage(message = '') {
  const splitted = message.split('\n');
  let kodeBarang = '', nama = '', qty = '', harga = '';
  splitted.forEach(el => {
    if (el.toLowerCase().includes('kode barang:')) kodeBarang = el.split(':')[1].trim();
    if (el.toLowerCase().includes('nama:')) nama = el.split(':')[1].trim();
    if (el.toLowerCase().includes('qty:')) qty = el.split(':')[1].trim();
    if (el.toLowerCase().includes('harga:')) harga = el.split(':')[1].trim();
  });
  const result = { kodeBarang, nama, qty, harga };
  const isEmpty = !kodeBarang && !nama && !qty && !harga;
  return isEmpty ? false : result;
}

function inputDataOrder(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(barangSheet);
    const lastRow = sheet.getLastRow();
    const nextRow = lastRow + 1;

    const kodeBarangInput = data.kodeBarang.toLowerCase().trim();
    const existingList = sheet.getRange(`C2:C${lastRow}`).getValues().flat().map(r => r.toString().toLowerCase().trim());
    if (existingList.includes(kodeBarangInput)) {
      return false; 
    }

    const today = formatDate();

    sheet.insertRowAfter(lastRow);
    sheet.getRange(`A${nextRow}`).setValue(nextRow - 1);        
    sheet.getRange(`B${nextRow}`).setValue(today);              
    sheet.getRange(`C${nextRow}`).setValue(data.kodeBarang);    
    sheet.getRange(`D${nextRow}`).setValue(data.nama);          
    sheet.getRange(`E${nextRow}`).setValue(Number(data.qty));   
    sheet.getRange(`F${nextRow}`).setValue(0);                  
    sheet.getRange(`G${nextRow}`).setValue(Number(data.qty));  
    sheet.getRange(`H${nextRow}`).setValue(Number(data.harga));

    return true;
  } catch (err) {
    return false;
  }
}

function updateStock(kodeBarang, qtyTerjual) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(barangSheet);
  const terjualSheet = spreadsheet.getSheetByName(penjualanSheet);
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(`C2:C${lastRow}`).getValues();

  let foundRow = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i][0].toString().toLowerCase().trim() === kodeBarang.toLowerCase().trim()) {
      foundRow = i + 2;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, message: 'Kode Barang tidak ditemukan.' };
  }

  if (isNaN(qtyTerjual) || qtyTerjual <= 0) {
    return { success: false, message: 'Qty terjual harus angka positif.' };
  }

  const qtyMasuk = Number(sheet.getRange(`E${foundRow}`).getValue()) || 0;
  const qtyKeluar = Number(sheet.getRange(`F${foundRow}`).getValue()) || 0;
  const updatedQtyKeluar = qtyKeluar + qtyTerjual;
  const updatedQtyAkhir = qtyMasuk - updatedQtyKeluar;

  if (updatedQtyAkhir < 0) {
    return { success: false, message: 'Stok tidak cukup. Qty Akhir akan negatif.' };
  }

  
  sheet.getRange(`F${foundRow}`).setValue(updatedQtyKeluar); 
  sheet.getRange(`G${foundRow}`).setValue(updatedQtyAkhir);  

  const namaBarang = sheet.getRange(`D${foundRow}`).getValue();
  const hargaBarang = sheet.getRange(`H${foundRow}`).getValue(); 
  const today = formatDate();

 
  const lastRowTerjual = terjualSheet.getLastRow();
  const kodeBarangList = terjualSheet.getRange(`A2:A${lastRowTerjual}`).getValues().flat();
  let terjualRow = -1;

  for (let i = 0; i < kodeBarangList.length; i++) {
    if (kodeBarangList[i].toString().toLowerCase().trim() === kodeBarang.toLowerCase().trim()) {
      terjualRow = i + 2;
      break;
    }
  }
  const totalHarga = hargaBarang * qtyTerjual; 
  if (terjualRow !== -1) {
    const existingQty = Number(terjualSheet.getRange(`C${terjualRow}`).getValue()) || 0;
    terjualSheet.getRange(`C${terjualRow}`).setValue(existingQty + qtyTerjual);
    terjualSheet.getRange(`D${terjualRow}`).setValue(today);
    terjualSheet.getRange(`E${terjualRow}`).setValue(totalHarga); 
  } else {
    const nextRow = lastRowTerjual + 1;
    terjualSheet.insertRowAfter(lastRowTerjual);
    terjualSheet.getRange(`A${nextRow}`).setValue(kodeBarang);
    terjualSheet.getRange(`B${nextRow}`).setValue(namaBarang);
    terjualSheet.getRange(`C${nextRow}`).setValue(qtyTerjual);
    terjualSheet.getRange(`D${nextRow}`).setValue(today);
    terjualSheet.getRange(`E${nextRow}`).setValue(Number(totalHarga)); 
  }

  return { success: true };
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const chatId = contents.message.chat.id;
    const receivedTextMessage = contents.message.text.replace(botHandle, '').trim();
    const messageId = contents.message.message_id;
    let messageReply = '';

    if (receivedTextMessage.toLowerCase() === '/start') {
      messageReply = `Halo! Bot aktif dan siap digunakan.`;

    } else if (receivedTextMessage.toLowerCase().startsWith('/input')) {
      const parsedMessage = parseMessage(receivedTextMessage);
      if (parsedMessage) {
        const data = {
          kodeBarang: parsedMessage.kodeBarang,
          nama: parsedMessage.nama,
          qty: parsedMessage.qty,
          harga: parsedMessage.harga
        };
        const success = inputDataOrder(data);
        messageReply = success
          ? `✅ Data berhasil disimpan.`
          : `⚠️ Gagal disimpan. Kode Barang sudah ada.`;
      } else {
        messageReply = '⚠️ Format tidak sesuai atau kosong.';
      }

    } else if (receivedTextMessage.toLowerCase().startsWith('/terjual')) {
      const parsedMessage = parseMessage(receivedTextMessage);
      if (parsedMessage && parsedMessage.kodeBarang && parsedMessage.qty) {
        const qtyTerjual = parseInt(parsedMessage.qty, 10);
        const kodeBarang = parsedMessage.kodeBarang;
        const result = updateStock(kodeBarang, qtyTerjual);
        messageReply = result.success
          ? `✅ Stok diperbarui. Qty terjual: ${qtyTerjual}`
          : `⚠️ Gagal update stok: ${result.message}`;
      } else {
        messageReply = '⚠️ Format salah. Gunakan:\n/terjual\nKode Barang: \nQty: ';
      }

    }else if (receivedTextMessage.toLowerCase().startsWith('/stock')) {
      const parsedMessage = parseMessage(receivedTextMessage);
      if (parsedMessage && parsedMessage.kodeBarang) {
        const kodeBarang = parsedMessage.kodeBarang;
        const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        const sheet = spreadsheet.getSheetByName(barangSheet);
        const lastRow = sheet.getLastRow();
        const values = sheet.getRange(`C2:C${lastRow}`).getValues();

        let foundRow = -1;
        for (let i = 0; i < values.length; i++) {
          if (values[i][0].toString().toLowerCase().trim() === kodeBarang.toLowerCase().trim()) {
            foundRow = i + 2;
            break;
          }
        }

        if (foundRow !== -1) {
          const nama = sheet.getRange(`D${foundRow}`).getValue();
          const qtyMasuk = sheet.getRange(`E${foundRow}`).getValue();
          const qtyKeluar = sheet.getRange(`F${foundRow}`).getValue();
          const qtyAkhir = sheet.getRange(`G${foundRow}`).getValue();
          messageReply = `📦 <b>Stok Barang</b>\nKode: ${kodeBarang}\nNama: ${nama}\nQty Masuk: ${qtyMasuk}\nQty Keluar: ${qtyKeluar}\nQty Akhir: ${qtyAkhir}`;
        } else {
          messageReply = `❌ Kode barang <b>${kodeBarang}</b> tidak ditemukan di data.`;
        }
      } else {
        messageReply = '⚠️ Format salah. Gunakan:\n/stock\nKode Barang: ';
      }
    }
    

    
     else if (receivedTextMessage.toLowerCase() === '/format') {
      messageReply = `Gunakan format berikut:\n\n<pre>/input\nKode Barang: \nNama: \nQty: \nHarga: </pre>\n\n<pre>/terjual\nKode Barang: \nQty: </pre>\n\n<pre>/stock\nKode Barang: </pre>`;
    } else {
      messageReply = `⚠️ Perintah tidak dikenali.\nKetik /format untuk melihat panduan.`;
    }

    sendTelegramMessage(chatId, messageId, messageReply);
  } catch (err) {
    Logger.log('ERROR doPost: ' + err);
  }
}

function setWebhook() {
  const url      = `${telegramApiUrl}/setwebhook?url=${appsScriptUrl}`
  const response = UrlFetchApp.fetch(url).getContentText()
  
  Logger.log(response)
}
