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
	const page = pdfDoc.addPage([900, 260 + data.length * 15]);

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

	//Dipnot ekleme
	const annotation =
		'Dikkat: Yalnızca Bilgilendirme Amaçlıdır. Bu belgede yer alan bilgilerin doğruluğundan emin olunmasına rağmen, herhangi bir farklılık veya sorun durumunda lütfen derhal fabrika ile iletişime geçiniz. Herhangi bir uyuşmazlık veya belirsizlik halinde, fabrikamızın sağladığı bilgiler esas alınmalıdır.';
	page.drawText(annotation, {
		x: width / 2 - fontHeader.widthOfTextAtSize(annotation, 6) / 2,
		y: fontHeader.heightAtSize(6),
		size: 6,
		font: fontHeader,
		color: rgb(0, 0, 0),
	});

	//Logo ekle
	await drawLogo(pdfDoc, page, height);

	//Tarih ekle
	const headerFontSize = 10;
	drawDate(page, width, height, font, fontHeader, headerFontSize);

	let yPosition = 100 + data.length * 15;

	const headers: string[] = getHeaders(headerType);
	const cellWidth = (width - 40) / headers.length;
	const cellHeight = 15;

	// Kişi Bilgilerini Ekleme bölümü
	const rowFontSize = 8;
	yPosition -= cellHeight;

	drawUserInformation(
		cellWidth,
		cellHeight,
		page,
		yPosition,
		fontHeader,
		font,
		informationData,
	);

	// // Tablo Başlıkları ekle
	headers.forEach((header, index) => {
		const xPosition = 20 + cellWidth * index;
		page.drawRectangle({
			x: xPosition,
			y: yPosition + 15,
			width: cellWidth,
			height: cellHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(10 / 15, 10 / 15, 10 / 15),
		});
		page.drawText(header, {
			x:
				xPosition +
				cellWidth / 2 -
				fontHeader.widthOfTextAtSize(header, 10) / 2,
			y: yPosition + 18.5,
			size: headerFontSize,
			font: fontHeader,
			color: rgb(0, 0, 0),
		});
	});

	//Verileri ekle
	data.forEach((row) => {
		headers.forEach((header, index) => {
			const xPosition = 20 + cellWidth * index;
			let cellValue =
				String(row[header]) == 'null' ? '---' : String(row[header]);
			const isEvenRow = Math.floor(yPosition / cellHeight) % 2 === 0;
			const cellColor = isEvenRow
				? rgb(215 / 255, 215 / 255, 215 / 255)
				: rgb(1, 1, 1);

			const fontColor =
				row['ÖDENEN'] != '0' && headerType == 1
					? rgb(1, 0, 0)
					: rgb(0, 0, 0);
			page.drawRectangle({
				x: xPosition,
				y: yPosition,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
				color: cellColor,
			});
			if (header == 'MİKTAR (KG)') {
				if (
					cellValue == '0' ||
					cellValue == null ||
					cellValue == '---'
				) {
					cellValue = '';
				} else {
					cellValue = formatNumberToLocale(cellValue);
				}
				page.drawText(cellValue, {
					x:
						xPosition +
						cellWidth -
						fontHeader.widthOfTextAtSize(cellValue, 10) -
						2.5,
					y: yPosition + 3.5,
					size: 10,
					font: fontHeader,
					color: fontColor,
				});
			} else if (header == 'TUTAR' || header == 'KALAN') {
				if (cellValue == '0') {
					cellValue = '';
				} else {
					cellValue = formatNumberToLocale(cellValue) + ' TL';
				}
				page.drawText(cellValue, {
					x:
						xPosition +
						cellWidth -
						fontHeader.widthOfTextAtSize(cellValue, 10) -
						2.5,
					y: yPosition + 3.5,
					size: 10,
					font: fontHeader,
					color: fontColor,
				});
			} else if (header == 'ÖDENEN' || header == 'BRÜT FİYAT') {
				if (cellValue == '0') {
					cellValue = '';
				} else {
					cellValue = formatNumberToLocale(cellValue) + ' TL';
				}
				page.drawText(cellValue, {
					x:
						xPosition +
						cellWidth -
						fontHeader.widthOfTextAtSize(cellValue, 10) -
						2.5,
					y: yPosition + 3.5,
					size: 10,
					font: fontHeader,
					color: fontColor,
				});
			} else {
				page.drawText(cellValue, {
					x: xPosition + 2.5,
					y: yPosition + 3.5,
					size: rowFontSize,
					font: fontHeader,
					color: fontColor,
				});
			}
			page.drawRectangle({
				x: xPosition,
				y: yPosition,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
		yPosition -= 15;
	});

	if (headerType == 1) {
		drawSummaryTableForCurrentAccountStatement(
			data,
			cellWidth,
			cellHeight,
			page,
			yPosition,
			fontHeader,
		);
	} else if (headerType == 2) {
		drawSummaryTableForPaymentsMade(
			data,
			cellWidth,
			cellHeight,
			page,
			yPosition,
			fontHeader,
		);
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
			'ALIM YERİ',
			'ALIM PLANI',
			'EVRAK NO',
			'BRÜT FİYAT',
			'MİKTAR (KG)',
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

async function drawLogo(pdfDoc, page, height) {
	const logoPath = path.resolve(__dirname, '../public/VegaCay.png');
	const logoBytes = fs.readFileSync(logoPath);
	const logo = await pdfDoc.embedPng(logoBytes);
	page.drawImage(logo, {
		x: 20,
		y: height - 60,
		width: 100,
		height: 40,
	});
}

function drawDate(page, width, height, font, fontHeader, headerFontSize) {
	let day = '';
	let month = '';
	let year = '';
	const a = new Date().toLocaleString().split(' ')[0];
	[day, month, year] = a.split('.');
	const date = `${day}.${month}.${year}`;
	page.drawText(date, {
		x: width - font.widthOfTextAtSize(date, headerFontSize) - 30,
		y: height - fontHeader.heightAtSize(24),
		font: fontHeader,
		size: headerFontSize,
		color: rgb(0, 0, 0),
	});
}

function drawUserInformation(
	cellWidth,
	cellHeight,
	page,
	yPosition,
	fontHeader,
	font,
	informationData: Array<{ [key: string]: string }>,
) {
	const informationHeaders = ['AD SOYAD', 'DOĞUM TARİHİ', 'BABA ADI'];
	informationHeaders.forEach((info, index) => {
		const xPosition = 20 + cellWidth * index;
		page.drawRectangle({
			x: xPosition,
			y: yPosition + 40 + cellHeight,
			width: cellWidth,
			height: cellHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(10 / 15, 10 / 15, 10 / 15),
		});

		page.drawText(info, {
			x:
				xPosition +
				cellWidth / 2 -
				fontHeader.widthOfTextAtSize(info, 10) / 2,
			y: yPosition + 58.5,
			size: 10,
			font: fontHeader,
			color: rgb(0, 0, 0),
		});
	});

	informationData.forEach((row) => {
		informationHeaders.forEach((header, index) => {
			const cellValue = row[header];
			const xPosition = 30 + cellWidth * index;
			page.drawText(cellValue, {
				x: xPosition - 5,
				y: yPosition + 43.5,
				size: 10,
				font: fontHeader,
				color: rgb(0, 0, 0),
			});
			page.drawRectangle({
				x: xPosition - 10,
				y: yPosition + 40,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
	});
}

function drawSummaryTableForCurrentAccountStatement(
	data: Array<{ [key: string]: string }>,
	cellWidth: number,
	cellHeight: number,
	page,
	yPosition,
	fontHeader,
) {
	let toplamMiktar = 0;
	let toplamTutar = 0.0;
	let toplamOdenen = 0.0;
	const toplamKalan = parseFloat(data[data.length - 1].KALAN);
	data.forEach((x) => {
		if (x['MİKTAR (KG)'] != null) {
			toplamMiktar = parseFloat(x['MİKTAR (KG)']) + toplamMiktar;
		}
		toplamTutar = parseFloat(x.TUTAR) + toplamTutar;
		toplamOdenen = parseFloat(x.ÖDENEN) + toplamOdenen;
	});
	const summaryHeaders = [
		'Toplam Miktar (KG)',
		'Toplam Tutar',
		'Toplam Ödenen',
		'Toplam Kalan',
	];
	summaryHeaders.forEach((summary, index) => {
		const xPosition = 20 + cellWidth * (index + 5);
		page.drawRectangle({
			x: xPosition,
			y: yPosition,
			width: cellWidth,
			height: cellHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(10 / 15, 10 / 15, 10 / 15),
		});
		page.drawText(summary, {
			x:
				xPosition +
				cellWidth / 2 -
				fontHeader.widthOfTextAtSize(summary, 9) / 2,
			y: yPosition + 3.5,
			size: 9,
			font: fontHeader,
			color: rgb(0, 0, 0),
		});
	});
	const summaryTexts = [
		{
			['Toplam Miktar (KG)']: `${toplamMiktar.toLocaleString('tr-TR')}`,
			['Toplam Tutar']: `${toplamTutar.toLocaleString('tr-TR')}`,
			['Toplam Ödenen']: `${toplamOdenen.toLocaleString('tr-TR')}`,
			['Toplam Kalan']: `${toplamKalan.toLocaleString('tr-TR')}`,
		},
	];
	yPosition -= cellHeight;
	summaryTexts.forEach((row) => {
		summaryHeaders.forEach((header, index) => {
			const cellValue =
				header == 'Toplam Miktar (KG)'
					? row[header]
					: row[header] + ' TL';
			const xPosition = 20 + cellWidth * (index + 5);
			page.drawText(cellValue, {
				x:
					xPosition +
					cellWidth -
					fontHeader.widthOfTextAtSize(cellValue, 10) -
					2.5,
				y: yPosition + 3.5,
				size: 10,
				font: fontHeader,
				color: rgb(0, 0, 0),
			});
			page.drawRectangle({
				x: xPosition,
				y: yPosition,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
	});
}
function drawSummaryTableForPaymentsMade(
	data: Array<{ [key: string]: string }>,
	cellWidth: number,
	cellHeight: number,
	page,
	yPosition,
	fontHeader,
) {
	let toplamOdenen = 0.0;
	data.forEach((x) => {
		toplamOdenen = parseFloat(x.ÖDENEN) + toplamOdenen;
	});
	const summaryHeaders = ['Toplam Ödenen'];
	summaryHeaders.forEach((summary, index) => {
		const xPosition = 20 + cellWidth * (index + 3);
		page.drawRectangle({
			x: xPosition,
			y: yPosition,
			width: cellWidth,
			height: cellHeight,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1,
			color: rgb(10 / 15, 10 / 15, 10 / 15),
		});
		page.drawText(summary, {
			x:
				xPosition +
				cellWidth / 2 -
				fontHeader.widthOfTextAtSize(summary, 10) / 2,
			y: yPosition + 3.5,
			size: 10,
			font: fontHeader,
			color: rgb(0, 0, 0),
		});
	});
	const summaryTexts = [
		{
			['Toplam Ödenen']: `${toplamOdenen.toLocaleString('tr-TR')}`,
		},
	];
	yPosition -= cellHeight;
	summaryTexts.forEach((row) => {
		summaryHeaders.forEach((header, index) => {
			const cellValue =
				header == 'Toplam Miktar' ? row[header] : row[header] + ' TL';
			const xPosition = 20 + cellWidth * (index + 3);
			page.drawText(cellValue, {
				x:
					xPosition +
					cellWidth -
					fontHeader.widthOfTextAtSize(cellValue, 10) -
					2.5,
				y: yPosition + 3.5,
				size: 10,
				font: fontHeader,
				color: rgb(0, 0, 0),
			});
			page.drawRectangle({
				x: xPosition,
				y: yPosition,
				width: cellWidth,
				height: cellHeight,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1,
			});
		});
	});
}

// async function drawBackGround(pdfDoc, page, width, height) {
// 	const bgPath = path.resolve(__dirname, '../public/vega.png');
// 	const bgBytes = fs.readFileSync(bgPath);
// 	const bg = await pdfDoc.embedPng(bgBytes);
// 	page.drawImage(bg, {
// 		x: width / 2 - 200,
// 		y: height / 2 - 160,
// 		width: 400,
// 		height: 320,
// 		opacity: 0.1,
// 	});
// }

function formatNumberToLocale(numberString) {
	const number = parseFloat(numberString);
	const formattedNumber = number.toLocaleString('tr-TR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return formattedNumber;
}
