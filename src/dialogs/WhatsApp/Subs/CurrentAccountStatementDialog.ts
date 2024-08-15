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
				`Sayın *${this.conversation.getCache('userName')}*, belgeniz hazırlanmaktadır. Bu süreçte *Ana Menüye* aşağıdaki buton ile devam edebilir diğer işlemlerinizi yapabilirsiniz.`,
				button,
			);
		} else {
			await this.sendMessage(
				'Sistemsel bir problem mevcuttur. Lütfen bizimle iletişime geçiniz.',
			);
			return;
		}

		const url = 'https://vega.squad4x.com/files/cari-hesap-ekstresi.pdf';
		const a = await this.sendDocumentWithUrl('Cari Hesap Ekstresi', url);
		console.log(a);
		await new Promise((r) => setTimeout(r, 30000));
		await removePdfFromPath(result.outputPath);
	}
}
