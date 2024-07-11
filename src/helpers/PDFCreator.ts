import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as fontkit from '@pdf-lib/fontkit';

export async function createPdf(
	data: Array<{ [key: string]: string }>,
	informationData: Array<{ [key: string]: string }>,
	outputFileName: string,
	headerType: number,
) {
	// Yeni bir PDF belgesi oluştur
	const pdfDoc = await PDFDocument.create();

	// Yeni bir sayfa ekle
	const page = pdfDoc.addPage([900, 400]);

	// Özel bir yazı tipi yükle
	pdfDoc.registerFontkit(fontkit);
	const fontBytes = fs.readFileSync(
		path.join(__dirname, '..', 'public/fonts', 'NotoSans-Regular.ttf'),
	);
	const font = await pdfDoc.embedFont(fontBytes);
	const { width, height } = page.getSize();

	// Başlık ekle
	const fontBytesHeader = fs.readFileSync(
		path.join(__dirname, '..', 'public/fonts', 'NotoSans-SemiBold.ttf'),
	);
	const fontHeader = await pdfDoc.embedFont(fontBytesHeader);
	let title = '';
	if (headerType == 1) {
		title = 'Vega Gıda San. A. Ş.\nCari Hesap Ekstresi';
	} else if (headerType == 2) {
		title = 'Vega Gıda San. A. Ş.\nYapılan Ödemeler';
	} else title = 'Vega Gıda San. A. Ş.\nMüstahsil Makbuz Listesi';
	page.drawText(title, {
		x: width / 2 - fontHeader.widthOfTextAtSize(title, 16) / 4,
		y: height - fontHeader.heightAtSize(24),
		size: 16,
		font: fontHeader,
		color: rgb(0, 0, 0),
	});

	//Logo ekle
	const logoPath = path.resolve(__dirname, '../public/VegaCay.png');
	const logoBytes = fs.readFileSync(logoPath);
	const logo = await pdfDoc.embedPng(logoBytes);
	page.drawImage(logo, {
		x: 30,
		y: height - 60,
		width: 100,
		height: 40,
	});

	//Background ekle
	const bgPath = path.resolve(__dirname, '../public/vega.png');
	const bgBytes = fs.readFileSync(bgPath);
	const bg = await pdfDoc.embedPng(bgBytes);
	page.drawImage(bg, {
		x: width / 2 - 200,
		y: height / 2 - 160,
		width: 400,
		height: 320,
		opacity: 0.05,
	});

	//Tarih ekle
	const headerFontSize = 12;
	const date = new Date().toLocaleDateString();
	page.drawText(date, {
		x: width - font.widthOfTextAtSize(date, headerFontSize) - 30,
		y: height - fontHeader.heightAtSize(24),
		font: fontHeader,
		size: headerFontSize,
		color: rgb(0, 0, 0),
	});

	// Tablo Başlıkları ekle
	let yPosition = 280;
	const headers: string[] = getHeaders(headerType);

	const cellWidth = (width - 60) / headers.length;
	const cellHeight = 20;

	const informationHeaders = ['AD SOYAD', 'DOĞUM TARİHİ', 'BABA ADI'];
	informationHeaders.forEach((info, index) => {
		const xPosition = 30 + cellWidth * index;
		page.drawText(info, {
			x: xPosition + 3,
			y: yPosition + 35,
			size: headerFontSize,
			font,
			color: rgb(0, 0, 0),
		});
		page.drawRectangle({
			x: xPosition,
			y: yPosition + 10,
			width: cellWidth,
			height: cellHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(10 / 15, 10 / 15, 10 / 15),
		});
	});

	// Verileri ekle
	const rowFontSize = 8;
	yPosition -= cellHeight;

	informationData.forEach((row) => {
		informationHeaders.forEach((header, index) => {
			const cellValue = row[header];
			const xPosition = 30 + cellWidth * index;
			page.drawText(cellValue, {
				x: xPosition + 5,
				y: yPosition + 37.5,
				size: rowFontSize,
				font,
				color: rgb(0, 0, 0),
			});
			page.drawRectangle({
				x: xPosition,
				y: yPosition + 50,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
	});

	headers.forEach((header, index) => {
		const xPosition = 30 + cellWidth * index;
		page.drawText(header, {
			x: xPosition + 5,
			y: yPosition + 17.5,
			size: headerFontSize,
			font,
			color: rgb(0, 0, 0),
		});
	});

	// Verileri ekle
	data.forEach((row) => {
		headers.forEach((header, index) => {
			const cellValue =
				String(row[header]) == 'undefined'
					? '---'
					: String(row[header]);
			const xPosition = 30 + cellWidth * index;
			page.drawText(cellValue, {
				x: xPosition + 5,
				y: yPosition + 5,
				size: rowFontSize,
				font,
				color: rgb(0, 0, 0),
			});
			page.drawRectangle({
				x: xPosition,
				y: yPosition,
				width: cellWidth,
				height: cellHeight + 10,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
		yPosition -= 15;
	});

	if (headerType == 1) {
		let toplamMiktar = 0;
		let toplamTutar = 0.0;
		let toplamOdenen = 0.0;
		const toplamKalan = parseFloat(data[data.length - 1].KALAN);
		data.forEach((x) => {
			toplamMiktar = parseInt(x.MİKTAR) + toplamMiktar;
			toplamTutar = parseFloat(x.TUTAR) + toplamTutar;
			toplamOdenen = parseFloat(x.ÖDENEN) + toplamOdenen;
		});
		const summaryTexts = [
			`Toplam Miktar: ${toplamMiktar.toLocaleString('tr-TR')}`,
			`Toplam Tutar: ${toplamTutar.toLocaleString('tr-TR')} TL`,
			`Toplam Ödenen: ${toplamOdenen.toLocaleString('tr-TR')} TL`,
			`Toplam Kalan: ${toplamKalan.toLocaleString('tr-TR')} TL`,
		];
		yPosition -= cellHeight;
		summaryTexts.forEach((summary, i) => {
			const xPosition = width - (cellWidth + 50);
			page.drawText(summary, {
				x: xPosition + 5,
				y: yPosition - (i + 1) * cellHeight + 40,
				size: rowFontSize,
				font: fontHeader,
				color: rgb(0, 0, 0),
			});
		});
	}

	// PDF dosyasını kaydet
	const pdfBytes = await pdfDoc.save();

	// Dosya yolunu belirle
	const outputDir = path.resolve(__dirname, '../public/files');
	const outputPath = path.join(outputDir, outputFileName);

	// 'pdfs' dizinini oluştur (eğer yoksa)
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	// PDF dosyasını belirli bir dizine kaydet
	fs.writeFileSync(outputPath, pdfBytes);

	return { status: true, outputPath: outputPath };

	// PDF dosyasını silmek için
	// fs.unlinkSync(outputPath);
}

export async function removePdfFromPath(pdfPath: string) {
	await new Promise((r) => setTimeout(r, 10000));
	fs.unlinkSync(pdfPath);
}

function getHeaders(headerType: number) {
	let headers = [];
	if (headerType == 1) {
		headers = [
			'TARİH',
			'ALIM YERI',
			'ALIM PLANI',
			'EVRAK NO',
			'FİYAT',
			'MİKTAR',
			'TUTAR',
			'ÖDENEN',
			'KALAN',
		];
	} else if (headerType == 2) {
		headers = ['TARİH', 'ÖDEME ADI', 'BELGE NO', 'ÖDENEN'];
	} else if (headerType == 3) {
		headers = [
			'ETTN',
			'BELGE NO',
			'NET MİKTAR',
			'BİRİM FİYAT',
			'NET TUTAR',
			'DOKÜMAN TARİHİ',
		];
	}

	return headers;
}
