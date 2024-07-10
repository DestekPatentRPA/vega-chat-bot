import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as fontkit from '@pdf-lib/fontkit';

export async function createPdf(
	data: Array<{ [key: string]: string }>,
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
	const title = 'Vega Gıda A. Ş.';
	page.drawText(title, {
		x: width / 2 - font.widthOfTextAtSize(title, 24) / 2,
		y: height - 50,
		size: 24,
		font,
		color: rgb(0, 0, 0),
	});

	//Logo ekle
	const logoPath = path.resolve(__dirname, '../public/vega.png');
	const logoBytes = fs.readFileSync(logoPath);
	const logo = await pdfDoc.embedPng(logoBytes);
	page.drawImage(logo, {
		x: 30,
		y: 325,
		width: 100,
		height: 60,
	});

	// Tablo Başlıkları ekle
	const headerFontSize = 12;
	let yPosition = 300;
	let headers: string[];

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

	const cellWidth = (width - 60) / headers.length;
	const cellHeight = 20;

	headers.forEach((header, index) => {
		const xPosition = 30 + cellWidth * index;
		page.drawText(header, {
			x: xPosition + 5,
			y: yPosition - 2.5,
			size: headerFontSize,
			font,
			color: rgb(0, 0, 0),
		});
	});

	// Verileri ekle
	const rowFontSize = 8;
	yPosition -= cellHeight;

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

	// Özet bilgiler eklemek için aşağıyı kullanabilirsiniz(BERK)
	// const summaryTexts = [
	// 	'Toplam Borç: 1000 TL',
	// 	'Toplam Alacak: 500 TL',
	// 	'Toplam Bakiye: 1500 TL',
	// ];
	// summaryTexts.forEach((summary, i) => {
	// 	page.drawText(summary, {
	// 		x: 50,
	// 		y: yPosition - i * 20,
	// 		size: fontSize,
	// 		font,
	// 		color: rgb(0, 0, 0),
	// 	});
	// });

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
