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
				title: '🍃 Toplam Sattığım Çay',
				description: '',
			},
			{
				id: '#PaymentsMade',
				title: '🍃 Bana Yapılan Ödemeler',
				description: '',
			},
			{
				id: '#RemainingReceivableBalance',
				title: '🍃 Kalan Alacak Bakiyem',
				description: '',
			},
			{
				id: '#CurrentAccountStatement',
				title: '🍃 Cari Hesap Ekstrem',
				description: '',
			},
		];

		await this.sendListMessage(
			'🍃 Vega Gıda A.Ş.',
			'',
			`Merhaba *${this.conversation.getCache('userName')}*, ben Vega Dijital Asistanı. Lütfen aşağıdaki listeden yapmak istediğiniz işlemi seçiniz.`,
			'Menüyü göster',
			rows,
		);
	}
}
