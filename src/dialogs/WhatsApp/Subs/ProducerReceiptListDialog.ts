// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { TButton } from 'cxperium-bot-engine/lib/types/whatsapp/message';
// import {
// 	getProducerReceiptList,
// 	getUserInformation,
// } from '../../../helpers/SQLConnection';
// import { createPdf, removePdfFromPath } from '../../../helpers/PDFCreator';
// import { TRow } from 'cxperium-bot-engine/lib/types/whatsapp/message';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {
		const button: TButton[] = [
			{
				id: '#main_menu',
				title: '🏠 Ana Menü',
			},
		];
		await this.sendButtonMessage(
			'🍃 Bilgilendirme Mesajı',
			'🍃 Vega Gıda A.Ş.',
			`Sayın *${this.conversation.getCache('userName')}*, şu anda bu modülümüz yapım aşamasındadır..*Ana Menüye* aşağıdaki buton ile devam edebilir diğer işlemlerinizi yapabilirsiniz.`,
			button,
		);
		// const customerId = await this.conversation.getCache('customerId');
		// const sqlResult = await getProducerReceiptList(customerId);
		// const userInformation = await getUserInformation(customerId);
		// const ETTN: TRow[] = [];
		// sqlResult.forEach((x) => {
		// 	ETTN.push({
		// 		id: '#logo_' + x.ETTN,
		// 		title: '🧾' + x['BELGE NO'],
		// 		description: x.ETTN,
		// 	});
		// });
		// ETTN.push({
		// 	id: '#main_menu',
		// 	title: '🏠 Ana Menü',
		// 	description: 'Vega Gıda A.Ş.',
		// });
		// const result = await createPdf(
		// 	sqlResult,
		// 	userInformation,
		// 	'mustahsil-makbuz-listesi.pdf',
		// 	3,
		// );

		// if (result.status) {
		// 	const a = await this.sendListMessage(
		// 		'🍃 Bilgilendirme Mesajı',
		// 		'🍃 Vega Gıda A.Ş.',
		// 		`Sayın *${this.conversation.getCache('userName')}*, belgeniz hazırlanmaktadır. Bu süreçte *Ana Menüye* aşağıdaki buton ile devam edebilir diğer işlemlerinizi yapabilirsiniz.`,
		// 		'ETTN Listesi',
		// 		ETTN,
		// 	);
		// 	console.log(a);
		// 	await new Promise((r) => setTimeout(r, 3000));
		// } else {
		// 	await this.sendMessage(
		// 		'Sistemsel bir problem mevcuttur. Lütfen bizimle iletişime geçiniz.',
		// 	);
		// 	return;
		// }

		// const url = `${process.env.PUBLIC_URL}mustahsil-makbuz-listesi.pdf`;
		// await this.sendDocumentWithUrl('Mustahsil Makbuz Listesi', url);
		// await removePdfFromPath(result.outputPath);
	}
}
