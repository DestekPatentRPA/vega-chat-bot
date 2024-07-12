import * as sql from 'mssql';

const config: sql.config = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_DATABASE,
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

async function getUserIdData(customerPhone: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('cleanPhone', sql.NVarChar(50), customerPhone).query(`
				SELECT CustomerId
        		FROM dbo.Currents
        		WHERE REPLACE(REPLACE(REPLACE(REPLACE(Tel,'-',''),' ',''),')',''),'(','') = @cleanPhone
          `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getUserIdData2(customerPhone: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerPhone', sql.NVarChar(50), customerPhone).query(`
			SELECT COUNT(CustomerId) AS PhoneCount FROM 
			(SELECT CustomerId, REPLACE(REPLACE(REPLACE(Replace(Tel,'-',''),' ',''),')',''),'(','') 
			AS TelNoClean FROM dbo.Currents WHERE Tel IS NOT NULL) AS PERSONLIST
			WHERE PERSONLIST.TelNoClean = @customerPhone
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getUserInformation(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CustomerName AS [AD SOYAD], TaxNumber AS [TC KİMLİK], CONVERT(varchar, DateBirth,104) AS [DOĞUM TARİHİ], FatherName AS [BABA ADI] FROM Currents WHERE CustomerId = '324 21863568582';
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getProducerReceiptList(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT Ettn as ETTN, DocumentId as [BELGE NO], NetQuantity as [NET MİKTAR], UnitPrice as [BİRİM FİYAT], NetAmount as [NET TUTAR], CONVERT(varchar, DocuemntDate, 104) AS [DOKÜMAN TARİHİ]
				FROM FarmerMovents WHERE CurrentID = @customerId;
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

//Toplan Satılan Çay Miktarı Sorgusu
async function getTotalTeaSold(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT 'Toplam satılan çay miktarı *' + convert(varchar,convert(decimal(8,2),SUM([Net Miktar]))) + '* kilogramdır.'
				FROM ViewBuyingFarmerDocument
				WHERE ([Müstahsil Kodu] = @customerId)
            `);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

//Kalan Alacak Bakiyesi Sorgusu
async function getRemainingReceivableBalance(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CASE 
				WHEN SUM(COALESCE([Net Tutar]- [ÖDENEN],0)) > 0 THEN  convert(varchar,convert(decimal(8,2),SUM([Net Tutar]- [ÖDENEN]))) + ' ALACAK BORÇ BAKİYESİ BULUNMAKTADIR'
				WHEN SUM(COALESCE([Net Tutar]- [ÖDENEN],0)) < 0 THEN  convert(varchar,convert(decimal(8,2),SUM([Net Tutar]- [ÖDENEN]))) + ' TL BORÇ BAKİYESİ BULUNMAKTADIR'
				WHEN SUM(COALESCE([Net Tutar]- [ÖDENEN],0)) = 0 THEN '*0 TL* borç veya alacak bakiyesi bulunmamaktadır.'
				END AS BAKIYEDURUM
				FROM
				(
					SELECT [Net Tutar], 0.00 AS [ÖDENEN]
					FROM ViewBuyingFarmerDocument
					WHERE ([Müstahsil Kodu] = @customerId)
					UNION ALL
					SELECT  0.00 AS [Net Tutar], BD.Balance AS [ÖDENEN]
					FROM BankMasters BM
						LEFT JOIN BankDetails BD ON BD.MasterId=BM.ID
					WHERE (BD.AccountID= @customerId)
					UNION ALL
					SELECT 0.00 AS [Net Tutar], CD.Balance AS [ÖDENEN]
					FROM CashMasters CM
						LEFT JOIN CashDetails CD ON CD.MasterId=CM.ID
					WHERE (CD.AccountID= @customerId)
				) AS DIPTOPLAM
            `);
		console.log(result);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getCurrentAccountStatement(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CONVERT(varchar, Tarih, 104) AS [TARİH], [Alım Yeri Adı] AS [ALIM YERİ], [Ödeme Adı] AS [ALIM PLANI], [Belge No] AS [EVRAK NO], [Birim Fiyat] AS [BRÜT FİYAT], [Net Miktar] AS [MİKTAR (KG)],
				[Net Tutar] AS TUTAR, [ÖDENEN],
				SUM(COALESCE([Net Tutar]-[ÖDENEN], 0)) OVER (ORDER BY Tarih ASC) AS KALAN
				FROM (
				SELECT Tarih, [Alım Yeri Adı], [Ödeme Adı], [Belge No], CONVERT(DECIMAL(10,2),[Birim Fiyat]) AS [Birim Fiyat], [Net Miktar], [Net Tutar], 0.00 AS [ÖDENEN]
				FROM ViewBuyingFarmerDocument
				WHERE ([Müstahsil Kodu] = @customerId)
				UNION ALL
				SELECT BM.Date as Tarih,'' AS [Alım Yeri Adı], PP.PaymentName AS [Ödeme Adı], BM.DocumentID AS [Belge No], 0.00 AS [Birim Fiyat], 0.00 AS [Net Miktar],
				0.00 AS [Net Tutar], BD.Balance AS [ÖDENEN]
				FROM BankMasters BM
					LEFT JOIN BankDetails BD ON BD.MasterId=BM.ID
					LEFT JOIN PaymentPlans PP ON PP.PaymentID=BM.PaymentID AND PP.BranchID=BM.BranchID
				WHERE (BD.AccountID = @customerId)
				UNION ALL
				SELECT CM.Date as Tarih,'' AS [Alım Yeri Adı], PP.PaymentName AS [Ödeme Adı], CM.DocumentID AS [Belge No], 0.00 AS [Birim Fiyat], 0.00 AS [Net Miktar],
				0.00 AS [Net Tutar], CD.Balance AS [ÖDENEN]
				FROM CashMasters CM
					LEFT JOIN CashDetails CD ON CD.MasterId=CM.ID
					LEFT JOIN PaymentPlans PP ON PP.PaymentID=CM.PaymentID AND PP.BranchID=CM.BranchID
				WHERE (CD.AccountID = @customerId)
				) X ORDER BY Tarih ASC
            `);
		await sql.close();
		return result.recordset.sort((a, b) => {
			const [dayA, monthA, yearA] = a.TARİH.split('.');
			const [dayB, monthB, yearB] = b.TARİH.split('.');
			const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
			const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
			return dateA.getTime() - dateB.getTime();
		});
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getPaymentsMade(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CONVERT(varchar,BM.Date,104) as TARİH,PP.PaymentName AS [ÖDEME ADI], BM.DocumentID AS [BELGE NO], BD.Balance AS [ÖDENEN]
				FROM BankMasters BM
					LEFT JOIN BankDetails BD ON BD.MasterId=BM.ID
					LEFT JOIN PaymentPlans PP ON PP.PaymentID=BM.PaymentID AND PP.BranchID=BM.BranchID
				WHERE (BD.AccountID = @customerId)
				UNION ALL
				SELECT CONVERT(varchar, CM.Date, 104) AS TARİH, PP.PaymentName AS [Ödeme Adı], CM.DocumentID AS [Belge No], CD.Balance AS [ÖDENEN]
				FROM CashMasters CM
					LEFT JOIN CashDetails CD ON CD.MasterId=CM.ID
					LEFT JOIN PaymentPlans PP ON PP.PaymentID=CM.PaymentID AND PP.BranchID=CM.BranchID
				WHERE (CD.AccountID = @customerId)
            `);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

export {
	getUserIdData,
	getUserIdData2,
	getUserInformation,
	getProducerReceiptList,
	getTotalTeaSold,
	getRemainingReceivableBalance,
	getCurrentAccountStatement,
	getPaymentsMade,
};
