// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { TButton } from 'cxperium-bot-engine/lib/types/whatsapp/message';
import { getPaymentsMade } from '../../../helpers/SQLConnection';
import { createPdf, removePdfFromPath } from '../../../helpers/PDFCreator';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {
		const customerId = await this.conversation.getCache('customerId');
		const sqlResult = await getPaymentsMade(customerId);
		const result = await createPdf(sqlResult, 'yapilan-odemeler.pdf', 2);

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

		const url = `${process.env.PUBLIC_URL}yapilan-odemeler.pdf`;
		await this.sendDocumentWithUrl('Yapılan Ödemeler', url);
		await removePdfFromPath(result.outputPath);
	}
}
