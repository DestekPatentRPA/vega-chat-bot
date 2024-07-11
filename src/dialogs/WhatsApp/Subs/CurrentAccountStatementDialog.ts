// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { TButton } from 'cxperium-bot-engine/lib/types/whatsapp/message';
import {
	getCurrentAccountStatement,
	getUserInformation,
} from '../../../helpers/SQLConnection';
import { createPdf, removePdfFromPath } from '../../../helpers/PDFCreator';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {
		const customerId = await this.conversation.getCache('customerId');
		const sqlResult = await getCurrentAccountStatement(customerId);
		const userInformation = await getUserInformation(customerId);
		sqlResult.forEach((x) => {
			x.MİKTAR = formatNumberToLocale(x.MİKTAR);
			x.TUTAR = formatNumberToLocale(x.TUTAR);
			x.ÖDENEN = formatNumberToLocale(x.ÖDENEN);
			x.KALAN = formatNumberToLocale(x.KALAN);
		});
		console.table(sqlResult);
		const result = await createPdf(
			sqlResult,
			userInformation,
			`cari-hesap-ekstresi.pdf`,
			1,
		);

		if (result.status) {
			const button: TButton[] = [
				{
					id: '#main_menu',
					title: '🏠 Ana Menü',
				},
			];
			await this.sendButtonMessage(
				'🍃 Bilgilendirme Mesajı',
				'🍃 Vega Gıda A.Ş.',
				`Sayın *${this.contact.userProfileName}*, belgeniz hazırlanmaktadır. Bu süreçte *Ana Menüye* aşağıdaki buton ile devam edebilir diğer işlemlerinizi yapabilirsiniz.`,
				button,
			);
			await new Promise((r) => setTimeout(r, 3000));
		} else {
			await this.sendMessage(
				'Sistemsel bir problem mevcuttur. Lütfen bizimle iletişime geçiniz.',
			);
			return;
		}

		const url = `${process.env.PUBLIC_URL}cari-hesap-ekstresi.pdf`;
		await this.sendDocumentWithUrl('Cari Hesap Ekstresi', url);
		// await removePdfFromPath(result.outputPath);
	}
}

function formatNumberToLocale(numberString) {
	const number = parseFloat(numberString);
	const formattedNumber = number.toLocaleString('tr-TR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return formattedNumber;
}
