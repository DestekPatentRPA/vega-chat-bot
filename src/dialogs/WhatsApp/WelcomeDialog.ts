// Node modules.
import {
	IDialog,
	ServiceWhatsappBaseDialog,
	TBaseDialogCtor,
} from 'cxperium-bot-engine';
import { TRow } from 'cxperium-bot-engine/lib/types/whatsapp/message';

export default class extends ServiceWhatsappBaseDialog implements IDialog {
	constructor(data: TBaseDialogCtor) {
		super(data);
	}

	async runDialog(): Promise<void> {
		const rows: TRow[] = [
			// {
			// 	id: '#ProducerReceiptList',
			// 	title: '🍃 Müstahsil Makbuzlar',
			// 	description: '',
			// },
			{
				id: '#TotalTeaSold',
				title: '🍃 Toplam Satılan Çay',
				description: '',
			},
			{
				id: '#PaymentsMade',
				title: '🍃 Yapılan Ödemeler',
				description: '',
			},
			{
				id: '#RemainingReceivableBalance',
				title: '🍃 Kalan Alacak Bakiyesi',
				description: '',
			},
			{
				id: '#CurrentAccountStatement',
				title: '🍃 Cari Hesap Ekstresi',
				description: '',
			},
		];

		await this.sendListMessage(
			'🍃 Vega Gıda A.Ş.',
			'',
			`Merhaba *${this.contact.userProfileName}*, ben Vega Dijital Asistanı. Lütfen aşağıdaki listeden yapmak istediğiniz işlemi seçiniz.`,
			'Menüyü göster',
			rows,
		);
	}
}
